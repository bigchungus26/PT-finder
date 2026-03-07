import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/components/layout/AppLayout';
import { useCurrentProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useMyVerifications, useSubmitVerification } from '@/hooks/useVerifications';
import { useMyPackages, useCreatePackage, useUpdatePackage } from '@/hooks/usePackages';
import { useMyTrainingPackages, useCreateTrainingPackage, useUpdateTrainingPackage } from '@/hooks/useTrainingPackages';
import { useCreatePost, useTrainerPosts, computeProfileStrength } from '@/hooks/useRetention';
import { useProfileViews } from '@/hooks/useFeaturesV2';
import {
  ArrowLeft, LogOut, X, Plus, DollarSign, Dumbbell,
  Shield, Clock, FileCheck, Package, Loader2, CheckCircle2,
  XCircle, ExternalLink, MapPin, User, Briefcase, Building, Camera, Award, Upload,
  Home, Apple, Calendar, Sun, Moon, Monitor, MessageSquare, Send, Lightbulb,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/storage';
import { cn } from '@/lib/utils';

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

type VerifyType = 'id_card' | 'passport' | 'transcript' | 'linkedin' | 'background_check' | 'other';

export default function Settings() {
  const { data: profile, isLoading } = useCurrentProfile();
  const updateProfile = useUpdateProfile();
  const { signOut, refreshProfile: refreshAuthProfile } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [gym, setGym] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bioExpert, setBioExpert] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [bufferMinutes, setBufferMinutes] = useState('0');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [trainerType, setTrainerType] = useState<'freelancer' | 'gym_affiliated' | ''>('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [clientsWorkedWith, setClientsWorkedWith] = useState('');
  const [specialty, setSpecialty] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);

  const [offersHomeTraining, setOffersHomeTraining] = useState(false);
  const [homeTrainingCities, setHomeTrainingCities] = useState<string[]>([]);
  const [currentHomeCity, setCurrentHomeCity] = useState('');
  const [offersDietPlan, setOffersDietPlan] = useState(false);

  const [verifyType, setVerifyType] = useState<VerifyType>('id_card');
  const [verifyUrl, setVerifyUrl] = useState('');
  const [verifyNotes, setVerifyNotes] = useState('');

  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgHours, setPkgHours] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');

  const [tpTitle, setTpTitle] = useState('');
  const [tpWeeks, setTpWeeks] = useState('');
  const [tpSessions, setTpSessions] = useState('3');
  const [tpPriceNoDiet, setTpPriceNoDiet] = useState('');
  const [tpPriceDiet, setTpPriceDiet] = useState('');
  const [tpDesc, setTpDesc] = useState('');

  const isTrainer = profile?.user_role === 'trainer';
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('kotch-theme') as any) ?? 'system';
  });

  useEffect(() => {
    const applyTheme = (t: 'light' | 'dark' | 'system') => {
      const root = document.documentElement;
      if (t === 'dark') {
        root.classList.add('dark');
      } else if (t === 'light') {
        root.classList.remove('dark');
      } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    localStorage.setItem('kotch-theme', theme);
    applyTheme(theme);
  }, [theme]);

  const { data: myVerifications = [] } = useMyVerifications();
  const submitVerification = useSubmitVerification();
  const { data: myPackages = [] } = useMyPackages();
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();
  const { data: myTrainingPkgs = [] } = useMyTrainingPackages();
  const createTrainingPkg = useCreateTrainingPackage();
  const updateTrainingPkg = useUpdateTrainingPackage();

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setCity(profile.city ?? '');
      setArea(profile.area ?? '');
      setGym(profile.gym ?? '');
      setBio(profile.bio ?? '');
      setAvatar(profile.avatar ?? '');
      setBioExpert(profile.bio_expert ?? '');
      setHourlyRate(profile.hourly_rate ? String(profile.hourly_rate) : '');
      setBufferMinutes(String(profile.buffer_minutes ?? 0));
      setAge(profile.age ? String(profile.age) : '');
      setGender(profile.gender ?? '');
      setTrainerType(profile.trainer_type ?? '');
      setProfilePhotoUrl(profile.profile_photo_url ?? '');
      setYearsExperience(profile.years_experience ? String(profile.years_experience) : '');
      setClientsWorkedWith(profile.clients_worked_with ? String(profile.clients_worked_with) : '');
      setSpecialty(profile.specialty ?? []);
      setCertifications(profile.certifications ?? []);
      setOffersHomeTraining(profile.offers_home_training ?? false);
      setHomeTrainingCities(profile.home_training_cities ?? []);
      setOffersDietPlan(profile.offers_diet_plan ?? false);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updates: Record<string, unknown> = {
        name: name.trim() || undefined,
        city: city.trim() || undefined,
        area: area.trim() || undefined,
        gym: gym.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar: avatar.trim() || null,
      };
      if (isTrainer) {
        updates.bio_expert = bioExpert.trim() || undefined;
        updates.hourly_rate = hourlyRate ? parseFloat(hourlyRate) : null;
        updates.buffer_minutes = parseInt(bufferMinutes) || 0;
        updates.age = age ? parseInt(age) : null;
        updates.gender = gender || null;
        updates.trainer_type = trainerType || null;
        updates.profile_photo_url = profilePhotoUrl.trim() || null;
        updates.years_experience = parseInt(yearsExperience) || 0;
        updates.clients_worked_with = parseInt(clientsWorkedWith) || 0;
        updates.specialty = specialty;
        updates.certifications = certifications;
        updates.offers_home_training = offersHomeTraining;
        updates.home_training_cities = homeTrainingCities;
        updates.offers_diet_plan = offersDietPlan;
      }
      await updateProfile.mutateAsync(updates as any);
      await refreshAuthProfile();
      toast({ title: 'Profile updated' });
    } catch (err) {
      toast({ title: 'Update failed', description: err instanceof Error ? err.message : 'Something went wrong.', variant: 'destructive' });
    }
  };

  const toggleSpecialty = (s: string) => {
    setSpecialty(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };
  const toggleCert = (c: string) => {
    setCertifications(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  if (isLoading || !profile) {
    return (
      <AppLayout>
        <div className="p-4 lg:p-8 flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 max-w-2xl">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground mb-6">Update your profile and preferences.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile.email} disabled className="bg-muted" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><MapPin className="w-4 h-4" />City</Label>
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g., Beirut" />
            </div>
            <div className="space-y-2">
              <Label>Area / Neighborhood</Label>
              <Input value={area} onChange={e => setArea(e.target.value)} placeholder="e.g., Hamra" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Dumbbell className="w-4 h-4" />Gym</Label>
            <Input value={gym} onChange={e => setGym(e.target.value)} placeholder="Your primary gym or training location" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} placeholder="A short bio" rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input id="avatar" value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://..." />
          </div>

          {/* Trainer-specific fields */}
          {isTrainer && (
            <>
              <div className="pt-6 border-t border-border">
                <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" /> Trainer Profile
                </h2>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Camera className="w-4 h-4" />Profile Photo</Label>
                <input ref={profilePhotoRef} type="file" accept="image/*" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !profile) return;
                    setPhotoUploading(true);
                    try {
                      const url = await uploadFile(file, `profiles/${profile.id}`);
                      setProfilePhotoUrl(url);
                      toast({ title: 'Photo uploaded' });
                    } catch {
                      toast({ title: 'Upload failed', variant: 'destructive' });
                    } finally {
                      setPhotoUploading(false);
                    }
                  }} />
                <div className="flex items-center gap-4">
                  {profilePhotoUrl ? (
                    <img src={profilePhotoUrl} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-primary/20" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                      <Camera className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <Button type="button" variant="outline" onClick={() => profilePhotoRef.current?.click()} disabled={photoUploading} className="gap-2">
                    {photoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {profilePhotoUrl ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><User className="w-4 h-4" />Age</Label>
                  <Input type="number" min="18" max="80" value={age} onChange={e => setAge(e.target.value)} placeholder="28" />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <select value={gender} onChange={e => setGender(e.target.value as any)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Briefcase className="w-4 h-4" />Type</Label>
                  <select value={trainerType} onChange={e => setTrainerType(e.target.value as any)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="gym_affiliated">Gym-Affiliated</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Professional Bio</Label>
                <Textarea value={bioExpert} onChange={e => setBioExpert(e.target.value)}
                  placeholder="Describe your expertise and training approach" rows={3} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><DollarSign className="w-4 h-4" />Rate ($/session)</Label>
                  <Input type="number" min="5" max="500" step="5" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder="50" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Award className="w-4 h-4" />Experience (yrs)</Label>
                  <Input type="number" min="0" max="40" value={yearsExperience} onChange={e => setYearsExperience(e.target.value)} placeholder="5" />
                </div>
                <div className="space-y-2">
                  <Label>Clients Worked With</Label>
                  <Input type="number" min="0" value={clientsWorkedWith} onChange={e => setClientsWorkedWith(e.target.value)} placeholder="50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Clock className="w-4 h-4" />Buffer Between Sessions</Label>
                <select value={bufferMinutes} onChange={e => setBufferMinutes(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="0">No buffer</option>
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                </select>
              </div>

              {/* Specialties */}
              <div className="space-y-2">
                <Label>Specialties</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SPECIALTIES.map(s => (
                    <button type="button" key={s} onClick={() => toggleSpecialty(s)}
                      className={cn("px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left",
                        specialty.includes(s) ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/50"
                      )}>
                      {specialty.includes(s) && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />}{s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-2">
                <Label>Certifications</Label>
                <div className="flex flex-wrap gap-2">
                  {CERTIFICATIONS.map(c => (
                    <button type="button" key={c} onClick={() => toggleCert(c)}
                      className={cn("px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                        certifications.includes(c) ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/50"
                      )}>
                      {certifications.includes(c) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}{c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Home Training */}
              <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm text-foreground">Offer Home Training</p>
                      <p className="text-xs text-muted-foreground">Train clients at their homes</p>
                    </div>
                  </div>
                  <button type="button"
                    onClick={() => setOffersHomeTraining(!offersHomeTraining)}
                    className={cn("w-12 h-7 rounded-full transition-colors relative",
                      offersHomeTraining ? "bg-primary" : "bg-muted-foreground/30")}>
                    <div className={cn("w-5 h-5 rounded-full bg-white absolute top-1 transition-all",
                      offersHomeTraining ? "left-6" : "left-1")} />
                  </button>
                </div>
                {offersHomeTraining && (
                  <div className="space-y-3">
                    <Label className="text-sm">Cities you offer home training in</Label>
                    <div className="flex gap-2">
                      <Input placeholder="e.g., Beirut, Jounieh..."
                        value={currentHomeCity}
                        onChange={e => setCurrentHomeCity(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && currentHomeCity.trim()) {
                            e.preventDefault();
                            if (!homeTrainingCities.includes(currentHomeCity.trim())) {
                              setHomeTrainingCities([...homeTrainingCities, currentHomeCity.trim()]);
                              setCurrentHomeCity('');
                            }
                          }
                        }} />
                      <Button type="button" size="sm" variant="outline"
                        disabled={!currentHomeCity.trim()}
                        onClick={() => {
                          if (currentHomeCity.trim() && !homeTrainingCities.includes(currentHomeCity.trim())) {
                            setHomeTrainingCities([...homeTrainingCities, currentHomeCity.trim()]);
                            setCurrentHomeCity('');
                          }
                        }}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {homeTrainingCities.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {homeTrainingCities.map(c => (
                          <Badge key={c} className="gap-1 bg-primary/10 text-primary border-0 pr-1">
                            {c}
                            <button type="button" onClick={() => setHomeTrainingCities(homeTrainingCities.filter(x => x !== c))}
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

              {/* Diet Planning */}
              <div className="p-4 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Apple className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-sm text-foreground">Offer Diet Planning</p>
                      <p className="text-xs text-muted-foreground">Provide nutrition/diet plans with training packages</p>
                    </div>
                  </div>
                  <button type="button"
                    onClick={() => setOffersDietPlan(!offersDietPlan)}
                    className={cn("w-12 h-7 rounded-full transition-colors relative",
                      offersDietPlan ? "bg-emerald-500" : "bg-muted-foreground/30")}>
                    <div className={cn("w-5 h-5 rounded-full bg-white absolute top-1 transition-all",
                      offersDietPlan ? "left-6" : "left-1")} />
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>

        {/* Theme */}
        <div className="mt-12">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">Appearance</h2>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: 'light' as const, icon: Sun, label: 'Light' },
              { value: 'dark' as const, icon: Moon, label: 'Dark' },
              { value: 'system' as const, icon: Monitor, label: 'System' },
            ]).map(opt => (
              <button key={opt.value} type="button" onClick={() => setTheme(opt.value)}
                className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  theme === opt.value ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/50")}>
                <opt.icon className={cn("w-6 h-6", theme === opt.value ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", theme === opt.value ? "text-primary" : "text-foreground")}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ID Verification (trainers only) */}
        {isTrainer && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" /> Identity Verification
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your Lebanese ID card or passport to earn a verified badge. Documents are stored securely and only visible to admins.
            </p>

            {/* Current verification status */}
            {profile?.verification_status === 'approved' && (
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Your identity is verified</span>
              </div>
            )}
            {profile?.verification_status === 'rejected' && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30 p-3 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">Verification rejected</span>
                </div>
                {profile?.verification_rejection_reason && (
                  <p className="text-xs text-red-600 dark:text-red-400 ml-6">{profile.verification_rejection_reason}</p>
                )}
                <p className="text-xs text-muted-foreground ml-6 mt-1">You can re-submit with updated documents below.</p>
              </div>
            )}
            {profile?.verification_status === 'pending' && (
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30 p-3 mb-4 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-green-600 animate-spin shrink-0" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Verification under review</span>
              </div>
            )}

            {myVerifications.length > 0 && (
              <div className="space-y-2 mb-4">
                {myVerifications.map(v => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-card text-sm">
                    <div className="flex items-center gap-2">
                      <span className="capitalize font-medium">{v.type.replace('_', ' ')}</span>
                      {v.document_path && <span className="text-xs text-muted-foreground">Document uploaded</span>}
                    </div>
                    <Badge variant="outline" className={cn(
                      v.status === 'approved' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      v.status === 'rejected' && 'bg-red-50 text-red-700 border-red-200',
                      v.status === 'pending' && 'bg-green-50 text-green-700 border-green-200',
                    )}>
                      {v.status === 'approved' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {v.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                      {v.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {(profile?.verification_status !== 'pending') && (
            <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Document Type</Label>
                  <select value={verifyType} onChange={e => setVerifyType(e.target.value as VerifyType)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="id_card">Lebanese ID Card</option>
                    <option value="passport">Passport</option>
                    <option value="transcript">Certification / Transcript</option>
                    <option value="background_check">Background Check</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Full Legal Name</Label>
                  <Input placeholder="As shown on your ID" value={verifyUrl} onChange={e => setVerifyUrl(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Upload ID Document (JPG, PNG, or PDF — max 10MB)</Label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        toast({ title: 'File too large', description: 'Maximum 10MB', variant: 'destructive' });
                        e.target.value = '';
                        return;
                      }
                      (window as Record<string, unknown>).__verifyDocFile = file;
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-xs file:font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Input placeholder="Any additional context for the reviewer..." value={verifyNotes} onChange={e => setVerifyNotes(e.target.value)} />
              </div>
              <Button size="sm" disabled={submitVerification.isPending}
                onClick={async () => {
                  const docFile = (window as Record<string, unknown>).__verifyDocFile as File | undefined;
                  if (!docFile) {
                    toast({ title: 'Please upload a document', variant: 'destructive' });
                    return;
                  }
                  try {
                    await submitVerification.mutateAsync({
                      type: verifyType,
                      documentFile: docFile,
                      legalName: verifyUrl.trim() || undefined,
                      notes: verifyNotes.trim() || undefined,
                    });
                    toast({ title: 'Verification submitted for review' });
                    setVerifyUrl('');
                    setVerifyNotes('');
                    delete (window as Record<string, unknown>).__verifyDocFile;
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : 'Submission failed';
                    toast({ title: msg, variant: 'destructive' });
                  }
                }}
                className="gap-1.5">
                {submitVerification.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                Submit for Review
              </Button>
            </div>
            )}
          </div>
        )}

        {/* Packages (trainers only) */}
        {isTrainer && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Session Packages
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Create multi-session discount packages to attract more clients.
            </p>
            {myPackages.length > 0 && (
              <div className="space-y-2 mb-4">
                {myPackages.map(pkg => (
                  <div key={pkg.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 bg-card">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{pkg.title}</span>
                        <Badge variant="outline" className={pkg.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground'}>
                          {pkg.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pkg.total_hours} sessions for ${pkg.price} ({(pkg.price / pkg.total_hours).toFixed(0)}/session)
                      </p>
                    </div>
                    <Button variant="ghost" size="sm"
                      onClick={async () => {
                        await updatePackage.mutateAsync({ id: pkg.id, is_active: !pkg.is_active });
                        toast({ title: pkg.is_active ? 'Package deactivated' : 'Package activated' });
                      }}>
                      {pkg.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/30">
              <h3 className="text-sm font-medium">Create a new package</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Package Title</Label>
                  <Input placeholder='"5-Session Pack"' value={pkgTitle} onChange={e => setPkgTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description (optional)</Label>
                  <Input placeholder="What's included..." value={pkgDesc} onChange={e => setPkgDesc(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Total Sessions</Label>
                  <Input type="number" min="2" max="50" placeholder="5" value={pkgHours} onChange={e => setPkgHours(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Package Price ($)</Label>
                  <Input type="number" min="10" step="5" placeholder="100" value={pkgPrice} onChange={e => setPkgPrice(e.target.value)} />
                </div>
              </div>
              {pkgHours && pkgPrice && hourlyRate && (
                <p className="text-xs text-muted-foreground">
                  Effective rate: ${(parseFloat(pkgPrice) / parseInt(pkgHours)).toFixed(0)}/session
                  (vs ${hourlyRate}/session standard — {((1 - (parseFloat(pkgPrice) / parseInt(pkgHours)) / parseFloat(hourlyRate)) * 100).toFixed(0)}% discount)
                </p>
              )}
              <Button size="sm" disabled={!pkgTitle.trim() || !pkgHours || !pkgPrice || createPackage.isPending}
                onClick={async () => {
                  try {
                    await createPackage.mutateAsync({
                      title: pkgTitle.trim(),
                      total_hours: parseInt(pkgHours),
                      price: parseFloat(pkgPrice),
                      description: pkgDesc.trim() || undefined,
                    });
                    toast({ title: 'Package created!' });
                    setPkgTitle(''); setPkgHours(''); setPkgPrice(''); setPkgDesc('');
                  } catch {
                    toast({ title: 'Failed to create package', variant: 'destructive' });
                  }
                }}
                className="gap-1.5">
                {createPackage.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create Package
              </Button>
            </div>
          </div>
        )}

        {/* Training Packages (trainers only) */}
        {isTrainer && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Training Packages
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Create weekly training packages with duration-based pricing{offersDietPlan ? ' (with and without diet)' : ''}.
            </p>

            {myTrainingPkgs.length > 0 && (
              <div className="space-y-2 mb-4">
                {myTrainingPkgs.map(pkg => (
                  <div key={pkg.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 bg-card">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{pkg.title}</span>
                        <Badge variant="outline" className="text-xs">{pkg.duration_weeks} weeks</Badge>
                        <Badge variant="outline" className={pkg.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground'}>
                          {pkg.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pkg.sessions_per_week}x/week &middot; ${pkg.price_without_diet} (training)
                        {pkg.price_with_diet != null && ` · $${pkg.price_with_diet} (with diet)`}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm"
                      onClick={async () => {
                        await updateTrainingPkg.mutateAsync({ id: pkg.id, is_active: !pkg.is_active });
                        toast({ title: pkg.is_active ? 'Package deactivated' : 'Package activated' });
                      }}>
                      {pkg.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/30">
              <h3 className="text-sm font-medium">Create a new training package</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Package Title</Label>
                  <Input placeholder='"12-Week Transformation"' value={tpTitle} onChange={e => setTpTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description (optional)</Label>
                  <Input placeholder="What's included..." value={tpDesc} onChange={e => setTpDesc(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" />Duration (weeks, min 4)</Label>
                  <Input type="number" min="4" placeholder="12" value={tpWeeks} onChange={e => setTpWeeks(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Sessions / Week</Label>
                  <Input type="number" min="1" max="7" placeholder="3" value={tpSessions} onChange={e => setTpSessions(e.target.value)} />
                </div>
              </div>
              <div className={cn("grid gap-3", offersDietPlan ? "grid-cols-2" : "grid-cols-1")}>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5" />
                    {offersDietPlan ? 'Price (Training Only)' : 'Package Price ($)'}
                  </Label>
                  <Input type="number" min="1" step="5" placeholder="300" value={tpPriceNoDiet} onChange={e => setTpPriceNoDiet(e.target.value)} />
                </div>
                {offersDietPlan && (
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2"><Apple className="w-3.5 h-3.5 text-emerald-600" />Price (With Diet)</Label>
                    <Input type="number" min="1" step="5" placeholder="400" value={tpPriceDiet} onChange={e => setTpPriceDiet(e.target.value)} />
                  </div>
                )}
              </div>
              {tpWeeks && tpSessions && tpPriceNoDiet && (
                <p className="text-xs text-muted-foreground">
                  Total sessions: {parseInt(tpWeeks) * parseInt(tpSessions)} &middot;
                  Effective rate: ${(parseFloat(tpPriceNoDiet) / (parseInt(tpWeeks) * parseInt(tpSessions))).toFixed(0)}/session
                </p>
              )}
              <Button size="sm"
                disabled={!tpTitle.trim() || !tpWeeks || parseInt(tpWeeks) < 4 || !tpPriceNoDiet || (offersDietPlan && !tpPriceDiet) || createTrainingPkg.isPending}
                onClick={async () => {
                  try {
                    await createTrainingPkg.mutateAsync({
                      title: tpTitle.trim(),
                      duration_weeks: parseInt(tpWeeks),
                      sessions_per_week: parseInt(tpSessions) || 3,
                      price_without_diet: parseFloat(tpPriceNoDiet),
                      price_with_diet: offersDietPlan && tpPriceDiet ? parseFloat(tpPriceDiet) : null,
                      description: tpDesc.trim() || undefined,
                    });
                    toast({ title: 'Training package created!' });
                    setTpTitle(''); setTpWeeks(''); setTpSessions('3'); setTpPriceNoDiet(''); setTpPriceDiet(''); setTpDesc('');
                  } catch {
                    toast({ title: 'Failed to create package', variant: 'destructive' });
                  }
                }}
                className="gap-1.5">
                {createTrainingPkg.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create Training Package
              </Button>
            </div>
          </div>
        )}

        {/* Response Commitment (Section 9a) */}
        {isTrainer && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Response Commitment
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Let clients know how quickly you respond to messages and booking requests.
            </p>
            <select
              value={profile?.response_commitment ?? 'asap'}
              onChange={async (e) => {
                await updateProfile.mutateAsync({ response_commitment: e.target.value } as Record<string, unknown>);
                toast({ title: 'Response commitment updated' });
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="asap">As soon as I can</option>
              <option value="1hour">Within 1 hour</option>
              <option value="4hours">Within 4 hours</option>
              <option value="24hours">Within 24 hours</option>
            </select>
          </div>
        )}

        {/* Trainer Tips (Section 7a) */}
        {isTrainer && <TrainerTipsSection />}

        {/* Trainer Analytics (Section 9d) */}
        {isTrainer && <TrainerAnalytics />}

        {/* Notification Preferences (Section 10e) */}
        <NotificationPreferences />

        <div className="mt-12 pt-8 border-t border-border">
          <Button variant="outline" onClick={() => signOut().then(() => toast({ title: 'Signed out' }))} className="text-muted-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

function TrainerAnalytics() {
  const { data: views } = useProfileViews();

  return (
    <div className="mt-12">
      <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        <Dumbbell className="w-5 h-5 text-primary" /> Profile Analytics
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4 border border-border/50 text-center">
          <div className="text-2xl font-bold text-foreground">{views?.thisWeek ?? 0}</div>
          <div className="text-xs text-muted-foreground">Views this week</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border/50 text-center">
          <div className="text-2xl font-bold text-foreground">{views?.thisMonth ?? 0}</div>
          <div className="text-xs text-muted-foreground">Views this month</div>
        </div>
      </div>
    </div>
  );
}

function NotificationPreferences() {
  const { data: profile } = useCurrentProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const prefs = (profile?.notification_preferences as Record<string, boolean> | null) ?? {
    booking_request: true,
    booking_confirmed: true,
    booking_declined: true,
    new_message: true,
    session_reminder: true,
    weekly_summary: true,
    announcements: true,
  };

  const togglePref = async (key: string) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    await updateProfile.mutateAsync({ notification_preferences: updated } as any);
    toast({ title: 'Notification preferences updated' });
  };

  const labels: Record<string, string> = {
    booking_request: 'New booking request',
    booking_confirmed: 'Booking confirmed/declined',
    new_message: 'New message',
    session_reminder: 'Session reminder (24hr before)',
    weekly_summary: 'Weekly summary',
    announcements: 'Platform announcements',
  };

  return (
    <div className="mt-12">
      <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" /> Notification Preferences
      </h2>
      <div className="space-y-3">
        {Object.entries(labels).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
            <span className="text-sm text-foreground">{label}</span>
            <button
              onClick={() => togglePref(key)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                prefs[key] ? 'bg-green-600' : 'bg-muted'
              )}
            >
              <span className={cn(
                'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                prefs[key] ? 'translate-x-6' : 'translate-x-1'
              )} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrainerTipsSection() {
  const { user } = useAuth();
  const { data: posts = [] } = useTrainerPosts(user?.id);
  const createPost = useCreatePost();
  const { toast } = useToast();
  const [tipContent, setTipContent] = useState('');

  const thisWeekPosts = posts.filter(p => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(p.created_at) > weekAgo;
  });

  return (
    <div className="mt-12">
      <h2 className="font-display text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-primary" /> Post a Tip
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Share fitness tips with your clients. They'll see these in their feed. ({3 - thisWeekPosts.length} posts remaining this week)
      </p>

      {posts.length > 0 && (
        <div className="space-y-2 mb-4">
          {posts.slice(0, 5).map(p => (
            <div key={p.id} className="p-3 rounded-lg border border-border/50 bg-muted/30">
              <p className="text-sm text-foreground">{p.content}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(p.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/30">
        <Textarea
          placeholder="Share a quick fitness tip (max 280 characters)..."
          value={tipContent}
          onChange={e => setTipContent(e.target.value.slice(0, 280))}
          rows={2}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{tipContent.length}/280</span>
          <Button
            size="sm"
            disabled={!tipContent.trim() || thisWeekPosts.length >= 3 || createPost.isPending}
            onClick={async () => {
              try {
                await createPost.mutateAsync({ content: tipContent.trim() });
                toast({ title: 'Tip posted!' });
                setTipContent('');
              } catch {
                toast({ title: 'Failed to post', variant: 'destructive' });
              }
            }}
            className="gap-1.5"
          >
            {createPost.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Post Tip
          </Button>
        </div>
      </div>
    </div>
  );
}
