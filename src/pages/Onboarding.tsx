import { useState, useRef, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Dumbbell, ArrowRight, ArrowLeft, Check, Plus, X, Loader2,
  Target, DollarSign, MapPin, Award, Camera, User, Building, Briefcase, Upload,
} from 'lucide-react';
import type { FitnessGoal, Availability } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/storage';
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

interface OnboardingState {
  step: number;
  name: string;
  email: string;
  password: string;
  city: string;
  area: string;
  gym: string;
  role: UserRole;
  fitnessGoals: FitnessGoal[];
  availability: Availability[];
  bioExpert: string;
  hourlyRate: string;
  specialty: string[];
  certifications: string[];
  yearsExperience: string;
  age: string;
  gender: 'male' | 'female' | 'other' | '';
  trainerType: 'freelancer' | 'gym_affiliated' | '';
  profilePhotoFile: File | null;
  profilePhotoPreview: string;
  transformationFiles: File[];
  transformationPreviews: string[];
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { signUp, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const transformationRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<OnboardingState>({
    step: 1,
    name: '',
    email: '',
    password: '',
    city: '',
    area: '',
    gym: '',
    role: 'client',
    fitnessGoals: [],
    availability: [],
    bioExpert: '',
    hourlyRate: '',
    specialty: [],
    certifications: [],
    yearsExperience: '',
    age: '',
    gender: '',
    trainerType: '',
    profilePhotoFile: null,
    profilePhotoPreview: '',
    transformationFiles: [],
    transformationPreviews: [],
  });

  const isTrainer = state.role === 'trainer';
  const totalSteps = isTrainer ? 6 : 5;
  const progress = (state.step / totalSteps) * 100;

  const updateState = (updates: Partial<OnboardingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleProfilePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    updateState({ profilePhotoFile: file, profilePhotoPreview: preview });
  };

  const handleTransformationPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    updateState({
      transformationFiles: [...state.transformationFiles, file],
      transformationPreviews: [...state.transformationPreviews, preview],
    });
    if (transformationRef.current) transformationRef.current.value = '';
  };

