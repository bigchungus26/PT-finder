import { useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Dumbbell,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  X,
  Loader2,
  Target,
  DollarSign,
  MapPin,
  Award,
  Users,
  Camera,
} from 'lucide-react';
import type { FitnessGoal, Availability } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'client' | 'trainer';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const TIME_BLOCKS = [
  { label: 'Early Morning', value: '05:00-08:00' },
  { label: 'Morning', value: '08:00-12:00' },
  { label: 'Afternoon', value: '12:00-17:00' },
  { label: 'Evening', value: '17:00-21:00' },
];

const FITNESS_GOALS: { value: FitnessGoal; label: string; description: string; emoji: string }[] = [
  { value: 'weight-loss', label: 'Weight Loss', description: 'Burn fat and get lean', emoji: '🔥' },
  { value: 'muscle-gain', label: 'Muscle Gain', description: 'Build size and strength', emoji: '💪' },
  { value: 'endurance', label: 'Endurance', description: 'Improve cardio and stamina', emoji: '🏃' },
  { value: 'flexibility', label: 'Flexibility', description: 'Improve mobility and prevent injury', emoji: '🧘' },
  { value: 'general-fitness', label: 'General Fitness', description: 'Stay healthy and active', emoji: '⚡' },
  { value: 'sport-specific', label: 'Sport-Specific', description: 'Train for a specific sport', emoji: '🏆' },
  { value: 'rehab', label: 'Rehab / Recovery', description: 'Recover from injury or surgery', emoji: '🩹' },
];

const SPECIALTIES = [
  'Weight Loss', 'Bodybuilding', 'Strength Training', 'HIIT',
  'CrossFit', 'Yoga', 'Pilates', 'Boxing / Kickboxing',
  'Calisthenics', 'Functional Training', 'Sports Performance',
  'Injury Rehab', 'Pre/Post Natal', 'Nutrition Coaching',
  'Flexibility & Mobility', 'Senior Fitness',
];

const CERTIFICATIONS = [
  'NASM-CPT', 'ACE-CPT', 'ISSA-CPT', 'NSCA-CSCS',
  'ACSM-CPT', 'CrossFit Level 1', 'CrossFit Level 2',
  'NASM-PES', 'ACE-GFI', 'Precision Nutrition',
  'NASM-CNC', 'First Aid / CPR', 'Other',
];

const POPULAR_GYMS = [
  'Gold\'s Gym', 'Fitness First', 'Anytime Fitness',
  '24 Hour Fitness', 'Planet Fitness', 'Equinox',
  'CrossFit Box', 'Local Gym', 'Home Training',
  'Outdoor / Park', 'Online Only',
];

