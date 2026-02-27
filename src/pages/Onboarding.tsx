import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  X,
  Loader2,
} from 'lucide-react';
import { OnboardingState, StudyStyle, StudyGoal } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'] as const;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const TIME_BLOCKS = [
  { label: 'Morning', value: '08:00-12:00' },
  { label: 'Afternoon', value: '12:00-17:00' },
  { label: 'Evening', value: '17:00-21:00' },
];

const STUDY_STYLES: { value: StudyStyle; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'quiet', label: 'Quiet Focus', description: 'Work independently, minimal talking', icon: '🤫' },
  { value: 'collaborative', label: 'Collaborative', description: 'Discuss and work through together', icon: '💬' },
  { value: 'problem-solving', label: 'Problem Solving', description: 'Work through practice problems', icon: '🧩' },
  { value: 'exam-prep', label: 'Exam Prep', description: 'Review and test each other', icon: '📝' },
];

const GOALS: { value: StudyGoal; label: string; description: string }[] = [
  { value: 'pass', label: 'Pass the class', description: 'Focus on understanding core material' },
  { value: 'high-grade', label: 'Get a high grade', description: 'Go above and beyond' },
  { value: 'consistency', label: 'Stay consistent', description: 'Build regular study habits' },
  { value: 'accountability', label: 'Accountability', description: 'Someone to keep me on track' },
];

const POPULAR_COURSES = [
  { code: 'CS101', title: 'Intro to Computer Science' },
  { code: 'MATH201', title: 'Calculus II' },
  { code: 'PHYS101', title: 'Physics I' },
  { code: 'CHEM101', title: 'General Chemistry' },
  { code: 'ENG102', title: 'Academic Writing' },
  { code: 'PSYCH101', title: 'Intro to Psychology' },
];

