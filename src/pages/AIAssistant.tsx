import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/components/layout/AppLayout';
import { useMemo } from 'react';
import { 
  Sparkles, 
  Send, 
  Calendar,
  HelpCircle,
  MapPin,
  Users,
  Loader2,
  Bot,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useGroups } from '@/hooks/useGroups';
import { useUpcomingSessions } from '@/hooks/useSessions';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: Calendar, label: 'Sessions this week', prompt: 'Do I have any sessions scheduled this week?' },
  { icon: Users, label: 'How to join a group', prompt: 'How do I join a study group?' },
  { icon: MapPin, label: 'Navigate the app', prompt: 'Where can I see my courses and groups?' },
  { icon: HelpCircle, label: 'How to use features', prompt: 'What can I do in StudyHub and how do I use it?' },
];

const getInitialMessages = (firstName: string): Message[] => [
  {
    id: '1',
    role: 'assistant',
    content: `Hi ${firstName}! 👋 I'm your StudyHub assistant. I can help you:\n\n• **Navigate the app** – find your Dashboard, Courses, Groups, and Settings\n• **Use features** – how to join groups, create sessions, RSVP, and more\n• **Your account** – e.g. "Do I have any sessions this week?" or "What groups am I in?"\n\nI don't teach course content—for that, use your materials or tools like ChatGPT. What do you need?`,
    timestamp: new Date(),
  },
];

const AIAssistant = () => {
  const { user } = useAuth();
  const { data: profile } = useCurrentProfile();
  const { data: allGroups = [] } = useGroups();
  const myGroupIds = useMemo(
    () => allGroups.filter((g) => g.group_members?.some((m) => m.user_id === user?.id)).map((g) => g.id),
    [allGroups, user?.id]
  );
  const { data: upcomingSessions = [] } = useUpcomingSessions(user ? myGroupIds : []);

  const firstName = profile?.name?.split(' ')[0] ?? 'there';
  const [messages, setMessages] = useState<Message[]>(() => getInitialMessages(firstName));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  const appContext = useMemo(() => {
    const lines: string[] = [];
    if (upcomingSessions.length > 0) {
      lines.push('Upcoming sessions: ' + upcomingSessions.map((s) => `${s.title} on ${s.date} at ${s.start_time}`).join('; '));
    } else {
      lines.push('Upcoming sessions: none.');
    }
    const myGroups = allGroups.filter((g) => g.group_members?.some((m) => m.user_id === user?.id));
    if (myGroups.length > 0) {
      lines.push('Groups: ' + myGroups.map((g) => g.name).join(', ') + '.');
    } else {
      lines.push('Groups: none.');
    }
    const courses = profile?.user_courses ?? [];
    if (courses.length > 0) {
      lines.push('Courses: ' + courses.map((uc) => uc.courses?.code ?? uc.course_id).join(', ') + '.');
    } else {
      lines.push('Courses: none.');
    }
    return lines.join('\n');
  }, [upcomingSessions, allGroups, user?.id, profile]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userContent = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let content: string;

    try {
      const apiMessages = messages
        .filter((m) => m.role !== 'assistant' || m.content)
        .slice(-20)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      apiMessages.push({ role: 'user', content: userContent });

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { messages: apiMessages, context: appContext },
      });

      if (error) {
        const err = error as { name?: string; context?: unknown };
        if (import.meta.env.DEV && err?.context) {
          console.error('[AI Assistant] Edge Function error:', err.name, err.context);
        }
        const hint =
          err?.name === 'FunctionsFetchError'
            ? ' Request never reached the server (check Network tab for the functions/v1/ai-chat request). Deploy with: npx supabase functions deploy ai-chat --no-verify-jwt'
            : '';
        content = `Something went wrong: ${error.message}.${hint} Ensure ai-chat is deployed and .env.local matches your Supabase project.`;
      } else if (data?.error) {
        if (data.message?.includes('OPENAI_API_KEY') || data.error === 'AI not configured') {
          content =
            "The AI assistant isn't configured yet. Your project maintainer can add an API key in Supabase (Edge Function secrets: OPENAI_API_KEY). You can use OpenAI, Groq, or local Ollama—see the repo README.";
        } else {
          content = (data.message || data.error) as string;
        }
      } else if (typeof data?.content === 'string') {
        content = data.content;
      } else if (Array.isArray(data?.content)) {
        content = (data.content as unknown[]).map((c) => (typeof c === 'string' ? c : (c as { text?: string })?.text ?? '')).join('');
      } else {
        content = "I couldn't get a response. The server may have returned an unexpected format. Try again.";
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      content = `Request failed: ${msg}. Make sure you're logged in and the Edge Function is deployed for this project.`;
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
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                StudyHub Assistant
              </h1>
              <p className="text-sm text-muted-foreground">
                Navigate the app, find your sessions & groups, get help with features
              </p>
            </div>
          </div>
        </div>

        {/* Quick prompts */}
        <div className="mb-4 flex flex-wrap gap-2">
          {QUICK_PROMPTS.slice(0, 4).map((prompt, index) => (
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

        {/* Chat area */}
        <div className="flex-1 bg-card rounded-xl border border-border/50 shadow-soft overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div 
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' && "flex-row-reverse"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  message.role === 'assistant' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                )}>
                  {message.role === 'assistant' ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className={cn(
                  "max-w-[80%] rounded-xl px-4 py-3",
                  message.role === 'assistant'
                    ? "bg-muted"
                    : "bg-primary text-primary-foreground"
                )}>
                  <div className={cn(
                    "text-sm whitespace-pre-wrap",
                    message.role === 'assistant' ? "text-foreground" : "text-primary-foreground"
                  )}>
                    {message.content.split('\n').map((line, i) => {
                      // Safe markdown rendering — no dangerouslySetInnerHTML
                      const isBullet = line.startsWith('• ');
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

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about the app, your sessions, or how to use a feature..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              I help with the app only—for course content, use your materials or a general AI.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIAssistant;
