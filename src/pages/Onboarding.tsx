import { useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  X,
  Loader2,
  BookOpen,
  DollarSign,
} from 'lucide-react';
import { OnboardingState, StudyGoal } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'student' | 'tutor';

const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'] as const;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const TIME_BLOCKS = [
  { label: 'Morning', value: '08:00-12:00' },
  { label: 'Afternoon', value: '12:00-17:00' },
  { label: 'Evening', value: '17:00-21:00' },
];

const GOALS: { value: StudyGoal; label: string; description: string }[] = [
  { value: 'pass', label: 'Pass the class', description: 'Focus on understanding core material' },
  { value: 'high-grade', label: 'Get a high grade', description: 'Go above and beyond' },
  { value: 'consistency', label: 'Stay consistent', description: 'Build regular study habits' },
  { value: 'accountability', label: 'Accountability', description: 'Someone to keep me on track' },
];

const LAU_CAMPUSES = ['LAU Beirut', 'LAU Byblos'] as const;

interface LAUMajor {
  name: string;
  degree: string;
  campuses: ('Beirut' | 'Byblos')[];
}

interface LAUSchool {
  school: string;
  majors: LAUMajor[];
}

const LAU_SCHOOLS: LAUSchool[] = [
  {
    school: 'School of Architecture & Design',
    majors: [
      { name: 'Architecture', degree: 'B.Arch.', campuses: ['Beirut', 'Byblos'] },
      { name: 'Fashion Design', degree: 'B.F.A.', campuses: ['Beirut'] },
      { name: 'Graphic Design', degree: 'B.F.A.', campuses: ['Beirut', 'Byblos'] },
      { name: 'Interior Design', degree: 'B.F.A.', campuses: ['Beirut', 'Byblos'] },
      { name: 'Studio Arts', degree: 'B.F.A.', campuses: ['Beirut', 'Byblos'] },
    ],
  },
  {
    school: 'School of Arts & Sciences',
    majors: [
      { name: 'Applied Physics', degree: 'B.S.', campuses: ['Beirut', 'Byblos'] },
      { name: 'Bioinformatics', degree: 'B.S.', campuses: ['Beirut', 'Byblos'] },
      { name: 'Biology', degree: 'B.S.', campuses: ['Beirut', 'Byblos'] },
      { name: 'Chemistry', degree: 'B.S.', campuses: ['Beirut', 'Byblos'] },
      { name: 'Communication', degree: 'B.A.', campuses: ['Beirut', 'Byblos'] },
      { name: 'Computer Science', degree: 'B.S.', campuses: ['Beirut', 'Byblos'] },
      { name: 'Education', degree: 'B.A.', campuses: ['Beirut'] },
      { name: 'English', degree: 'B.A.', campuses: ['Beirut', 'Byblos'] },
      { name: 'History', degree: 'B.A.', campuses: ['Beirut', 'Byblos'] },
      { name: 'Mathematics', degree: 'B.S.', campuses: ['Beirut', 'Byblos'] },
      { name: 'Multimedia Journalism', degree: 'B.A.', campuses: ['Beirut'] },
      { name: 'Nutrition & Dietetics', degree: 'B.S.', campuses: ['Beirut', 'Byblos'] },
      { name: 'Performing Arts', degree: 'B.A.', campuses: ['Beirut', 'Byblos'] },
      { name: 'Political Science', degree: 'B.A.', campuses: ['Beirut', 'Byblos'] },
      { name: 'Political Science / International Affairs', degree: 'B.A.', campuses: ['Beirut', 'Byblos'] },
      { name: 'Psychology', degree: 'B.A.', campuses: ['Beirut', 'Byblos'] },
      { name: 'Television & Film', degree: 'B.A.', campuses: ['Beirut', 'Byblos'] },
      { name: 'Translation', degree: 'B.A.', campuses: ['Beirut', 'Byblos'] },
    ],
  },
  {
    school: 'Adnan Kassar School of Business',
    majors: [
      { name: 'Business Studies', degree: 'B.S.', campuses: ['Beirut', 'Byblos'] },
      { name: 'Economics', degree: 'B.S.', campuses: ['Beirut', 'Byblos'] },
      { name: 'Hospitality & Tourism Management', degree: 'B.S.', campuses: ['Beirut', 'Byblos'] },
    ],
  },
  {
    school: 'School of Engineering',
    majors: [
      { name: 'Chemical Engineering', degree: 'B.E.', campuses: ['Byblos'] },
      { name: 'Civil Engineering', degree: 'B.E.', campuses: ['Byblos'] },
      { name: 'Computer Engineering', degree: 'B.E.', campuses: ['Byblos'] },
      { name: 'Electrical Engineering', degree: 'B.E.', campuses: ['Byblos'] },
      { name: 'Industrial Engineering', degree: 'B.E.', campuses: ['Byblos'] },
      { name: 'Mechanical Engineering', degree: 'B.E.', campuses: ['Byblos'] },
      { name: 'Mechatronics Engineering', degree: 'B.E.', campuses: ['Byblos'] },
      { name: 'Petroleum Engineering', degree: 'B.E.', campuses: ['Byblos'] },
    ],
  },
  {
    school: 'Alice Ramez Chagoury School of Nursing',
    majors: [
      { name: 'Nursing', degree: 'B.S.', campuses: ['Byblos'] },
    ],
  },
  {
    school: 'School of Pharmacy',
    majors: [
      { name: 'Pharmacy', degree: 'Pharm.D.', campuses: ['Byblos'] },
    ],
  },
];

