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
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

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

const AIAssistant = () => {
  const { profile } = useAuth();
  const firstName = profile?.name?.split(' ')[0] || 'there';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi ${firstName}! 👋 I'm your AI study assistant. I can help you with:\n\n• **Study plans** - Create a personalized schedule\n• **Explanations** - Break down complex topics\n• **Practice** - Generate quizzes and flashcards\n• **Summaries** - Condense your notes\n\nWhat would you like help with today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const responses: Record<string, string> = {
        'study plan': `Here's a suggested weekly study plan based on your courses and availability:\n\n**Monday (2-5pm)**\n• CS101: Review algorithms (1hr)\n• MATH201: Practice integration (1.5hrs)\n• Break + Review notes (30min)\n\n**Wednesday (2-5pm)**\n• CS101: Work on homework problems (1.5hrs)\n• MATH201: Study theorems (1hr)\n• Group study prep (30min)\n\n**Friday (10am-12pm)**\n• Review week's material (1hr)\n• Practice problems (45min)\n• Plan next week (15min)\n\nWould you like me to adjust this schedule?`,
        'explain': `Great question! Let me break this down for you:\n\n**Key Concepts:**\n1. Start with the fundamentals\n2. Build up to more complex ideas\n3. Practice with examples\n\n**Tips:**\n• Try to relate it to something you already know\n• Work through practice problems\n• Teach it to someone else\n\nWould you like me to provide some practice questions on this topic?`,
        'practice': `Here are 5 practice questions:\n\n**Question 1:** [Conceptual]\nExplain the key difference between...\n\n**Question 2:** [Application]\nGiven the following scenario...\n\n**Question 3:** [Problem-solving]\nCalculate the result when...\n\n**Question 4:** [Analysis]\nWhy does this approach work better than...\n\n**Question 5:** [Synthesis]\nDesign a solution that combines...\n\nWant me to check your answers when you're ready?`,
        'flashcard': `Here are your flashcards:\n\n📝 **Card 1**\nFront: What is the definition of...\nBack: The formal definition states...\n\n📝 **Card 2**\nFront: List the key steps in...\nBack: 1. First step 2. Second step 3. Third step\n\n📝 **Card 3**\nFront: When would you use...\nBack: This is best applied when...\n\nShall I create more flashcards or start a quiz?`,
        'default': `I'd be happy to help with that! Based on your question, here are some thoughts:\n\n1. **Understanding the basics** - Make sure you have a solid foundation\n2. **Practice regularly** - Consistency is key\n3. **Ask questions** - Don't hesitate to seek clarification\n\nIs there a specific aspect you'd like me to elaborate on?`,
      };

      const lowerInput = input.toLowerCase();
      let response = responses.default;
      
      if (lowerInput.includes('plan') || lowerInput.includes('schedule')) {
        response = responses['study plan'];
      } else if (lowerInput.includes('explain') || lowerInput.includes('what is')) {
        response = responses.explain;
      } else if (lowerInput.includes('practice') || lowerInput.includes('question')) {
        response = responses.practice;
      } else if (lowerInput.includes('flashcard')) {
        response = responses.flashcard;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
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
                      // Simple markdown parsing
                      let processed = line;
                      // Bold
                      processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                      // Bullet points
                      if (processed.startsWith('• ')) {
                        processed = `<span class="ml-2">${processed}</span>`;
                      }
                      return (
                        <span 
                          key={i} 
                          dangerouslySetInnerHTML={{ __html: processed }}
                          className="block"
                        />
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
