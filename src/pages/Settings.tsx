import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/components/layout/AppLayout';
import { useCurrentProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setSchool(profile.school ?? '');
      setMajor(profile.major ?? '');
      setYear(profile.year ?? '');
      setBio(profile.bio ?? '');
      setAvatar(profile.avatar ?? '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({
        name: name.trim() || undefined,
        school: school.trim() || undefined,
        major: major.trim() || undefined,
        year: year.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar: avatar.trim() || null,
      });
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
          Update your profile and preferences.
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
          <div className="flex gap-3">
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>

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