const ALL_LAU_MAJORS = LAU_SCHOOLS.flatMap(s => s.majors.map(m => `${m.name} (${m.degree})`));

const POPULAR_COURSES = [
  { code: 'CSC243', title: 'Intro to Object-Oriented Programming' },
  { code: 'CSC245', title: 'Objects and Data Abstraction' },
  { code: 'CSC310', title: 'Algorithms and Data Structures' },
  { code: 'MTH201', title: 'Calculus III' },
  { code: 'MTH207', title: 'Linear Algebra' },
  { code: 'PHY211', title: 'General Physics II' },
  { code: 'BIO201', title: 'General Biology II' },
  { code: 'CHM201', title: 'General Chemistry II' },
  { code: 'ENG202', title: 'Advanced Academic English' },
  { code: 'ECO201', title: 'Principles of Microeconomics' },
  { code: 'ACC201', title: 'Principles of Accounting I' },
  { code: 'BUS201', title: 'Principles of Management' },
];

const TUTOR_SUBJECTS = [
  'Computer Science', 'Mathematics', 'Physics', 'Chemistry',
  'Biology', 'Engineering', 'Business', 'Economics',
  'Accounting', 'English', 'Pharmacy', 'Nursing',
  'Architecture', 'Graphic Design', 'Communication',
];

interface OnboardingExtended extends OnboardingState {
  email: string;
  password: string;
  role: UserRole;
  bioExpert: string;
  hourlyRate: string;
  subjects: string[];
}

