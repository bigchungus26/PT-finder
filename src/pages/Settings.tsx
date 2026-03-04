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
import {
  ArrowLeft, LogOut, X, Plus, DollarSign, Dumbbell,
  Shield, Clock, FileCheck, Package, Loader2, CheckCircle2,
  XCircle, ExternalLink, MapPin, User, Briefcase, Building, Camera, Award, Upload,
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
  const { signOut } = useAuth();
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

  const [verifyType, setVerifyType] = useState<VerifyType>('id_card');
  const [verifyUrl, setVerifyUrl] = useState('');
  const [verifyNotes, setVerifyNotes] = useState('');

  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgHours, setPkgHours] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');

  const isTrainer = profile?.user_role === 'trainer';
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const { data: myVerifications = [] } = useMyVerifications();
  const submitVerification = useSubmitVerification();
  const { data: myPackages = [] } = useMyPackages();
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();

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
      }
      await updateProfile.mutateAsync(updates as any);
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
            </>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>

        {/* ID Verification (trainers only) */}
        {isTrainer && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" /> Identity Verification
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Submit your Lebanese ID card or passport to earn a verified badge.
            </p>

            {myVerifications.length > 0 && (
              <div className="space-y-2 mb-4">
                {myVerifications.map(v => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-card text-sm">
                    <div className="flex items-center gap-2">
                      <span className="capitalize font-medium">{v.type.replace('_', ' ')}</span>
                      {v.document_url && (
                        <a href={v.document_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <Badge variant="outline" className={cn(
                      v.status === 'approved' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      v.status === 'rejected' && 'bg-red-50 text-red-700 border-red-200',
                      v.status === 'pending' && 'bg-amber-50 text-amber-700 border-amber-200',
                    )}>
                      {v.status === 'approved' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {v.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                      {v.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/30">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Document Type</Label>
                  <select value={verifyType} onChange={e => setVerifyType(e.target.value as VerifyType)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="id_card">Lebanese ID Card</option>
                    <option value="passport">Passport</option>
                    <option value="transcript">Certification / Transcript</option>
                    <option value="linkedin">LinkedIn Profile</option>
                    <option value="background_check">Background Check</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Document URL / Image Link</Label>
                  <Input placeholder="https://..." value={verifyUrl} onChange={e => setVerifyUrl(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input placeholder="Any additional context for the reviewer..." value={verifyNotes} onChange={e => setVerifyNotes(e.target.value)} />
              </div>
              <Button size="sm" disabled={submitVerification.isPending}
                onClick={async () => {
                  try {
                    await submitVerification.mutateAsync({
                      type: verifyType,
                      document_url: verifyUrl.trim() || undefined,
                      notes: verifyNotes.trim() || undefined,
                    });
                    toast({ title: 'Verification submitted for review' });
                    setVerifyUrl('');
                    setVerifyNotes('');
                  } catch {
                    toast({ title: 'Submission failed', variant: 'destructive' });
                  }
                }}
                className="gap-1.5">
                {submitVerification.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                Submit for Review
              </Button>
            </div>
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

        <div className="mt-12 pt-8 border-t border-border">
          <Button variant="outline" onClick={() => signOut().then(() => toast({ title: 'Signed out' }))} className="text-muted-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