interface OnboardingExtended {
  step: number;
  name: string;
  email: string;
  password: string;
  area: string;
  gym: string;
  customGym: string;
  role: UserRole;
  fitnessGoals: FitnessGoal[];
  availability: Availability[];
  bioExpert: string;
  hourlyRate: string;
  specialty: string[];
  certifications: string[];
  yearsExperience: string;
  transformationUrls: string[];
  currentTransformationUrl: string;
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
    area: '',
    gym: '',
    customGym: '',
    role: 'client',
    fitnessGoals: [],
    availability: [],
    bioExpert: '',
    hourlyRate: '',
    specialty: [],
    certifications: [],
    yearsExperience: '',
    transformationUrls: [],
    currentTransformationUrl: '',
  });

  const isTrainer = state.role === 'trainer';
  // Client:  1.Account → 2.Role → 3.Location & Gym → 4.Goals → 5.Availability
  // Trainer: 1.Account → 2.Role → 3.Location & Gym → 4.Expertise → 5.Availability
  const totalSteps = 5;
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
        toast({ title: 'Almost there', description: 'Check your inbox and confirm your email, then log in.' });
        setSubmitting(false);
        navigate('/login');
        return;
      }

      const gym = state.gym === 'Other' ? state.customGym : state.gym;
      const profileUpdate: Record<string, unknown> = {
        name: state.name,
        area: state.area,
        gym,
        user_role: state.role,
        fitness_goals: state.fitnessGoals,
        goals: state.fitnessGoals,
      };

      if (isTrainer) {
        profileUpdate.bio_expert = state.bioExpert;
        profileUpdate.hourly_rate = parseFloat(state.hourlyRate) || null;
        profileUpdate.specialty = state.specialty;
        profileUpdate.certifications = state.certifications;
        profileUpdate.years_experience = parseInt(state.yearsExperience) || 0;
        profileUpdate.transformations = state.transformationUrls;
      }

      await supabase.from('profiles').update(profileUpdate).eq('id', user.id);

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
    if (state.step < totalSteps) updateState({ step: state.step + 1 });
    else handleFinish();
  };

  const prevStep = () => {
    if (state.step > 1) updateState({ step: state.step - 1 });
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
    return state.availability.find(a => a.day === day)?.timeBlocks.some(tb => tb.start === start && tb.end === end) ?? false;
  };

  const toggleGoal = (goal: FitnessGoal) => {
    if (state.fitnessGoals.includes(goal)) {
      updateState({ fitnessGoals: state.fitnessGoals.filter(g => g !== goal) });
    } else {
      updateState({ fitnessGoals: [...state.fitnessGoals, goal] });
    }
  };

  const toggleSpecialty = (s: string) => {
    if (state.specialty.includes(s)) updateState({ specialty: state.specialty.filter(x => x !== s) });
    else updateState({ specialty: [...state.specialty, s] });
  };

  const toggleCert = (c: string) => {
    if (state.certifications.includes(c)) updateState({ certifications: state.certifications.filter(x => x !== c) });
    else updateState({ certifications: [...state.certifications, c] });
  };

  const addTransformation = () => {
    const url = state.currentTransformationUrl.trim();
    if (url && !state.transformationUrls.includes(url)) {
      updateState({
        transformationUrls: [...state.transformationUrls, url],
        currentTransformationUrl: '',
      });
    }
  };

  const canProceed = () => {
    switch (state.step) {
      case 1: return state.name.trim() && state.email.trim() && state.password.length >= 6;
      case 2: return !!state.role;
      case 3: return state.area.trim().length > 0 && (state.gym !== '' || state.customGym.trim().length > 0);
      case 4:
        if (isTrainer) return state.specialty.length > 0 && state.bioExpert.trim().length > 0;
        return state.fitnessGoals.length > 0;
      case 5: return state.availability.length > 0;
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
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">PT Finder</span>
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
                Welcome to PT Finder
              </h1>
              <p className="text-muted-foreground">
                Find your perfect personal trainer
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">What's your name?</Label>
                <Input id="name" placeholder="Your first name" value={state.name}
                  onChange={e => updateState({ name: e.target.value })} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@email.com" value={state.email}
                  onChange={e => updateState({ email: e.target.value })} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Create a password</Label>
                <Input id="password" type="password" placeholder="At least 6 characters" value={state.password}
                  onChange={e => updateState({ password: e.target.value })} className="h-12" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Role */}
        {state.step === 2 && (
          <motion.div key="step2" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                How will you use PT Finder?
              </h1>
              <p className="text-muted-foreground">Choose your role</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => updateState({ role: 'client' })}
                className={cn(
                  "p-6 rounded-xl border-2 text-left transition-all",
                  state.role === 'client' ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/50"
                )}>
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center",
                    state.role === 'client' ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg text-foreground">I'm Looking for a Trainer</div>
                    <div className="text-sm text-muted-foreground">Find expert trainers, book sessions, and crush your fitness goals</div>
                  </div>
                </div>
              </button>
              <button onClick={() => updateState({ role: 'trainer' })}
                className={cn(
                  "p-6 rounded-xl border-2 text-left transition-all",
                  state.role === 'trainer' ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/50"
                )}>
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center",
                    state.role === 'trainer' ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg text-foreground">I'm a Personal Trainer</div>
                    <div className="text-sm text-muted-foreground">Showcase your expertise, get clients, and grow your business</div>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Location & Gym */}
        {state.step === 3 && (
          <motion.div key="step3" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Where do you {isTrainer ? 'train clients' : 'want to train'}?
              </h1>
              <p className="text-muted-foreground">
                {isTrainer ? 'This helps clients in your area find you' : 'We\'ll match you with nearby trainers'}
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="area" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Your Area / City
                </Label>
                <Input id="area" placeholder="e.g., Downtown LA, Brooklyn, Dubai Marina..."
                  value={state.area} onChange={e => updateState({ area: e.target.value })} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>Preferred Gym</Label>
                <div className="grid grid-cols-2 gap-2">
                  {POPULAR_GYMS.map(g => (
                    <button key={g} onClick={() => updateState({ gym: g })}
                      className={cn(
                        "px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left",
                        state.gym === g
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:border-primary/50"
                      )}>
                      {state.gym === g && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                      {g}
                    </button>
                  ))}
                  <button onClick={() => updateState({ gym: 'Other' })}
                    className={cn(
                      "px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left",
                      state.gym === 'Other'
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:border-primary/50"
                    )}>
                    {state.gym === 'Other' && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                    Other
                  </button>
                </div>
                {state.gym === 'Other' && (
                  <Input placeholder="Enter your gym name" value={state.customGym}
                    onChange={e => updateState({ customGym: e.target.value })} className="h-10 mt-2" />
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Client Goals OR Trainer Expertise */}
        {state.step === 4 && !isTrainer && (
          <motion.div key="step4-client" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                What are your fitness goals?
              </h1>
              <p className="text-muted-foreground">Select all that apply -- we'll match you with the right trainer</p>
            </div>
            <div className="space-y-2">
              {FITNESS_GOALS.map(goal => (
                <button key={goal.value} onClick={() => toggleGoal(goal.value)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3",
                    state.fitnessGoals.includes(goal.value)
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  )}>
                  <span className="text-2xl">{goal.emoji}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-foreground">{goal.label}</div>
                    <div className="text-xs text-muted-foreground">{goal.description}</div>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                    state.fitnessGoals.includes(goal.value) ? "border-primary bg-primary" : "border-muted-foreground"
                  )}>
                    {state.fitnessGoals.includes(goal.value) && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {state.step === 4 && isTrainer && (
          <motion.div key="step4-trainer" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Build your trainer profile
              </h1>
              <p className="text-muted-foreground">Clients will see this when deciding to book you</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio-expert">Professional Bio</Label>
                <Textarea id="bio-expert"
                  placeholder="e.g., NASM-certified trainer with 5+ years of experience. Specializing in body transformations and strength training. 200+ clients transformed."
                  value={state.bioExpert} onChange={e => updateState({ bioExpert: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="hourly-rate" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Rate ($/session)
                  </Label>
                  <Input id="hourly-rate" type="number" min="10" max="500" step="5" placeholder="50"
                    value={state.hourlyRate} onChange={e => updateState({ hourlyRate: e.target.value })} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience" className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Years of Experience
                  </Label>
                  <Input id="experience" type="number" min="0" max="40" placeholder="5"
                    value={state.yearsExperience} onChange={e => updateState({ yearsExperience: e.target.value })} className="h-12" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Specialties</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SPECIALTIES.map(s => (
                    <button key={s} onClick={() => toggleSpecialty(s)}
                      className={cn(
                        "px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left",
                        state.specialty.includes(s)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:border-primary/50"
                      )}>
                      {state.specialty.includes(s) && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Certifications</Label>
                <div className="flex flex-wrap gap-2">
                  {CERTIFICATIONS.map(c => (
                    <button key={c} onClick={() => toggleCert(c)}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                        state.certifications.includes(c)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:border-primary/50"
                      )}>
                      {state.certifications.includes(c) && <Check className="w-3 h-3 inline mr-1" />}
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Transformation Photos (URLs)
                </Label>
                {state.transformationUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {state.transformationUrls.map((url, i) => (
                      <div key={i} className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-xs">
                        Photo {i + 1}
                        <button onClick={() => updateState({ transformationUrls: state.transformationUrls.filter((_, j) => j !== i) })}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input placeholder="https://... (before/after photo URL)"
                    value={state.currentTransformationUrl}
                    onChange={e => updateState({ currentTransformationUrl: e.target.value })} />
                  <Button variant="outline" size="sm" onClick={addTransformation}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Add URLs to your client transformation photos</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 5: Availability */}
        {state.step === 5 && (
          <motion.div key="step5" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                {isTrainer ? 'When are you available to train?' : 'When can you train?'}
              </h1>
              <p className="text-muted-foreground">
                Tap the times that work for you
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
                {isTrainer ? 'Launch My Profile' : 'Find Trainers'}
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
