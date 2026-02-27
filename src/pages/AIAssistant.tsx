import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/components/layout/AppLayout';
import { 
  Sparkles, 
  Send, 
  Lightbulb,
  Calendar,
  BookOpen,
  HelpCircle,
  ListChecks,
  Brain,
  Loader2,
  Bot,
  User
} from 'lucide-react';
import { useCurrentProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: Calendar, label: 'Create study plan', prompt: 'Create a weekly study plan for my courses: CS101 and MATH201' },
  { icon: BookOpen, label: 'Explain a concept', prompt: 'Explain the concept of ' },
  { icon: HelpCircle, label: 'Practice questions', prompt: 'Generate 5 practice questions about ' },
  { icon: ListChecks, label: 'Flashcards', prompt: 'Create flashcards for ' },
  { icon: Brain, label: 'Quiz me', prompt: 'Quiz me on the topic of ' },
  { icon: Lightbulb, label: 'Study tips', prompt: 'Give me study tips for ' },
];

const getInitialMessages = (firstName: string): Message[] => [
  {
    id: '1',
    role: 'assistant',
    content: `Hi ${firstName}! 👋 I'm your AI study assistant. I can help you with:\n\n• **Study plans** - Create a personalized schedule\n• **Explanations** - Break down complex topics\n• **Practice** - Generate quizzes and flashcards\n• **Summaries** - Condense your notes\n\nWhat would you like help with today?`,
    timestamp: new Date(),
  },
];

const AIAssistant = () => {
  const { data: profile } = useCurrentProfile();
  const firstName = profile?.name?.split(' ')[0] ?? 'there';
  const [messages, setMessages] = useState<Message[]>(() => getInitialMessages(firstName));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

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
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { messages: apiMessages },
      });

      if (error) {
        // Try to extract structured error from the response context
        let parsed: { error?: string; message?: string } | null = null;
        try {
          const ctx = (error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            parsed = await ctx.json();
          }
        } catch {
          // context not available or not JSON
        }

        if (parsed?.error === 'AI not configured' || parsed?.message?.includes('OPENAI_API_KEY')) {
          content =
            "The AI assistant isn't configured yet. Your project maintainer can add an API key in Supabase (Edge Function secrets: OPENAI_API_KEY). You can use OpenAI, Groq, or local Ollama\u2014see the repo README.";
        } else {
          content = parsed?.message || 'Something went wrong. Please try again or check that the AI assistant is configured.';
        }
      } else if (typeof data?.content === 'string') {
        content = data.content;
      } else {
        content = "I couldn't get a response. Please try again.";
      }
    } catch {
      content = 'Failed to reach the AI assistant. Check your connection and try again.';
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
                AI Study Assistant
              </h1>
              <p className="text-sm text-muted-foreground">
                Your personal tutor, available 24/7
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
                placeholder="Ask me anything about your studies..."
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
              AI responses are for learning support only. Always verify important information with your professor.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIAssistant;
