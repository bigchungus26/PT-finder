import { useState, useRef, Fragment } from 'react';
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
  Camera,
  Building2,
  UserCheck,
  User,
  Building,
  Briefcase,
  Upload,
  Home,
  Package,
  Apple,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { FitnessGoal, Availability } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'client' | 'trainer' | 'gym';

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
  'Bodybuilding', 'Powerlifting', 'Strength Training', 'HIIT',
  'CrossFit', 'Athleticism & Sports Performance', 'Cardio Endurance',
  'Yoga', 'Pilates', 'Boxing / Kickboxing',
  'Calisthenics', 'Functional Training',
  'Injury Rehab', 'Pre/Post Natal', 'Nutrition Coaching',
  'Flexibility & Mobility', 'Senior Fitness', 'Weight Loss',
];

const CERTIFICATIONS = [
  'NASM-CPT', 'ACE-CPT', 'ISSA-CPT', 'NSCA-CSCS',
  'ACSM-CPT', 'CrossFit Level 1', 'CrossFit Level 2',
  'NASM-PES', 'ACE-GFI', 'Precision Nutrition',
  'NASM-CNC', 'First Aid / CPR', 'Other',
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

interface TrainingPackageDraft {
  title: string;
  durationWeeks: string;
  sessionsPerWeek: string;
  priceWithoutDiet: string;
  priceWithDiet: string;
  description: string;
}

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
  transformationUrls: string[];
  currentTransformationUrl: string;
  gender: string;
  serviceType: 'training_only' | 'diet_and_training';
  gymInviteCode: string;
  // Gym role fields
  gymName: string;
  gymDescription: string;
  gymAddress: string;
  gymWebsite: string;
  // New trainer fields from main
  age: string;
  trainerType: 'freelancer' | 'gym_affiliated' | '';
  offersHomeTraining: boolean;
  homeTrainingCities: string[];
  currentHomeCity: string;
  offersDietPlan: boolean;
  packages: TrainingPackageDraft[];
  currentPackage: TrainingPackageDraft;
  profilePhotoFile: File | null;
  profilePhotoPreview: string;
  transformationFiles: File[];
  transformationPreviews: string[];
}

// Steps by role:
// Client:  1.Account -> 2.Role -> 3.Location -> 4.Goals -> 5.Availability
// Trainer: 1.Account -> 2.Role -> 3.Personal -> 4.Location -> 5.Expertise -> 6.Packages -> 7.Availability
// Gym:     1.Account -> 2.Role -> 3.Gym Details

