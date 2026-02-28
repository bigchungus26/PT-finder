import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/components/layout/AppLayout';
import {
  Sparkles,
  Send,
  Users,
  Settings,
  Calendar,
  HelpCircle,
  Loader2,
  Bot,
  User
} from 'lucide-react';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useUserCourses } from '@/hooks/useCourses';
import { useGroups } from '@/hooks/useGroups';
import { useAuth } from '@/contexts/AuthContext';

import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: Users, label: 'Find a group', prompt: 'How do I find a study group that matches my courses and schedule?' },
  { icon: HelpCircle, label: 'How matching works', prompt: 'How does the matching algorithm work? What affects my match scores?' },
  { icon: Calendar, label: 'Sessions & RSVP', prompt: 'How do study sessions work? How do I create one or RSVP?' },
  { icon: Settings, label: 'Manage courses', prompt: 'How do I add or remove courses from my profile?' },
];

const getInitialMessages = (firstName: string): Message[] => [
  {
    id: '1',
    role: 'assistant',
    content: `Hi ${firstName}! I'm your StudyHub assistant. I can help you with:\n\n• **Finding groups** - Browse, filter, and join study groups\n• **Understanding matches** - How match scores work\n• **Sessions** - Scheduling and RSVPing to study sessions\n• **Course Q&A** - Posting questions and getting answers\n• **Profile & settings** - Managing your courses and preferences\n\nWhat can I help you with?`,
    timestamp: new Date(),
  },
];

const AIAssistant = () => {
  const { user } = useAuth();
  const { data: profile } = useCurrentProfile();
  const { data: userCourses = [] } = useUserCourses(user?.id);
  const { data: allGroups = [] } = useGroups();
  const firstName = profile?.name?.split(' ')[0] ?? 'there';
  const [messages, setMessages] = useState<Message[]>(() => getInitialMessages(firstName));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Build user context for the AI
  const userGroupNames = allGroups
    .filter(g => g.group_members?.some(m => m.user_id === user?.id))
    .map(g => g.name);
  const userCourseNames = userCourses.map(c => c.courses?.code).filter(Boolean) as string[];

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

    // Build messages for API (last 20 for context window)
    const apiMessages = messages
      .filter((m) => m.role !== 'assistant' || m.content)
      .slice(-20)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    apiMessages.push({ role: 'user', content: userContent });

    let content: string;
    try {
      // Get the user's session token so the edge function auth succeeds
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

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
              courses: userCourseNames,
              groups: userGroupNames,
            },
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        if (result?.error === 'AI not configured' || result?.message?.includes('OPENAI_API_KEY')) {
          content =
            "The AI assistant isn't configured yet. Add an OPENAI_API_KEY in Supabase Edge Function secrets.";
        } else {
          content = `Something went wrong (${response.status}): ${result?.message || result?.error || response.statusText}`;
        }
      } else if (typeof result?.content === 'string') {
        content = result.content;
      } else {
        content = "I couldn't get a response. Please try again.";
      }
    } catch (e: any) {
      content = `Failed to reach the AI assistant: ${e.message || 'Check your connection.'}`;
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
                Here to help you get the most out of StudyHub
              </p>
            </div>
          </div>
        </div>

        {/* Quick prompts */}
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
                placeholder="Ask me about StudyHub features..."
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
              I help you navigate StudyHub. For academic questions, use the Course Q&A feature.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIAssistant;
