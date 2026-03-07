import { useParams, Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Globe,
  Users,
  Star,
  Shield,
  DollarSign,
  ChevronRight,
  Building2,
  Copy,
  Check,
} from 'lucide-react';
import { useGym } from '@/hooks/useGyms';
import { useAuth } from '@/contexts/AuthContext';
import type { ProfileRow } from '@/types/database';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

function TrainerCard({ trainer }: { trainer: ProfileRow }) {
  return (
    <Link
      to={`/trainers/${trainer.id}`}
      className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-lg font-bold text-primary shrink-0">
        {trainer.avatar ? (
          <img src={trainer.avatar} alt="" className="w-12 h-12 rounded-xl object-cover" />
        ) : (
          trainer.name?.charAt(0)?.toUpperCase() ?? '?'
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-foreground truncate">{trainer.name}</span>
          {trainer.verified_status && (
            <Badge variant="outline" className="text-xs gap-1 text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 shrink-0">
              <Shield className="w-3 h-3" />
              Verified
            </Badge>
          )}
        </div>
        {trainer.bio_expert && (
          <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{trainer.bio_expert}</p>
        )}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
            <Star className="w-3 h-3 fill-current" />
            {(trainer.rating_avg ?? 0).toFixed(1)}
            <span className="text-muted-foreground font-normal">({trainer.total_reviews})</span>
          </span>
          {trainer.hourly_rate && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <DollarSign className="w-3 h-3" />
              {trainer.hourly_rate}/hr
            </span>
          )}
          {trainer.service_type === 'diet_and_training' && (
            <Badge variant="secondary" className="text-xs">Diet + Training</Badge>
          )}
        </div>
        {trainer.specialty && trainer.specialty.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {trainer.specialty.slice(0, 3).map((s) => (
              <Badge key={s} variant="secondary" className="text-xs py-0">{s}</Badge>
            ))}
            {trainer.specialty.length > 3 && (
              <Badge variant="secondary" className="text-xs py-0">+{trainer.specialty.length - 3} more</Badge>
            )}
          </div>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
    </Link>
  );
}

const GymProfile = () => {
  const { gymId } = useParams<{ gymId: string }>();
  const { profile } = useAuth();
  const { data: gym, isLoading } = useGym(gymId);
  const { toast } = useToast();
  const [codeCopied, setCodeCopied] = useState(false);

  const isOwner = profile?.id && gym?.owner_id === profile.id;

  const copyInviteCode = () => {
    if (!gym?.invite_code) return;
    navigator.clipboard.writeText(gym.invite_code);
    setCodeCopied(true);
    toast({ title: 'Invite code copied!', description: 'Share this with your trainers so they can join your gym.' });
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!gym) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Gym not found</h2>
          <p className="text-muted-foreground mb-4">This gym profile doesn't exist or has been removed.</p>
          <Link to="/discover?tab=gyms">
            <Button variant="outline">Browse Gyms</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Gym header */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
          <div className="px-6 pb-6 -mt-10">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="flex items-end gap-4">
                <div className="w-20 h-20 rounded-2xl border-4 border-card bg-card shadow flex items-center justify-center overflow-hidden">
                  {gym.logo_url ? (
                    <img src={gym.logo_url} alt={gym.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-10 h-10 text-primary" />
                  )}
                </div>
                <div className="mb-1">
                  <h1 className="font-display text-2xl font-bold text-foreground leading-tight">{gym.name}</h1>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{gym.city || gym.address || 'Location not set'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {gym.website && (
                  <a href={gym.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      Website
                    </Button>
                  </a>
                )}
                {isOwner && (
                  <Link to="/settings?tab=gym">
                    <Button variant="outline" size="sm">Edit Profile</Button>
                  </Link>
                )}
              </div>
            </div>

            {gym.description && (
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{gym.description}</p>
            )}

            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {gym.trainer_count} trainer{gym.trainer_count !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Owner invite code section */}
        {isOwner && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground mb-1">Trainer Invite Code</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Share this code with your trainers. They enter it during sign-up or in their Settings
              to appear under your gym's profile.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-lg px-4 py-2.5 font-mono text-lg font-bold tracking-widest text-foreground text-center">
                {gym.invite_code}
              </div>
              <Button variant="outline" size="sm" onClick={copyInviteCode} className="gap-1.5 shrink-0">
                {codeCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {codeCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Trainers will need to create their own account and enter this code to join your gym.
              You can always share this code — it doesn't expire.
            </p>
          </div>
        )}

        {/* Trainers list */}
        <div>
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Our Trainers
            <Badge variant="secondary">{gym.trainer_count}</Badge>
          </h2>

          {!gym.trainers || gym.trainers.length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-dashed border-border">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {isOwner
                  ? "No trainers yet. Share your invite code so trainers can join your gym."
                  : "No trainers listed yet. Check back soon!"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {gym.trainers.map((trainer) => (
                <TrainerCard key={trainer.id} trainer={trainer} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default GymProfile;