const Onboarding = () => {
  const navigate = useNavigate();
  const { signUp, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [majorSearch, setMajorSearch] = useState('');
  const [state, setState] = useState<OnboardingExtended>({
    step: 1,
    name: '',
    email: '',
    password: '',
    school: 'LAU Beirut',
    major: '',
    year: '',
    courses: [],
    availability: [],
    studyStyle: [],
    goals: [],
    role: 'student',
    bioExpert: '',
    hourlyRate: '',
    subjects: [],
  });

  const isTutor = state.role === 'tutor';
  // Students: 1.Account → 2.Role → 3.Academic → 4.Courses → 5.Availability → 6.Goals
  // Tutors:   1.Account → 2.Role → 3.Academic → 4.Expertise → 5.Availability → 6.Courses
  const totalSteps = 6;
  const progress = (state.step / totalSteps) * 100;

  const updateState = (updates: Partial<OnboardingExtended>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const { error: signUpError } = await signUp(state.email, state.password, { name: state.name });
      if (signUpError) {
        toast({ title: 'Sign up failed', description: 'Could not create account. Please check your details and try again.', variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      let user = (await supabase.auth.getSession()).data.session?.user ?? null;
      for (let i = 0; i < 3 && !user; i++) {
        await new Promise(r => setTimeout(r, 400));
        user = (await supabase.auth.getSession()).data.session?.user ?? null;
      }
      if (!user) {
        toast({
          title: 'Almost there',
          description: 'Check your inbox and confirm your email, then log in.',
          variant: 'default',
        });
        setSubmitting(false);
        navigate('/login');
        return;
      }

      const profileUpdate: Record<string, unknown> = {
        name: state.name,
        school: state.school,
        major: state.major,
        year: state.year,
        user_role: state.role,
        goals: state.goals,
      };

      if (isTutor) {
        profileUpdate.bio_expert = state.bioExpert;
        profileUpdate.hourly_rate = parseFloat(state.hourlyRate) || null;
        profileUpdate.subjects = state.subjects;
      }

      await supabase.from('profiles').update(profileUpdate).eq('id', user.id);

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

      await refreshProfile();
      navigate('/dashboard');
    } catch {
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

  const toggleGoal = (goal: StudyGoal) => {
    if (state.goals.includes(goal)) {
      updateState({ goals: state.goals.filter(g => g !== goal) });
    } else {
      updateState({ goals: [...state.goals, goal] });
    }
  };

  const toggleSubject = (subject: string) => {
    if (state.subjects.includes(subject)) {
      updateState({ subjects: state.subjects.filter(s => s !== subject) });
    } else {
      updateState({ subjects: [...state.subjects, subject] });
    }
  };

  const canProceed = () => {
    switch (state.step) {
      case 1: return state.name.trim() && state.school && state.email.trim() && state.password.length >= 6;
      case 2: return !!state.role;
      case 3: return !!state.major && !!state.year;
      case 4:
        if (isTutor) return state.subjects.length > 0 && state.bioExpert.trim().length > 0;
        return state.courses.length > 0;
      case 5: return state.availability.length > 0;
      case 6:
        if (isTutor) return state.courses.length > 0;
        return state.goals.length > 0;
      default: return false;
    }
  };

  const anim = {
    initial: { opacity: 0, x: 12 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -12 },
    transition: { duration: 0.2 },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">LAU StudyHub</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Step {state.step} of {totalSteps}
          </div>
        </div>
        <Progress value={progress} className="h-1" />
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-xl">
        <AnimatePresence mode="wait">

        {/* Step 1: Account */}
        {state.step === 1 && (
          <motion.div key="step1" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Welcome to LAU StudyHub
              </h1>
              <p className="text-muted-foreground">
                The tutoring marketplace for LAU students
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">What's your name?</Label>
                <Input id="name" placeholder="Your first name" value={state.name}
                  onChange={(e) => updateState({ name: e.target.value })} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>Which campus?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {LAU_CAMPUSES.map(campus => (
                    <button key={campus} onClick={() => updateState({ school: campus })}
                      className={cn(
                        "h-12 rounded-lg border text-sm font-medium transition-all",
                        state.school === campus
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-primary/50"
                      )}>
                      {campus}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">LAU Email</Label>
                <Input id="email" type="email" placeholder="you@lau.edu" value={state.email}
                  onChange={(e) => updateState({ email: e.target.value })} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Create a password</Label>
                <Input id="password" type="password" placeholder="At least 6 characters" value={state.password}
                  onChange={(e) => updateState({ password: e.target.value })} className="h-12" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Role Selection */}
        {state.step === 2 && (
          <motion.div key="step2" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                How will you use StudyHub?
              </h1>
              <p className="text-muted-foreground">
                Choose your primary role
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => updateState({ role: 'student' })}
                className={cn(
                  "p-6 rounded-xl border-2 text-left transition-all",
                  state.role === 'student'
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    state.role === 'student' ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg text-foreground">I'm a Student</div>
                    <div className="text-sm text-muted-foreground">Find expert tutors, book sessions, and ace your courses</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => updateState({ role: 'tutor' })}
                className={cn(
                  "p-6 rounded-xl border-2 text-left transition-all",
                  state.role === 'tutor'
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    state.role === 'tutor' ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg text-foreground">I'm a Tutor</div>
                    <div className="text-sm text-muted-foreground">Share your expertise, set your own rates, and build your reputation</div>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Academic Info */}
        {state.step === 3 && (
          <motion.div key="step3" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Tell us about yourself
              </h1>
              <p className="text-muted-foreground">
                {isTutor ? 'This builds trust with LAU students' : 'This helps us match you with the right LAU tutors'}
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>What's your major?</Label>
                {state.major && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                    {state.major}
                    <button onClick={() => updateState({ major: '' })}><X className="w-4 h-4" /></button>
                  </div>
                )}
                {!state.major && (
                  <>
                    <Input
                      placeholder="Search majors..."
                      value={majorSearch}
                      onChange={(e) => setMajorSearch(e.target.value)}
                      className="h-10"
                    />
                    <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-card">
                      {LAU_SCHOOLS.map(school => {
                        const campus = state.school === 'LAU Beirut' ? 'Beirut' : 'Byblos';
                        const filtered = school.majors.filter(m =>
                          m.campuses.includes(campus) &&
                          (!majorSearch.trim() || m.name.toLowerCase().includes(majorSearch.toLowerCase()))
                        );
                        if (filtered.length === 0) return null;
                        return (
                          <div key={school.school}>
                            <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50">
                              {school.school}
                            </div>
                            {filtered.map(m => (
                              <button
                                key={m.name}
                                onClick={() => { updateState({ major: `${m.name} (${m.degree})` }); setMajorSearch(''); }}
                                className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors flex items-center justify-between border-b border-border/30 last:border-0"
                              >
                                <span className="text-foreground">{m.name}</span>
                                <span className="text-xs text-muted-foreground shrink-0 ml-2">{m.degree}</span>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label>What year are you in?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {YEARS.map(year => (
                    <button key={year} onClick={() => updateState({ year })}
                      className={cn(
                        "h-12 rounded-lg border text-sm font-medium transition-all",
                        state.year === year
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-primary/50"
                      )}>
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Courses (Student) or Expertise (Tutor) */}
        {state.step === 4 && !isTutor && (
          <motion.div key="step4-student" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                What are you taking this semester?
              </h1>
              <p className="text-muted-foreground">Add your LAU courses -- tutors who teach these will show up first</p>
            </div>
            {state.courses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {state.courses.map(course => (
                  <div key={course.code}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary">
                    <span className="text-sm font-medium">{course.code}</span>
                    <button onClick={() => removeCourse(course.code)}><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Popular LAU courses:</Label>
              <div className="grid grid-cols-2 gap-2">
                {POPULAR_COURSES.filter(c => !state.courses.find(sc => sc.code === c.code)).map(course => (
                  <button key={course.code} onClick={() => addCourse(course)}
                    className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-all text-left">
                    <Plus className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">{course.code}</div>
                      <div className="text-xs text-muted-foreground truncate">{course.title}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <Label className="text-muted-foreground mb-2 block">Or add a custom course:</Label>
              <div className="flex gap-2">
                <Input placeholder="Course code (e.g., BIO101)" id="custom-course" className="flex-1" />
                <Button variant="outline" onClick={() => {
                  const input = document.getElementById('custom-course') as HTMLInputElement;
                  const code = input.value.trim().toUpperCase();
                    if (code && /^[A-Z]{2,6}\d{2,4}[A-Z]?$/.test(code)) {
                    addCourse({ code, title: 'LAU Course' });
                    input.value = '';
                  }
                }}>Add</Button>
              </div>
            </div>
          </motion.div>
        )}

        {state.step === 4 && isTutor && (
          <motion.div key="step4-tutor" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Build your tutor profile
              </h1>
              <p className="text-muted-foreground">LAU students will see this when deciding to book you</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio-expert">Professional headline</Label>
                <Textarea id="bio-expert" placeholder="e.g., 4th-year CS major specializing in Algorithms and Data Structures. I've tutored 50+ students with a 98% satisfaction rate."
                  value={state.bioExpert} onChange={(e) => updateState({ bioExpert: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly-rate" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Hourly Rate (USD)
                </Label>
                <Input id="hourly-rate" type="number" min="5" max="200" step="5" placeholder="25"
                  value={state.hourlyRate} onChange={(e) => updateState({ hourlyRate: e.target.value })} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>Subjects you teach</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TUTOR_SUBJECTS.map(subject => (
                    <button key={subject} onClick={() => toggleSubject(subject)}
                      className={cn(
                        "px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left",
                        state.subjects.includes(subject)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:border-primary/50"
                      )}>
                      {state.subjects.includes(subject) && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 5: Availability */}
        {state.step === 5 && (
          <motion.div key="step5" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                {isTutor ? 'When are you available to tutor?' : 'When are you free?'}
              </h1>
              <p className="text-muted-foreground">
                {isTutor ? 'Tap the times open for bookings' : 'Tap the times you can study'}
              </p>
            </div>
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="min-w-[500px]">
                <div className="grid grid-cols-8 gap-1">
                  <div className="h-10" />
                  {DAYS.map(day => (
                    <div key={day} className="h-10 flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {day.slice(0, 3)}
                    </div>
                  ))}
                  {TIME_BLOCKS.map(block => (
                    <Fragment key={block.value}>
                      <div className="h-12 flex items-center text-xs text-muted-foreground pr-2">{block.label}</div>
                      {DAYS.map(day => (
                        <button key={`${day}-${block.value}`} onClick={() => toggleAvailability(day, block.value)}
                          className={cn(
                            "h-12 rounded-lg border transition-all",
                            isAvailable(day, block.value)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card hover:border-primary/50"
                          )}>
                          {isAvailable(day, block.value) && <Check className="w-4 h-4 mx-auto" />}
                        </button>
                      ))}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Selected: {state.availability.reduce((acc, a) => acc + a.timeBlocks.length, 0)} time slots
            </p>
          </motion.div>
        )}

        {/* Step 6: Goals (Student) or Courses (Tutor) */}
        {state.step === 6 && !isTutor && (
          <motion.div key="step6-student" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                What are your goals?
              </h1>
              <p className="text-muted-foreground">This helps us recommend the right LAU tutors for you</p>
            </div>
            <div className="space-y-2">
              {GOALS.map(goal => (
                <button key={goal.value} onClick={() => toggleGoal(goal.value)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3",
                    state.goals.includes(goal.value)
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  )}>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                    state.goals.includes(goal.value) ? "border-primary bg-primary" : "border-muted-foreground"
                  )}>
                    {state.goals.includes(goal.value) && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-foreground">{goal.label}</div>
                    <div className="text-xs text-muted-foreground">{goal.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {state.step === 6 && isTutor && (
          <motion.div key="step6-tutor" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Which LAU courses can you teach?
              </h1>
              <p className="text-muted-foreground">Students searching for these courses will see you first</p>
            </div>
            {state.courses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {state.courses.map(course => (
                  <div key={course.code}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary">
                    <span className="text-sm font-medium">{course.code}</span>
                    <button onClick={() => removeCourse(course.code)}><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {POPULAR_COURSES.filter(c => !state.courses.find(sc => sc.code === c.code)).map(course => (
                <button key={course.code} onClick={() => addCourse(course)}
                  className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-all text-left">
                  <Plus className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">{course.code}</div>
                    <div className="text-xs text-muted-foreground truncate">{course.title}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        </AnimatePresence>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-xl">
          <Button variant="ghost" onClick={prevStep} disabled={state.step === 1 || submitting}>
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
                {isTutor ? 'Launch My Profile' : 'Find Tutors'}
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
