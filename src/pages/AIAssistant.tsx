import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/components/layout/AppLayout';
import {
  Sparkles,
  Send,
  Calendar,
  HelpCircle,
  GraduationCap,
  Users,
  Loader2,
  Bot,
  User,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useUserCourses } from '@/hooks/useCourses';
import { useTutors } from '@/hooks/useTutors';
import { useMyBookings } from '@/hooks/useBookings';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: GraduationCap, label: 'Find a tutor', prompt: 'I need help finding a tutor for my courses. Can you recommend someone based on my schedule and goals?' },
  { icon: HelpCircle, label: 'How booking works', prompt: 'How do I book a session with a tutor? Walk me through the process.' },
  { icon: Calendar, label: 'My bookings', prompt: 'Do I have any upcoming bookings this week?' },
  { icon: BookOpen, label: 'Course recommendations', prompt: 'Based on my enrolled courses, which tutors would be the best fit for me?' },
  { icon: Users, label: 'Study groups', prompt: 'How do I find or create a study group?' },
  { icon: GraduationCap, label: 'Become a tutor', prompt: 'How do I become a tutor on StudyHub? What do I need to set up?' },
];

const getInitialMessages = (firstName: string, isTutor: boolean): Message[] => [
  {
    id: '1',
    role: 'assistant',
    content: isTutor
      ? `Hi ${firstName}! I'm your LAU StudyHub consultant. I can help you:\n\n- **Optimize your profile** to attract more LAU students\n- **Manage your bookings** and availability\n- **Navigate the app** and use all its features\n- **Answer questions** about how tutoring works on LAU StudyHub\n\nWhat can I help you with?`
      : `Hi ${firstName}! I'm your LAU StudyHub consultant. I can help you:\n\n- **Find the perfect LAU tutor** for your courses\n- **Manage your bookings** and upcoming sessions\n- **Navigate the app** and discover its features\n- **Get study tips** tailored to your LAU courses\n\nWhat do you need help with?`,
    timestamp: new Date(),
  },
];

const AIAssistant = () => {
  const { user } = useAuth();
  const { data: profile } = useCurrentProfile();
  const { data: userCourses = [] } = useUserCourses(user?.id);
  const { data: tutors = [] } = useTutors();
  const { data: bookings = [] } = useMyBookings();

  const firstName = profile?.name?.split(' ')[0] ?? 'there';
  const isTutor = profile?.user_role === 'tutor';
  const [messages, setMessages] = useState<Message[]>(() => getInitialMessages(firstName, isTutor));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const userCourseNames = userCourses.map(c => c.courses?.code).filter(Boolean) as string[];

  const appContext = useMemo(() => {
    const lines: string[] = [];
    lines.push(`Role: ${profile?.user_role ?? 'student'}`);

    const upcoming = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
    if (upcoming.length > 0) {
      lines.push('Upcoming bookings: ' + upcoming.map(b =>
        `${b.status} session with ${isTutor ? b.student?.name : b.tutor?.name} on ${b.date} at ${b.start_time}`
      ).join('; '));
    } else {
      lines.push('Upcoming bookings: none.');
    }

    if (userCourseNames.length > 0) {
      lines.push('Courses: ' + userCourseNames.join(', ') + '.');
    } else {
      lines.push('Courses: none enrolled.');
    }

    if (!isTutor && tutors.length > 0) {
      const topMatches = tutors.slice(0, 5).map(t => {
        const shared = (t.user_courses ?? []).filter(uc =>
          userCourses.some(myUc => myUc.course_id === uc.course_id)
        );
        return `${t.name} (${(t.rating_avg ?? 0).toFixed(1)} stars, $${t.hourly_rate}/hr${shared.length > 0 ? ', teaches ' + shared.map(s => s.courses?.code).join('/') : ''})`;
      });
      lines.push('Top available tutors: ' + topMatches.join('; '));
    }

    if (profile?.goals?.length) {
      lines.push('Student goals: ' + profile.goals.join(', ') + '.');
    }

    return lines.join('\n');
  }, [bookings, userCourseNames, tutors, userCourses, profile, isTutor]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userContent = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    let content: string;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

      const apiMessages = updatedMessages
        .filter(m => m.id !== '1')
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            messages: apiMessages,
            context: {
              name: profile?.name,
              role: profile?.user_role,
              courses: userCourseNames,
              systemPrompt: `You are an Education Consultant for LAU StudyHub, the tutoring marketplace exclusively for Lebanese American University (LAU Beirut and LAU Byblos). Help the user find the best LAU tutor for their needs, manage bookings, and navigate the platform. When recommending tutors, be specific — mention names, ratings, rates, and shared LAU courses. If the user seems to be struggling with a subject, proactively suggest tutors who specialize in it. All users are LAU students or tutors. Always be encouraging and professional.\n\nUser context:\n${appContext}`,
            },
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        if (result?.error === 'AI not configured' || result?.message?.includes('OPENAI_API_KEY')) {
          content = "The AI assistant isn't configured yet. Add an OPENAI_API_KEY in Supabase Edge Function secrets.";
        } else {
          content = `Something went wrong (${response.status}): ${result?.message || result?.error || response.statusText}`;
        }
      } else if (typeof result?.content === 'string') {
        content = result.content;
      } else {
        content = "I couldn't get a response. The server may have returned an unexpected format. Try again.";
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      content = `Request failed: ${msg}. Make sure you're logged in and the Edge Function is deployed.`;
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 h-[calc(100vh-64px)] lg:h-screen flex flex-col">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                Education Consultant
              </h1>
              <p className="text-sm text-muted-foreground">
                {isTutor
                  ? 'Optimize your profile, manage bookings, and grow your tutoring business'
                  : 'Find the perfect tutor, manage bookings, and get personalized study advice'}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleQuickPrompt(prompt.prompt)}
              className="gap-2"
            >
              <prompt.icon className="w-4 h-4" />
              {prompt.label}
            </Button>
          ))}
        </div>

        <div className="flex-1 bg-card rounded-xl border border-border/50 shadow-soft overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={cn("flex gap-3", message.role === 'user' && "flex-row-reverse")}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  message.role === 'assistant' ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {message.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "max-w-[80%] rounded-xl px-4 py-3",
                  message.role === 'assistant' ? "bg-muted" : "bg-primary text-primary-foreground"
                )}>
                  <div className={cn(
                    "text-sm whitespace-pre-wrap",
                    message.role === 'assistant' ? "text-foreground" : "text-primary-foreground"
                  )}>
                    {message.content.split('\n').map((line, i) => {
                      const isBullet = line.startsWith('- ') || line.startsWith('* ');
                      const parts = line.split(/\*\*(.*?)\*\*/g);
                      return (
                        <span key={i} className={cn("block", isBullet && "ml-2")}>
                          {parts.map((part, j) =>
                            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-xl px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder={isTutor ? "Ask about your bookings, profile tips, or app features..." : "Ask about tutors, bookings, or study help..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              I can recommend tutors, help with bookings, and answer questions about the platform.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIAssistant;
