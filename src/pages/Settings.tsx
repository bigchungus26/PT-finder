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
import { ArrowLeft, LogOut, BookOpen, X, Plus, DollarSign, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

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
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const { data: allCourses = [], isLoading: coursesLoading } = useCourses();
  const { data: userCourses = [] } = useUserCourses(profile?.id);
  const enrollCourse = useEnrollCourse();
  const unenrollCourse = useUnenrollCourse();

  const isTutor = profile?.user_role === 'tutor';

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setSchool(profile.school ?? '');
      setMajor(profile.major ?? '');
      setYear(profile.year ?? '');
      setBio(profile.bio ?? '');
      setAvatar(profile.avatar ?? '');
      setBioExpert(profile.bio_expert ?? '');
      setHourlyRate(profile.hourly_rate ? String(profile.hourly_rate) : '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updates: Record<string, unknown> = {
        name: name.trim() || undefined,
        school: school.trim() || undefined,
        major: major.trim() || undefined,
        year: year.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar: avatar.trim() || null,
      };
      if (isTutor) {
        updates.bio_expert = bioExpert.trim() || undefined;
        updates.hourly_rate = hourlyRate ? parseFloat(hourlyRate) : null;
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
      toast({ title: 'Course added' });
      setSelectedCourseId('');
    } catch (err) {
      toast({
        title: 'Could not add course',
        description: err instanceof Error ? err.message : 'Something went wrong.',
        variant: 'destructive',
      });
    }
  };

  const handleUnenroll = async (courseId: string) => {
    try {
      await unenrollCourse.mutateAsync(courseId);
      toast({ title: 'Course removed' });
    } catch (err) {
      toast({
        title: 'Could not remove course',
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
          Update your profile and manage your courses.
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
            <Label htmlFor="school">School</Label>
            <Input
              id="school"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="Your school"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="major">Major</Label>
              <Input
                id="major"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="Major"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. Sophomore"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short bio for your study profile"
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
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Tutor Profile
                </h2>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio-expert">Professional Headline</Label>
                <Textarea
                  id="bio-expert"
                  value={bioExpert}
                  onChange={(e) => setBioExpert(e.target.value)}
                  placeholder="Describe your expertise and teaching approach"
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
            Your Courses
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Add or remove courses so matching and study groups stay accurate.
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Enrolled courses</h3>
              {coursesLoading ? (
                <p className="text-sm text-muted-foreground">Loading courses...</p>
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
                  You haven&apos;t added any courses yet.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-medium mb-2">Add a course</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">
                    {availableCourses.length ? 'Select a course' : 'No more courses available'}
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
                  Add course
                </Button>
              </div>
            </div>
          </div>
        </div>

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