  const removeTransformation = (idx: number) => {
    updateState({
      transformationFiles: state.transformationFiles.filter((_, i) => i !== idx),
      transformationPreviews: state.transformationPreviews.filter((_, i) => i !== idx),
    });
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const { error: signUpError } = await signUp(state.email, state.password, { name: state.name });
      if (signUpError) {
        const msg = (signUpError as any)?.message ?? 'Could not create account.';
        toast({ title: 'Sign up failed', description: msg, variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      let user = (await supabase.auth.getSession()).data.session?.user ?? null;
      for (let i = 0; i < 8 && !user; i++) {
        await new Promise(r => setTimeout(r, 500));
        user = (await supabase.auth.getSession()).data.session?.user ?? null;
      }
      if (!user) {
        toast({ title: 'Check your email', description: 'We sent you a confirmation link. Click it, then log in.' });
        setSubmitting(false);
        navigate('/login');
        return;
      }

      let profilePhotoUrl: string | null = null;
      if (state.profilePhotoFile) {
        try {
          profilePhotoUrl = await uploadFile(state.profilePhotoFile, `profiles/${user.id}`);
        } catch {
          console.warn('Profile photo upload failed, continuing without it');
        }
      }

      const transformationUrls: string[] = [];
      for (const file of state.transformationFiles) {
        try {
          const url = await uploadFile(file, `transformations/${user.id}`);
          transformationUrls.push(url);
        } catch {
          console.warn('Transformation upload failed for one file');
        }
      }

      const profileUpdate: Record<string, unknown> = {
        name: state.name,
        city: state.city,
        area: state.area,
        gym: state.gym,
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
        profileUpdate.transformations = transformationUrls;
        profileUpdate.age = parseInt(state.age) || null;
        profileUpdate.gender = state.gender || null;
        profileUpdate.trainer_type = state.trainerType || null;
        if (profilePhotoUrl) profileUpdate.profile_photo_url = profilePhotoUrl;
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
    } catch (err) {
      console.error('Onboarding error:', err);
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
          updateState({ availability: state.availability.map(a => a.day === day ? { ...a, timeBlocks: newBlocks } : a) });
        }
      } else {
        updateState({ availability: state.availability.map(a => a.day === day ? { ...a, timeBlocks: [...a.timeBlocks, { start, end }] } : a) });
      }
    } else {
      updateState({ availability: [...state.availability, { day, timeBlocks: [{ start, end }] }] });
    }
  };

  const isAvailable = (day: typeof DAYS[number], timeBlock: string) => {
    const [start, end] = timeBlock.split('-');
    return state.availability.find(a => a.day === day)?.timeBlocks.some(tb => tb.start === start && tb.end === end) ?? false;
  };

  const toggleGoal = (goal: FitnessGoal) => {
    if (state.fitnessGoals.includes(goal)) updateState({ fitnessGoals: state.fitnessGoals.filter(g => g !== goal) });
    else updateState({ fitnessGoals: [...state.fitnessGoals, goal] });
  };

  const toggleSpecialty = (s: string) => {
    if (state.specialty.includes(s)) updateState({ specialty: state.specialty.filter(x => x !== s) });
    else updateState({ specialty: [...state.specialty, s] });
  };

  const toggleCert = (c: string) => {
    if (state.certifications.includes(c)) updateState({ certifications: state.certifications.filter(x => x !== c) });
    else updateState({ certifications: [...state.certifications, c] });
  };

  const canProceed = () => {
    if (isTrainer) {
      switch (state.step) {
        case 1: return state.name.trim() && state.email.trim() && state.password.length >= 6;
        case 2: return !!state.role;
        case 3: return !!state.gender && state.age.trim().length > 0 && !!state.trainerType;
        case 4: return state.city.trim().length > 0 && state.gym.trim().length > 0;
        case 5: return state.specialty.length > 0 && state.bioExpert.trim().length > 0;
        case 6: return state.availability.length > 0;
        default: return false;
      }
    }
    switch (state.step) {
      case 1: return state.name.trim() && state.email.trim() && state.password.length >= 6;
      case 2: return !!state.role;
      case 3: return state.city.trim().length > 0 && state.gym.trim().length > 0;
      case 4: return state.fitnessGoals.length > 0;
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
          <div className="text-sm text-muted-foreground">Step {state.step} of {totalSteps}</div>
        </div>
        <Progress value={progress} className="h-1" />
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-xl">
        <AnimatePresence mode="wait">

        {/* Step 1: Account */}
        {state.step === 1 && (
          <motion.div key="step1" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">Welcome to PT Finder</h1>
              <p className="text-muted-foreground">Find your perfect personal trainer</p>
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
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">How will you use PT Finder?</h1>
              <p className="text-muted-foreground">Choose your role</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => updateState({ role: 'client' })}
                className={cn("p-6 rounded-xl border-2 text-left transition-all",
                  state.role === 'client' ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/50")}>
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center",
                    state.role === 'client' ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg text-foreground">I'm Looking for a Trainer</div>
                    <div className="text-sm text-muted-foreground">Find expert trainers, book sessions, and crush your fitness goals</div>
                  </div>
                </div>
              </button>
              <button onClick={() => updateState({ role: 'trainer' })}
                className={cn("p-6 rounded-xl border-2 text-left transition-all",
                  state.role === 'trainer' ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/50")}>
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center",
                    state.role === 'trainer' ? "bg-primary text-primary-foreground" : "bg-muted")}>
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

        {/* Step 3 (Trainer): Personal Details */}
        {state.step === 3 && isTrainer && (
          <motion.div key="step3-trainer" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">Tell us about yourself</h1>
              <p className="text-muted-foreground">Clients want to know who they're training with</p>
            </div>
            <div className="space-y-4">
              {/* Profile Photo Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Camera className="w-4 h-4" />Profile Photo</Label>
                <input ref={profilePhotoRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePhoto} />
                <div className="flex items-center gap-4">
                  {state.profilePhotoPreview ? (
                    <img src={state.profilePhotoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-primary/20" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                      <Camera className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <Button type="button" variant="outline" onClick={() => profilePhotoRef.current?.click()} className="gap-2">
                    <Upload className="w-4 h-4" />
                    {state.profilePhotoPreview ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="age" className="flex items-center gap-2"><User className="w-4 h-4" />Age</Label>
                  <Input id="age" type="number" min="18" max="80" placeholder="28"
                    value={state.age} onChange={e => updateState({ age: e.target.value })} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {(['male', 'female', 'other'] as const).map(g => (
                      <button key={g} onClick={() => updateState({ gender: g })} type="button"
                        className={cn("px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left capitalize",
                          state.gender === g ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:border-primary/50")}>
                        {state.gender === g && <Check className="w-3.5 h-3.5 inline mr-1.5" />}{g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Briefcase className="w-4 h-4" />Trainer Type</Label>
                <div className="grid grid-cols-1 gap-2">
                  <button type="button" onClick={() => updateState({ trainerType: 'freelancer' })}
                    className={cn("p-4 rounded-xl border-2 text-left transition-all",
                      state.trainerType === 'freelancer' ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/50")}>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center",
                        state.trainerType === 'freelancer' ? "bg-primary text-primary-foreground" : "bg-muted")}>
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Freelancer</div>
                        <div className="text-xs text-muted-foreground">I train independently at various locations</div>
                      </div>
                    </div>
                  </button>
                  <button type="button" onClick={() => updateState({ trainerType: 'gym_affiliated' })}
                    className={cn("p-4 rounded-xl border-2 text-left transition-all",
                      state.trainerType === 'gym_affiliated' ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/50")}>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center",
                        state.trainerType === 'gym_affiliated' ? "bg-primary text-primary-foreground" : "bg-muted")}>
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Gym-Affiliated</div>
                        <div className="text-xs text-muted-foreground">I work at or am affiliated with a gym</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3 (Client) / Step 4 (Trainer): Location & Gym */}
        {((state.step === 3 && !isTrainer) || (state.step === 4 && isTrainer)) && (
          <motion.div key="step-location" {...anim} className="space-y-6">
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
                <Label htmlFor="city" className="flex items-center gap-2"><MapPin className="w-4 h-4" />City</Label>
                <Input id="city" placeholder="e.g., Beirut, Tripoli, Jounieh..."
                  value={state.city} onChange={e => updateState({ city: e.target.value })} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area / Neighborhood (optional)</Label>
                <Input id="area" placeholder="e.g., Hamra, Ashrafieh, Downtown..."
                  value={state.area} onChange={e => updateState({ area: e.target.value })} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gym" className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4" />
                  {isTrainer ? 'Gym / Training Location' : 'Preferred Gym'}
                </Label>
                <Input id="gym"
                  placeholder={isTrainer ? 'e.g., Jefit Gym, Gold\'s Gym Verdun, Home Training...' : 'e.g., Jefit Gym, any gym near me...'}
                  value={state.gym} onChange={e => updateState({ gym: e.target.value })} className="h-12" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4 (Client): Fitness Goals */}
        {state.step === 4 && !isTrainer && (
          <motion.div key="step4-client" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">What are your fitness goals?</h1>
              <p className="text-muted-foreground">Select all that apply -- we'll match you with the right trainer</p>
            </div>
            <div className="space-y-2">
              {FITNESS_GOALS.map(goal => (
                <button key={goal.value} onClick={() => toggleGoal(goal.value)} type="button"
                  className={cn("w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3",
                    state.fitnessGoals.includes(goal.value) ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50")}>
                  <span className="text-2xl">{goal.emoji}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-foreground">{goal.label}</div>
                    <div className="text-xs text-muted-foreground">{goal.description}</div>
                  </div>
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                    state.fitnessGoals.includes(goal.value) ? "border-primary bg-primary" : "border-muted-foreground")}>
                    {state.fitnessGoals.includes(goal.value) && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 5 (Trainer): Expertise */}
        {state.step === 5 && isTrainer && (
          <motion.div key="step5-trainer" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">Build your trainer profile</h1>
              <p className="text-muted-foreground">Clients will see this when deciding to book you</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio-expert">Professional Bio</Label>
                <Textarea id="bio-expert"
                  placeholder="e.g., NASM-certified trainer with 5+ years of experience. Specializing in body transformations and strength training."
                  value={state.bioExpert} onChange={e => updateState({ bioExpert: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="hourly-rate" className="flex items-center gap-2"><DollarSign className="w-4 h-4" />Rate ($/session)</Label>
                  <Input id="hourly-rate" type="number" min="10" max="500" step="5" placeholder="50"
                    value={state.hourlyRate} onChange={e => updateState({ hourlyRate: e.target.value })} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience" className="flex items-center gap-2"><Award className="w-4 h-4" />Years of Experience</Label>
                  <Input id="experience" type="number" min="0" max="40" placeholder="5"
                    value={state.yearsExperience} onChange={e => updateState({ yearsExperience: e.target.value })} className="h-12" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Specialties</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SPECIALTIES.map(s => (
                    <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                      className={cn("px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left",
                        state.specialty.includes(s) ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:border-primary/50")}>
                      {state.specialty.includes(s) && <Check className="w-3.5 h-3.5 inline mr-1.5" />}{s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Certifications</Label>
                <div className="flex flex-wrap gap-2">
                  {CERTIFICATIONS.map(c => (
                    <button key={c} type="button" onClick={() => toggleCert(c)}
                      className={cn("px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                        state.certifications.includes(c) ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:border-primary/50")}>
                      {state.certifications.includes(c) && <Check className="w-3 h-3 inline mr-1" />}{c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transformation Photos Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Camera className="w-4 h-4" />Client Transformation Photos</Label>
                <input ref={transformationRef} type="file" accept="image/*" className="hidden" onChange={handleTransformationPhoto} />
                {state.transformationPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {state.transformationPreviews.map((preview, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                        <img src={preview} alt={`Transformation ${i + 1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeTransformation(i)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => transformationRef.current?.click()} className="gap-2">
                  <Plus className="w-4 h-4" /> Add Transformation Photo
                </Button>
                <p className="text-xs text-muted-foreground">Upload before/after photos of your clients</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 5 (Client) / Step 6 (Trainer): Availability */}
        {((state.step === 5 && !isTrainer) || (state.step === 6 && isTrainer)) && (
          <motion.div key="step-availability" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                {isTrainer ? 'When are you available to train?' : 'When can you train?'}
              </h1>
              <p className="text-muted-foreground">Tap the times that work for you</p>
            </div>
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="min-w-[500px]">
                <div className="grid grid-cols-8 gap-1">
                  <div className="h-10" />
                  {DAYS.map(day => (
                    <div key={day} className="h-10 flex items-center justify-center text-xs font-medium text-muted-foreground">{day.slice(0, 3)}</div>
                  ))}
                  {TIME_BLOCKS.map(block => (
                    <Fragment key={block.value}>
                      <div className="h-12 flex items-center text-xs text-muted-foreground pr-2">{block.label}</div>
                      {DAYS.map(day => (
                        <button key={`${day}-${block.value}`} type="button" onClick={() => toggleAvailability(day, block.value)}
                          className={cn("h-12 rounded-lg border transition-all",
                            isAvailable(day, block.value) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50")}>
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
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button
            variant={state.step === totalSteps ? 'coral' : 'default'}
            onClick={nextStep}
            disabled={!canProceed() || submitting}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Setting up...</>
            ) : state.step === totalSteps ? (
              <>{isTrainer ? 'Launch My Profile' : 'Find Trainers'}<ArrowRight className="w-4 h-4 ml-2" /></>
            ) : (
              <>Continue<ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