const Onboarding = () => {
  const navigate = useNavigate();
  const { signUp, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const transformationRef = useRef<HTMLInputElement>(null);

  const STORAGE_KEY = 'kotch-onboarding-progress';

  const loadSavedState = (): Partial<OnboardingState> => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      delete parsed.profilePhotoFile;
      delete parsed.profilePhotoPreview;
      delete parsed.transformationFiles;
      delete parsed.transformationPreviews;
      return parsed;
    } catch { return {}; }
  };

  const [state, setState] = useState<OnboardingState>(() => ({
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
    transformationUrls: [],
    currentTransformationUrl: '',
    gender: '',
    serviceType: 'training_only',
    gymInviteCode: '',
    gymName: '',
    gymDescription: '',
    gymAddress: '',
    gymWebsite: '',
    age: '',
    trainerType: '',
    offersHomeTraining: false,
    homeTrainingCities: [],
    currentHomeCity: '',
    offersDietPlan: false,
    packages: [],
    currentPackage: { title: '', durationWeeks: '', sessionsPerWeek: '3', priceWithoutDiet: '', priceWithDiet: '', description: '' },
    profilePhotoFile: null,
    profilePhotoPreview: '',
    transformationFiles: [],
    transformationPreviews: [],
    ...loadSavedState(),
  }));

  const isTrainer = state.role === 'trainer';
  const isGym = state.role === 'gym';

  const totalSteps = isGym ? 3 : isTrainer ? 7 : 5;
  const progress = (state.step / totalSteps) * 100;

  const updateState = (updates: Partial<OnboardingState>) => {
    setState(prev => {
      const next = { ...prev, ...updates };
      try {
        const { profilePhotoFile, transformationFiles, profilePhotoPreview, transformationPreviews, ...serializable } = next;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
      } catch { /* quota exceeded or private browsing */ }
      return next;
    });
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
      const { error: signUpError, needsConfirmation } = await signUp(state.email, state.password, { name: state.name });
      if (signUpError) {
        const raw = (signUpError as { message?: string })?.message ?? '';
        let msg = 'Could not create account.';
        if (raw.includes('already registered')) msg = 'An account with this email already exists. Try logging in.';
        else if (raw.includes('Password')) msg = 'Password must be at least 6 characters.';
        else if (raw.includes('valid email')) msg = 'Please enter a valid email address.';
        toast({ title: 'Sign up failed', description: msg, variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      if (needsConfirmation) {
        toast({
          title: 'Account created!',
          description: 'Please check your email to confirm your account, then log in.',
        });
        setSubmitting(false);
        localStorage.removeItem(STORAGE_KEY);
        navigate('/login');
        return;
      }

      let user = (await supabase.auth.getSession()).data.session?.user ?? null;
      for (let i = 0; i < 10 && !user; i++) {
        await new Promise(r => setTimeout(r, 400));
        user = (await supabase.auth.getSession()).data.session?.user ?? null;
      }
      if (!user) {
        toast({ title: 'Account created!', description: 'Please log in with your email and password.' });
        setSubmitting(false);
        localStorage.removeItem(STORAGE_KEY);
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
        city: state.city || state.area,
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
        profileUpdate.gender = state.gender || null;
        profileUpdate.service_type = state.serviceType;
        profileUpdate.age = parseInt(state.age) || null;
        profileUpdate.trainer_type = state.trainerType || null;
        profileUpdate.offers_home_training = state.offersHomeTraining;
        profileUpdate.home_training_cities = state.homeTrainingCities;
        profileUpdate.offers_diet_plan = state.offersDietPlan;
        if (profilePhotoUrl) profileUpdate.profile_photo_url = profilePhotoUrl;
      }

      if (isGym) {
        profileUpdate.user_role = 'gym';
      }

      await supabase.from('profiles').update(profileUpdate).eq('id', user.id);

      // Create gym record if registering as gym
      if (isGym && state.gymName.trim()) {
        const { data: newGym } = await supabase
          .from('gyms')
          .insert({
            name: state.gymName.trim(),
            description: state.gymDescription.trim() || null,
            city: state.city || state.area,
            address: state.gymAddress.trim() || null,
            website: state.gymWebsite.trim() || null,
            owner_id: user.id,
          })
          .select()
          .single();

        if (newGym) {
          // Link owner to gym
          await supabase.from('profiles').update({ gym_id: newGym.id }).eq('id', user.id);
        }
      }

      // Handle gym join by invite code for trainers
      if (isTrainer && state.gymInviteCode.trim()) {
        const { data: gym } = await supabase
          .from('gyms')
          .select('id')
          .eq('invite_code', state.gymInviteCode.trim().toUpperCase())
          .single();
        if (gym) {
          await supabase.from('profiles').update({ gym_id: gym.id }).eq('id', user.id);
        }
      }

      // Save availability for trainers and clients
      if (!isGym) {
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
      }

      if (isTrainer && state.packages.length > 0) {
        const pkgRows = state.packages.map(pkg => ({
          trainer_id: user!.id,
          title: pkg.title,
          duration_weeks: parseInt(pkg.durationWeeks),
          sessions_per_week: parseInt(pkg.sessionsPerWeek) || 3,
          price_without_diet: parseFloat(pkg.priceWithoutDiet),
          price_with_diet: state.offersDietPlan && pkg.priceWithDiet ? parseFloat(pkg.priceWithDiet) : null,
          description: pkg.description.trim() || null,
        }));
        await supabase.from('training_packages').insert(pkgRows);
      }

      await refreshProfile();
      localStorage.removeItem(STORAGE_KEY);
      setShowWelcome(true);
      setTimeout(() => navigate('/dashboard'), 2500);
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
        case 4: {
          if (!state.city.trim()) return false;
          if (state.offersHomeTraining && state.homeTrainingCities.length === 0) return false;
          if (!state.offersHomeTraining && !state.gym.trim()) return false;
          return true;
        }
        case 5: return state.specialty.length > 0 && state.bioExpert.trim().length > 0;
        case 6: return state.packages.length > 0;
        case 7: return state.availability.length > 0;
        default: return false;
      }
    }
    switch (state.step) {
      case 1: return state.name.trim() && state.email.trim() && state.password.length >= 6;
      case 2: return !!state.role;
      case 3:
        if (isGym) return state.gymName.trim().length > 0 && (state.city.trim().length > 0 || state.area.trim().length > 0);
        return state.area.trim().length > 0 || state.city.trim().length > 0;
      case 4:
        return state.fitnessGoals.length > 0;
      case 5: return state.availability.length > 0;
      case 6: return true; // Gym join is optional
      default: return false;
    }
  };

  const anim = {
    initial: { opacity: 0, x: 12 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -12 },
    transition: { duration: 0.2 },
  };

  const finishLabel = () => {
    if (isGym) return 'Create Gym Profile';
    if (isTrainer) return 'Launch My Profile';
    return 'Find Trainers';
  };

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Welcome to Kotch, {state.name.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">Your fitness journey starts now.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">Kotch</span>
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
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">Welcome to Kotch</h1>
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
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">How will you use Kotch?</h1>
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

              <button onClick={() => updateState({ role: 'gym' })}
                className={cn(
                  "p-6 rounded-xl border-2 text-left transition-all",
                  state.role === 'gym' ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/50"
                )}>
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center",
                    state.role === 'gym' ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg text-foreground">I Represent a Gym</div>
                    <div className="text-sm text-muted-foreground">Create a gym profile and showcase all your trainers in one place</div>
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

        {/* Step 3 (Client) / Step 4 (Trainer): Location */}
        {((state.step === 3 && !isTrainer && !isGym) || (state.step === 4 && isTrainer)) && (
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
                <Label htmlFor="city" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  City
                </Label>
                <Input id="city" placeholder="e.g., New York, Dubai, London..."
                  value={state.city} onChange={e => updateState({ city: e.target.value, area: e.target.value })} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Neighborhood / Area <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="area" placeholder="e.g., Downtown, Brooklyn, Marina..."
                  value={state.area} onChange={e => updateState({ area: e.target.value })} className="h-12" />
              </div>

              {!isTrainer && (
                <div className="space-y-2">
                  <Label htmlFor="gym" className="flex items-center gap-2"><Dumbbell className="w-4 h-4" />Preferred Gym</Label>
                  <Input id="gym" placeholder="e.g., Jefit Gym, any gym near me..."
                    value={state.gym} onChange={e => updateState({ gym: e.target.value })} className="h-12" />
                </div>
              )}

              {isTrainer && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="gym" className="flex items-center gap-2"><Dumbbell className="w-4 h-4" />Gym / Training Location</Label>
                    <Input id="gym" placeholder="e.g., Jefit Gym, Gold's Gym Verdun..."
                      value={state.gym} onChange={e => updateState({ gym: e.target.value })} className="h-12" />
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Home className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm text-foreground">Offer Home Training?</p>
                          <p className="text-xs text-muted-foreground">Train clients at their homes</p>
                        </div>
                      </div>
                      <button type="button"
                        onClick={() => updateState({ offersHomeTraining: !state.offersHomeTraining })}
                        className={cn("w-12 h-7 rounded-full transition-colors relative",
                          state.offersHomeTraining ? "bg-primary" : "bg-muted-foreground/30")}>
                        <div className={cn("w-5 h-5 rounded-full bg-white absolute top-1 transition-all",
                          state.offersHomeTraining ? "left-6" : "left-1")} />
                      </button>
                    </div>

                    {state.offersHomeTraining && (
                      <div className="space-y-3">
                        <Label className="text-sm">Cities you offer home training in</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., Beirut, Jounieh..."
                            value={state.currentHomeCity}
                            onChange={e => updateState({ currentHomeCity: e.target.value })}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && state.currentHomeCity.trim()) {
                                e.preventDefault();
                                if (!state.homeTrainingCities.includes(state.currentHomeCity.trim())) {
                                  updateState({
                                    homeTrainingCities: [...state.homeTrainingCities, state.currentHomeCity.trim()],
                                    currentHomeCity: '',
                                  });
                                }
                              }
                            }}
                            className="h-10"
                          />
                          <Button type="button" size="sm" variant="outline"
                            disabled={!state.currentHomeCity.trim()}
                            onClick={() => {
                              if (state.currentHomeCity.trim() && !state.homeTrainingCities.includes(state.currentHomeCity.trim())) {
                                updateState({
                                  homeTrainingCities: [...state.homeTrainingCities, state.currentHomeCity.trim()],
                                  currentHomeCity: '',
                                });
                              }
                            }}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        {state.homeTrainingCities.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {state.homeTrainingCities.map(city => (
                              <Badge key={city} className="gap-1 bg-primary/10 text-primary border-0 pr-1">
                                {city}
                                <button type="button" onClick={() => updateState({ homeTrainingCities: state.homeTrainingCities.filter(c => c !== city) })}
                                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5">
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 3: Gym Details - Gym role */}
        {state.step === 3 && isGym && (
          <motion.div key="step3-gym" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Set up your gym profile
              </h1>
              <p className="text-muted-foreground">
                You'll get an invite code to share with your trainers
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gym-name">Gym Name</Label>
                <Input id="gym-name" placeholder="e.g., Iron Temple Fitness" value={state.gymName}
                  onChange={e => updateState({ gymName: e.target.value })} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gym-city" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  City
                </Label>
                <Input id="gym-city" placeholder="e.g., Miami, Chicago..."
                  value={state.city} onChange={e => updateState({ city: e.target.value, area: e.target.value })} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gym-address">Address <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="gym-address" placeholder="123 Main St" value={state.gymAddress}
                  onChange={e => updateState({ gymAddress: e.target.value })} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gym-description">About your gym <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea id="gym-description"
                  placeholder="Tell clients what makes your gym special - facilities, atmosphere, specialties..."
                  value={state.gymDescription} onChange={e => updateState({ gymDescription: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gym-website">Website <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="gym-website" placeholder="https://yourgym.com"
                  value={state.gymWebsite} onChange={e => updateState({ gymWebsite: e.target.value })} className="h-12" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Client Goals */}
        {state.step === 4 && !isTrainer && !isGym && (
          <motion.div key="step4-client" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                What are your fitness goals?
              </h1>
              <p className="text-muted-foreground">Select all that apply - we'll match you with the right trainer</p>
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

              {/* Gender */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Gender <span className="text-muted-foreground font-normal">(helps clients find you)</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {GENDER_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => updateState({ gender: opt.value })}
                      className={cn(
                        "px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left",
                        state.gender === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:border-primary/50"
                      )}>
                      {state.gender === opt.value && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
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

              {/* Diet Planning Toggle */}
              <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Apple className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-sm text-foreground">Offer Diet Planning?</p>
                      <p className="text-xs text-muted-foreground">Provide nutrition/diet plans alongside training</p>
                    </div>
                  </div>
                  <button type="button"
                    onClick={() => updateState({ offersDietPlan: !state.offersDietPlan })}
                    className={cn("w-12 h-7 rounded-full transition-colors relative",
                      state.offersDietPlan ? "bg-emerald-500" : "bg-muted-foreground/30")}>
                    <div className={cn("w-5 h-5 rounded-full bg-white absolute top-1 transition-all",
                      state.offersDietPlan ? "left-6" : "left-1")} />
                  </button>
                </div>
                {state.offersDietPlan && (
                  <p className="text-xs text-emerald-600 font-medium pl-7">You'll set "with diet" and "without diet" pricing in the next step.</p>
                )}
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

        {/* Step 6 (Trainer): Training Packages */}
        {state.step === 6 && isTrainer && (
          <motion.div key="step6-trainer" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">Create Your Training Packages</h1>
              <p className="text-muted-foreground">
                Set your packages with duration and pricing{state.offersDietPlan ? ' (with and without diet)' : ''}
              </p>
            </div>

            {/* Existing packages */}
            {state.packages.length > 0 && (
              <div className="space-y-3">
                {state.packages.map((pkg, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border bg-card space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-foreground">{pkg.title}</h3>
                      <button type="button" onClick={() => updateState({ packages: state.packages.filter((_, j) => j !== i) })}
                        className="text-muted-foreground hover:text-destructive">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {pkg.durationWeeks} weeks &middot; {pkg.sessionsPerWeek}x/week
                    </p>
                    <div className="flex gap-3 text-sm">
                      <span className="text-emerald-600 font-semibold">${pkg.priceWithoutDiet}{state.offersDietPlan ? ' (training only)' : ''}</span>
                      {state.offersDietPlan && pkg.priceWithDiet && (
                        <span className="text-primary font-semibold">${pkg.priceWithDiet} (with diet)</span>
                      )}
                    </div>
                    {pkg.description && <p className="text-xs text-muted-foreground">{pkg.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Add package form */}
            <div className="p-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 space-y-4">
              <h3 className="font-medium text-sm text-foreground flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> Add a Package
              </h3>
              <div className="space-y-2">
                <Label>Package Title</Label>
                <Input placeholder='e.g., "Starter Pack", "12-Week Transformation"'
                  value={state.currentPackage.title}
                  onChange={e => updateState({ currentPackage: { ...state.currentPackage, title: e.target.value } })} className="h-10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Calendar className="w-4 h-4" />Duration (weeks)</Label>
                  <Input type="number" min="4" placeholder="Min: 4 weeks"
                    value={state.currentPackage.durationWeeks}
                    onChange={e => updateState({ currentPackage: { ...state.currentPackage, durationWeeks: e.target.value } })} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Sessions / Week</Label>
                  <Input type="number" min="1" max="7" placeholder="3"
                    value={state.currentPackage.sessionsPerWeek}
                    onChange={e => updateState({ currentPackage: { ...state.currentPackage, sessionsPerWeek: e.target.value } })} className="h-10" />
                </div>
              </div>
              <div className={cn("grid gap-3", state.offersDietPlan ? "grid-cols-2" : "grid-cols-1")}>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {state.offersDietPlan ? 'Price (Training Only)' : 'Package Price ($)'}
                  </Label>
                  <Input type="number" min="1" step="5" placeholder="200"
                    value={state.currentPackage.priceWithoutDiet}
                    onChange={e => updateState({ currentPackage: { ...state.currentPackage, priceWithoutDiet: e.target.value } })} className="h-10" />
                </div>
                {state.offersDietPlan && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Apple className="w-4 h-4 text-emerald-600" />Price (With Diet Plan)
                    </Label>
                    <Input type="number" min="1" step="5" placeholder="280"
                      value={state.currentPackage.priceWithDiet}
                      onChange={e => updateState({ currentPackage: { ...state.currentPackage, priceWithDiet: e.target.value } })} className="h-10" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea placeholder="What's included in this package..."
                  value={state.currentPackage.description}
                  onChange={e => updateState({ currentPackage: { ...state.currentPackage, description: e.target.value } })} rows={2} />
              </div>
              {state.currentPackage.durationWeeks && state.currentPackage.sessionsPerWeek && state.currentPackage.priceWithoutDiet && (
                <p className="text-xs text-muted-foreground">
                  Total sessions: {parseInt(state.currentPackage.durationWeeks) * parseInt(state.currentPackage.sessionsPerWeek)} &middot;
                  {' '}Effective rate: ${(parseFloat(state.currentPackage.priceWithoutDiet) / (parseInt(state.currentPackage.durationWeeks) * parseInt(state.currentPackage.sessionsPerWeek))).toFixed(0)}/session
                </p>
              )}
              <Button type="button" variant="outline" className="w-full gap-2"
                disabled={
                  !state.currentPackage.title.trim() ||
                  !state.currentPackage.durationWeeks || parseInt(state.currentPackage.durationWeeks) < 4 ||
                  !state.currentPackage.priceWithoutDiet ||
                  (state.offersDietPlan && !state.currentPackage.priceWithDiet)
                }
                onClick={() => {
                  updateState({
                    packages: [...state.packages, { ...state.currentPackage }],
                    currentPackage: { title: '', durationWeeks: '', sessionsPerWeek: '3', priceWithoutDiet: '', priceWithDiet: '', description: '' },
                  });
                }}>
                <Plus className="w-4 h-4" /> Add Package
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Minimum duration is 4 weeks. Add at least one package to continue.
              </p>
            </div>
          </motion.div>
        )}

        {/* Step 5 (Client) / Step 7 (Trainer): Availability */}
        {((state.step === 5 && !isTrainer && !isGym) || (state.step === 7 && isTrainer)) && (
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

        {/* Step 6: Trainer - Join a Gym (optional) */}
        {state.step === 6 && !isTrainer && !isGym && (
          <motion.div key="step6-gym-join" {...anim} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Are you part of a gym?
              </h1>
              <p className="text-muted-foreground">
                If your gym is on PT Finder, enter their invite code to appear under their profile.
                This is completely optional - you can skip this and join later.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Gym Invite Code
                </Label>
                <Input
                  id="invite-code"
                  placeholder="e.g., AB12CD34"
                  value={state.gymInviteCode}
                  onChange={e => updateState({ gymInviteCode: e.target.value.toUpperCase() })}
                  className="h-12 font-mono tracking-widest text-center text-lg uppercase"
                  maxLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Ask your gym manager for this code. You can also add it later from your Settings.
                </p>
              </div>

              <div className="rounded-xl bg-muted/50 border border-border p-4">
                <h3 className="text-sm font-medium text-foreground mb-1">What does this do?</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Your profile will appear on the gym's page</li>
                  <li>• Clients searching for that gym will see you</li>
                  <li>• You still have your own public profile</li>
                  <li>• The gym cannot edit your profile or see your messages</li>
                </ul>
              </div>
            </div>
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
              <>
                {finishLabel()}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : state.step === 6 && isTrainer ? (
              <>
                {state.gymInviteCode.trim() ? 'Join Gym & Finish' : 'Skip & Finish'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>Continue<ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}

export default Onboarding;
