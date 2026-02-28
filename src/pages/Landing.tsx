import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  MessageCircle, 
  Sparkles,
  Shield,
  Clock,
  Target,
  ArrowRight,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">StudyHub</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/onboarding">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 hero-gradient">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              <span>AI-powered study matching</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight slide-up">
              Find your perfect{' '}
              <span className="gradient-text">study group</span>{' '}
              in seconds
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto slide-up" style={{ animationDelay: '0.1s' }}>
              Connect with classmates who match your schedule, study style, and goals. 
              Stop studying alone, find your people.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center slide-up" style={{ animationDelay: '0.2s' }}>
              <Button variant="hero" size="xl" asChild>
                <Link to="/onboarding">
                  Find My Study Group
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="xl"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                See How It Works
              </Button>
            </div>

            {/* Trust signals */}
            <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span>Privacy-first</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>60-second signup</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              How it works
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Get matched with the right study partners in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: '1',
                icon: BookOpen,
                title: 'Add your courses',
                description: 'Tell us what you\'re studying and when you\'re free',
              },
              {
                step: '2',
                icon: Target,
                title: 'Set your goals',
                description: 'Choose your study style and what you want to achieve',
              },
              {
                step: '3',
                icon: Users,
                title: 'Get matched',
                description: 'We\'ll find study partners and groups that fit perfectly',
              },
            ].map((item, index) => (
              <div 
                key={index}
                className="relative bg-card rounded-2xl p-6 shadow-soft card-hover"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Powerful features designed to help you study smarter, not harder
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Users,
                title: 'Smart Matching',
                description: 'AI matches you with students based on course, schedule, and study style',
                color: 'bg-primary/10 text-primary',
              },
              {
                icon: Calendar,
                title: 'Session Scheduling',
                description: 'Create and join study sessions with built-in RSVPs and reminders',
                color: 'bg-secondary/10 text-secondary',
              },
              {
                icon: MessageCircle,
                title: 'Course Q&A',
                description: 'Ask questions and get answers from classmates and top students',
                color: 'bg-info/10 text-info',
              },
              {
                icon: Sparkles,
                title: 'StudyHub Assistant',
                description: 'Navigate the app, find your sessions and groups, get help with features',
                color: 'bg-warning/10 text-warning',
              },
              {
                icon: BookOpen,
                title: 'Resource Sharing',
                description: 'Share notes, links, and materials with your study groups',
                color: 'bg-success/10 text-success',
              },
              {
                icon: Shield,
                title: 'Safe Community',
                description: 'Report and block features keep the community respectful',
                color: 'bg-primary/10 text-primary',
              },
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl p-6 shadow-soft card-hover border border-border/50"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-3xl p-8 md:p-12 shadow-large border border-border/50">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                    <Sparkles className="w-4 h-4" />
                    AI-Powered
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Your personal study assistant
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Our AI helps you study smarter by generating custom study plans, 
                    creating practice questions, and explaining concepts in ways that make sense to you.
                  </p>
                  <ul className="space-y-3">
                    {[
                      'Generate weekly study plans based on your schedule',
                      'Create quiz questions and flashcards for any topic',
                      'Get clear explanations without giving away answers',
                      'Build session agendas for productive group meetings',
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="w-full md:w-64 h-64 bg-accent rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-20 h-20 text-accent-foreground/30 animate-pulse-soft" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to find your study group?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Start studying smarter together.
            </p>
            <Button variant="coral" size="xl" asChild>
              <Link to="/onboarding">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold text-foreground">StudyHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 StudyHub. Built for students, by students.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