interface OnboardingExtended extends OnboardingState {
  email: string;
  password: string;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const { signUp, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<OnboardingExtended>({
    step: 1,
    name: '',
    email: '',
    password: '',
    school: '',
    major: '',
    year: '',
    courses: [],
    availability: [],
    studyStyle: [],
    goals: [],
  });

  const totalSteps = 5;
  const progress = (state.step / totalSteps) * 100;

  const updateState = (updates: Partial<OnboardingExtended>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      // 1. Sign up the user
      const { error: signUpError } = await signUp(state.email, state.password, { name: state.name });
      if (signUpError) {
        toast({ title: 'Sign up failed', description: 'Could not create account. Please check your details and try again.', variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      // 2. Wait a moment for the trigger to create the profile, then get the user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Error', description: 'Could not get user after sign up', variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      // 3. Update the profile with onboarding data
      await supabase.from('profiles').update({
        name: state.name,
        school: state.school,
        major: state.major,
        year: state.year,
        study_style: state.studyStyle,
        goals: state.goals,
      }).eq('id', user.id);

      // 4. Enroll in courses — look up course IDs by code
      if (state.courses.length > 0) {
        const { data: courseRows } = await supabase
          .from('courses')
          .select('id, code')
          .in('code', state.courses.map(c => c.code));

        if (courseRows && courseRows.length > 0) {
          await supabase.from('user_courses').insert(
            courseRows.map(c => ({ user_id: user.id, course_id: c.id }))
          );
        }
      }

      // 5. Save availability
      const availabilityRows = state.availability.flatMap(a =>
        a.timeBlocks.map(tb => ({
          user_id: user.id,
          day: a.day,
          start_time: tb.start,
          end_time: tb.end,
        }))
      );
      if (availabilityRows.length > 0) {
        await supabase.from('availability').insert(availabilityRows);
      }

      // 6. Refresh the auth profile and navigate
      await refreshProfile();
      navigate('/dashboard');
    } catch (err) {
      toast({ title: 'Error', description: 'Something went wrong during setup', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (state.step < totalSteps) {
      updateState({ step: state.step + 1 });
    } else {
      handleFinish();
    }
  };

  const prevStep = () => {
    if (state.step > 1) {
      updateState({ step: state.step - 1 });
    }
  };

  const addCourse = (course: { code: string; title: string }) => {
    if (!state.courses.find(c => c.code === course.code)) {
      updateState({ courses: [...state.courses, course] });
    }
  };

  const removeCourse = (code: string) => {
    updateState({ courses: state.courses.filter(c => c.code !== code) });
  };

  const toggleAvailability = (day: typeof DAYS[number], timeBlock: string) => {
    const [start, end] = timeBlock.split('-');
    const existing = state.availability.find(a => a.day === day);

    if (existing) {
      const hasBlock = existing.timeBlocks.some(tb => tb.start === start && tb.end === end);
      if (hasBlock) {
        const newBlocks = existing.timeBlocks.filter(tb => !(tb.start === start && tb.end === end));
        if (newBlocks.length === 0) {
          updateState({ availability: state.availability.filter(a => a.day !== day) });
        } else {
          updateState({
            availability: state.availability.map(a =>
              a.day === day ? { ...a, timeBlocks: newBlocks } : a
            ),
          });
        }
      } else {
        updateState({
          availability: state.availability.map(a =>
            a.day === day ? { ...a, timeBlocks: [...a.timeBlocks, { start, end }] } : a
          ),
        });
      }
    } else {
      updateState({
        availability: [...state.availability, { day, timeBlocks: [{ start, end }] }],
      });
    }
  };

  const isAvailable = (day: typeof DAYS[number], timeBlock: string) => {
    const [start, end] = timeBlock.split('-');
    const dayAvail = state.availability.find(a => a.day === day);
    return dayAvail?.timeBlocks.some(tb => tb.start === start && tb.end === end) ?? false;
  };

  const toggleStudyStyle = (style: StudyStyle) => {
    if (state.studyStyle.includes(style)) {
      updateState({ studyStyle: state.studyStyle.filter(s => s !== style) });
    } else {
      updateState({ studyStyle: [...state.studyStyle, style] });
    }
  };

  const toggleGoal = (goal: StudyGoal) => {
    if (state.goals.includes(goal)) {
      updateState({ goals: state.goals.filter(g => g !== goal) });
    } else {
      updateState({ goals: [...state.goals, goal] });
    }
  };

  const canProceed = () => {
    switch (state.step) {
      case 1: return state.name.trim() && state.school.trim() && state.email.trim() && state.password.length >= 6;
      case 2: return state.major.trim() && state.year;
      case 3: return state.courses.length > 0;
      case 4: return state.availability.length > 0;
      case 5: return state.studyStyle.length > 0 && state.goals.length > 0;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">StudyHub</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Step {state.step} of {totalSteps}
          </div>
        </div>
        <Progress value={progress} className="h-1" />
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-xl">
        {/* Step 1: Basic Info + Account */}
        {state.step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Welcome to StudyHub! 👋
              </h1>
              <p className="text-muted-foreground">
                Let's get you set up in under a minute
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">What's your name?</Label>
                <Input
                  id="name"
                  placeholder="Your first name"
                  value={state.name}
                  onChange={(e) => updateState({ name: e.target.value })}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="school">Where do you go to school?</Label>
                <Input
                  id="school"
                  placeholder="University or college name"
                  value={state.school}
                  onChange={(e) => updateState({ school: e.target.value })}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={state.email}
                  onChange={(e) => updateState({ email: e.target.value })}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Create a password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={state.password}
                  onChange={(e) => updateState({ password: e.target.value })}
                  className="h-12"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Academic Info */}
        {state.step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Tell us about your studies 📚
              </h1>
              <p className="text-muted-foreground">
                This helps us match you with the right people
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="major">What's your major?</Label>
                <Input
                  id="major"
                  placeholder="e.g., Computer Science"
                  value={state.major}
                  onChange={(e) => updateState({ major: e.target.value })}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>What year are you in?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {YEARS.map(year => (
                    <button
                      key={year}
                      onClick={() => updateState({ year })}
                      className={cn(
                        "h-12 rounded-lg border text-sm font-medium transition-all",
                        state.year === year
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-primary/50"
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Courses */}
        {state.step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                What are you studying? 📖
              </h1>
              <p className="text-muted-foreground">
                Add your current courses
              </p>
            </div>

            {/* Selected courses */}
            {state.courses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {state.courses.map(course => (
                  <div
                    key={course.code}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary"
                  >
                    <span className="text-sm font-medium">{course.code}</span>
                    <button onClick={() => removeCourse(course.code)}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick add */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Quick add popular courses:</Label>
              <div className="grid grid-cols-2 gap-2">
                {POPULAR_COURSES.filter(c => !state.courses.find(sc => sc.code === c.code)).map(course => (
                  <button
                    key={course.code}
                    onClick={() => addCourse(course)}
                    className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-all text-left"
                  >
                    <Plus className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">{course.code}</div>
                      <div className="text-xs text-muted-foreground truncate">{course.title}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom course */}
            <div className="pt-4 border-t border-border">
              <Label className="text-muted-foreground mb-2 block">Or add a custom course:</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Course code (e.g., BIO101)"
                  id="custom-course"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.getElementById('custom-course') as HTMLInputElement;
                    const code = input.value.trim().toUpperCase();
                    if (code && /^[A-Z]{2,6}\d{2,4}$/.test(code)) {
                      addCourse({ code, title: 'Custom Course' });
                      input.value = '';
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Availability */}
        {state.step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                When are you free? ⏰
              </h1>
              <p className="text-muted-foreground">
                Tap the times you can study
              </p>
            </div>

            <div className="overflow-x-auto -mx-4 px-4">
              <div className="min-w-[500px]">
                <div className="grid grid-cols-8 gap-1">
                  {/* Header */}
                  <div className="h-10" />
                  {DAYS.map(day => (
                    <div key={day} className="h-10 flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {day.slice(0, 3)}
                    </div>
                  ))}

                  {/* Time blocks */}
                  {TIME_BLOCKS.map(block => (
                    <>
                      <div key={`label-${block.value}`} className="h-12 flex items-center text-xs text-muted-foreground pr-2">
                        {block.label}
                      </div>
                      {DAYS.map(day => (
                        <button
                          key={`${day}-${block.value}`}
                          onClick={() => toggleAvailability(day, block.value)}
                          className={cn(
                            "h-12 rounded-lg border transition-all",
                            isAvailable(day, block.value)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card hover:border-primary/50"
                          )}
                        >
                          {isAvailable(day, block.value) && <Check className="w-4 h-4 mx-auto" />}
                        </button>
                      ))}
                    </>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Selected: {state.availability.reduce((acc, a) => acc + a.timeBlocks.length, 0)} time slots
            </p>
          </div>
        )}

        {/* Step 5: Study Style & Goals */}
        {state.step === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                How do you like to study? 🎯
              </h1>
              <p className="text-muted-foreground">
                Select all that apply
              </p>
            </div>

            <div className="space-y-4">
              <Label>Study style</Label>
              <div className="grid grid-cols-2 gap-2">
                {STUDY_STYLES.map(style => (
                  <button
                    key={style.value}
                    onClick={() => toggleStudyStyle(style.value)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all",
                      state.studyStyle.includes(style.value)
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className="text-2xl mb-2">{style.icon}</div>
                    <div className="font-medium text-sm text-foreground">{style.label}</div>
                    <div className="text-xs text-muted-foreground">{style.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Your goals</Label>
              <div className="space-y-2">
                {GOALS.map(goal => (
                  <button
                    key={goal.value}
                    onClick={() => toggleGoal(goal.value)}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3",
                      state.goals.includes(goal.value)
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                      state.goals.includes(goal.value)
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    )}>
                      {state.goals.includes(goal.value) && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-foreground">{goal.label}</div>
                      <div className="text-xs text-muted-foreground">{goal.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-xl">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={state.step === 1 || submitting}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            variant={state.step === totalSteps ? 'coral' : 'default'}
            onClick={nextStep}
            disabled={!canProceed() || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : state.step === totalSteps ? (
              <>
                Find My Matches
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Onboarding;
