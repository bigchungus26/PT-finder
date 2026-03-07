import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/components/layout/AppLayout';
import { useCurrentProfile, useUpdateProfile } from '@/hooks/useProfile';
import {
  useCourses,
  useUserCourses,
  useEnrollCourse,
  useUnenrollCourse,
} from '@/hooks/useCourses';
import { useAuth } from '@/contexts/AuthContext';
import { useMyVerifications, useSubmitVerification } from '@/hooks/useVerifications';
import { useMyPackages, useCreatePackage, useUpdatePackage } from '@/hooks/usePackages';
import {
  ArrowLeft, LogOut, BookOpen, X, Plus, DollarSign, Dumbbell,
  Shield, Clock, FileCheck, Package, Loader2, CheckCircle2, XCircle, ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Settings = () => {
  const { data: profile, isLoading } = useCurrentProfile();
  const updateProfile = useUpdateProfile();
  const { signOut } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bioExpert, setBioExpert] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [bufferMinutes, setBufferMinutes] = useState('0');
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const [verifyType, setVerifyType] = useState<'transcript' | 'linkedin' | 'background_check' | 'other'>('transcript');
  const [verifyUrl, setVerifyUrl] = useState('');
  const [verifyNotes, setVerifyNotes] = useState('');

  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgHours, setPkgHours] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');

  const { data: allCourses = [], isLoading: coursesLoading } = useCourses();
  const { data: userCourses = [] } = useUserCourses(profile?.id);
  const enrollCourse = useEnrollCourse();
  const unenrollCourse = useUnenrollCourse();

  const isTutor = profile?.user_role === 'trainer';

  const { data: myVerifications = [] } = useMyVerifications();
  const submitVerification = useSubmitVerification();
  const { data: myPackages = [] } = useMyPackages();
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setSchool(profile.area ?? '');
      setMajor(profile.gym ?? '');
      setYear(profile.city ?? '');
      setBio(profile.bio ?? '');
      setAvatar(profile.avatar ?? '');
      setBioExpert(profile.bio_expert ?? '');
      setHourlyRate(profile.hourly_rate ? String(profile.hourly_rate) : '');
      setBufferMinutes(String(profile.buffer_minutes ?? 0));
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updates: Record<string, unknown> = {
        name: name.trim() || undefined,
        area: school.trim() || undefined,
        gym: major.trim() || undefined,
        city: year.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar: avatar.trim() || null,
      };
      if (isTutor) {
        updates.bio_expert = bioExpert.trim() || undefined;
        updates.hourly_rate = hourlyRate ? parseFloat(hourlyRate) : null;
        updates.buffer_minutes = parseInt(bufferMinutes) || 0;
      }
      await updateProfile.mutateAsync(updates as any);
      toast({ title: 'Profile updated' });
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Something went wrong.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Signed out' });
  };

  const handleEnroll = async () => {
    if (!selectedCourseId) return;
    try {
      await enrollCourse.mutateAsync(selectedCourseId);
      toast({ title: 'Specialty added' });
      setSelectedCourseId('');
    } catch (err) {
      toast({
        title: 'Could not add specialty',
        description: err instanceof Error ? err.message : 'Something went wrong.',
        variant: 'destructive',
      });
    }
  };

  const handleUnenroll = async (courseId: string) => {
    try {
      await unenrollCourse.mutateAsync(courseId);
      toast({ title: 'Specialty removed' });
    } catch (err) {
      toast({
        title: 'Could not remove specialty',
        description: err instanceof Error ? err.message : 'Something went wrong.',
        variant: 'destructive',
      });
    }
  };

  const availableCourses = allCourses.filter(
    (course) => !userCourses.some((uc) => uc.course_id === course.id)
  );

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
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">
          Settings
        </h1>
        <p className="text-muted-foreground mb-6">
          Update your profile and manage your training specialties.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email is managed by your account.</p>
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g., New York, Los Angeles"
            />
          </div>
          <div className="space-y-2">
            <Label>Neighborhood / Area</Label>
            <Input
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="e.g., Downtown, West Side"
            />
          </div>
          <div className="space-y-2">
            <Label>Gym / Training Location</Label>
            <Input
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="Your primary gym or training location"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short bio for your fitness profile"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input
              id="avatar"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://..."
            />
          </div>
          {isTutor && (
            <>
              <div className="pt-6 border-t border-border">
                <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  Trainer Profile
                </h2>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio-expert">Professional Headline</Label>
                <Textarea
                  id="bio-expert"
                  value={bioExpert}
                  onChange={(e) => setBioExpert(e.target.value)}
                  placeholder="Describe your expertise and training approach"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly-rate" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Hourly Rate (USD)
                </Label>
                <Input
                  id="hourly-rate"
                  type="number"
                  min="5"
                  max="200"
                  step="5"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="25"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buffer" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Buffer Between Sessions (minutes)
                </Label>
                <select
                  id="buffer"
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="0">No buffer</option>
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Automatically adds rest time between back-to-back bookings.
                </p>
              </div>
            </>
          )}
          <div className="flex gap-3">
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>

        <div className="mt-12">
          <h2 className="font-display text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Training Specialties
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Add or remove specialties so matching stays accurate.
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Enrolled specialties</h3>
              {coursesLoading ? (
                <p className="text-sm text-muted-foreground">Loading specialties...</p>
              ) : userCourses.length ? (
                <div className="space-y-2">
                  {userCourses.map((uc) => {
                    const course = uc.courses;
                    if (!course) return null;
                    return (
                      <div
                        key={uc.course_id}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-card"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {course.code}
                            </Badge>
                            <span className="text-sm font-medium text-foreground">
                              {course.title}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUnenroll(course.id)}
                          disabled={unenrollCourse.isPending}
                          aria-label={`Remove ${course.code}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t added any specialties yet.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-medium mb-2">Add a specialty</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">
                    {availableCourses.length ? 'Select a specialty' : 'No more specialties available'}
                  </option>
                  {availableCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} — {course.title}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  onClick={handleEnroll}
                  disabled={!selectedCourseId || enrollCourse.isPending}
                  className="sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add specialty
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Submission (tutors only) */}
        {isTutor && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              Verification
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Submit documents to earn a verified badge. Admins will review your submission.
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
                    <Badge
                      variant="outline"
                      className={cn(
                        v.status === 'approved' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        v.status === 'rejected' && 'bg-red-50 text-red-700 border-red-200',
                        v.status === 'pending' && 'bg-amber-50 text-amber-700 border-amber-200',
                      )}
                    >
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
                  <select
                    value={verifyType}
                    onChange={e => setVerifyType(e.target.value as typeof verifyType)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="transcript">Transcript</option>
                    <option value="linkedin">LinkedIn Profile</option>
                    <option value="background_check">Background Check</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Document URL</Label>
                  <Input
                    placeholder="https://..."
                    value={verifyUrl}
                    onChange={e => setVerifyUrl(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input
                  placeholder="Any additional context for the admin reviewer..."
                  value={verifyNotes}
                  onChange={e => setVerifyNotes(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                disabled={submitVerification.isPending}
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
                className="gap-1.5"
              >
                {submitVerification.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                Submit for Review
              </Button>
            </div>
          </div>
        )}

        {/* Packages (tutors only) */}
        {isTutor && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Session Packages
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
                        {pkg.total_hours} hours for ${pkg.price} ({(pkg.price / pkg.total_hours).toFixed(0)}/hr effective)
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await updatePackage.mutateAsync({ id: pkg.id, is_active: !pkg.is_active });
                        toast({ title: pkg.is_active ? 'Package deactivated' : 'Package activated' });
                      }}
                    >
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
                  <Input
                    placeholder='e.g., "5-Session Training Pack"'
                    value={pkgTitle}
                    onChange={e => setPkgTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description (optional)</Label>
                  <Input
                    placeholder="What's included..."
                    value={pkgDesc}
                    onChange={e => setPkgDesc(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Total Hours</Label>
                  <Input
                    type="number"
                    min="2"
                    max="50"
                    placeholder="5"
                    value={pkgHours}
                    onChange={e => setPkgHours(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Package Price ($)</Label>
                  <Input
                    type="number"
                    min="10"
                    step="5"
                    placeholder="100"
                    value={pkgPrice}
                    onChange={e => setPkgPrice(e.target.value)}
                  />
                </div>
              </div>
              {pkgHours && pkgPrice && hourlyRate && (
                <p className="text-xs text-muted-foreground">
                  Effective rate: ${(parseFloat(pkgPrice) / parseInt(pkgHours)).toFixed(0)}/hr
                  (vs ${hourlyRate}/hr standard — {((1 - (parseFloat(pkgPrice) / parseInt(pkgHours)) / parseFloat(hourlyRate)) * 100).toFixed(0)}% discount)
                </p>
              )}
              <Button
                size="sm"
                disabled={!pkgTitle.trim() || !pkgHours || !pkgPrice || createPackage.isPending}
                onClick={async () => {
                  try {
                    await createPackage.mutateAsync({
                      title: pkgTitle.trim(),
                      total_hours: parseInt(pkgHours),
                      price: parseFloat(pkgPrice),
                      description: pkgDesc.trim() || undefined,
                    });
                    toast({ title: 'Package created!' });
                    setPkgTitle('');
                    setPkgHours('');
                    setPkgPrice('');
                    setPkgDesc('');
                  } catch {
                    toast({ title: 'Failed to create package', variant: 'destructive' });
                  }
                }}
                className="gap-1.5"
              >
                {createPackage.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create Package
              </Button>
            </div>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-border">
          <Button variant="outline" onClick={handleSignOut} className="text-muted-foreground">
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
