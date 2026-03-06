import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, Star, DollarSign, Shield, Clock, Dumbbell,
  ChevronRight, MapPin, Award, Home, Apple, ArrowRight, Lock,
} from 'lucide-react';
import { useTutors, type TrainerWithDetails } from '@/hooks/useTutors';

function PreviewTrainerCard({ trainer }: { trainer: TrainerWithDetails }) {
  const slotCount = trainer.availability?.length ?? 0;

  return (
    <div className="group block rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xl font-bold text-primary shrink-0 overflow-hidden">
          {trainer.profile_photo_url ? (
            <img src={trainer.profile_photo_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
          ) : (
            trainer.name?.charAt(0)?.toUpperCase() ?? '?'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{trainer.name}</h3>
            {trainer.verified_status && (
              <Badge variant="outline" className="text-xs gap-1 text-blue-600 border-blue-200 bg-blue-50">
                <Shield className="w-3 h-3" /> Verified
              </Badge>
            )}
          </div>
          {trainer.bio_expert && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{trainer.bio_expert}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <Star className="w-3.5 h-3.5 fill-current" />
              {(trainer.rating_avg ?? 0).toFixed(1)}
              <span className="text-muted-foreground font-normal">({trainer.total_reviews})</span>
            </span>
            {trainer.hourly_rate != null && (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <DollarSign className="w-3.5 h-3.5" />{trainer.hourly_rate}/session
              </span>
            )}
            {trainer.city && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />{trainer.city}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Button size="sm" asChild>
            <Link
              to="/onboarding"
              onClick={() => localStorage.setItem('kotch_preselected_trainer', trainer.id)}
            >
              Book <Lock className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
      {(trainer.specialty ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
          {(trainer.specialty ?? []).slice(0, 4).map((s: string) => (
            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiscoverPreview() {
  const [search, setSearch] = useState('');
  const { data: trainers = [], isLoading } = useTutors();

  const filtered = useMemo(() => {
    if (!search.trim()) return trainers;
    const q = search.toLowerCase();
    return trainers.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.city?.toLowerCase().includes(q) ||
      (t.specialty ?? []).some((s: string) => s.toLowerCase().includes(q))
    );
  }, [trainers, search]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">Kotch</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link to="/onboarding">Sign up to book <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-1">Browse Trainers</h1>
          <p className="text-muted-foreground">Preview real trainers on Kotch. Sign up to book or message them.</p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, specialty, or city..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium text-foreground mb-1">No trainers found</h3>
            <p className="text-sm text-muted-foreground">Try a different search term.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{filtered.length} trainer{filtered.length !== 1 ? 's' : ''} available</p>
            {filtered.map(t => <PreviewTrainerCard key={t.id} trainer={t} />)}
          </div>
        )}

        <div className="mt-8 p-6 rounded-xl bg-primary/5 border border-primary/20 text-center">
          <h3 className="font-display font-semibold text-foreground mb-2">Ready to start training?</h3>
          <p className="text-sm text-muted-foreground mb-4">Create a free account to book sessions, message trainers, and track your progress.</p>
          <Button asChild>
            <Link to="/onboarding">Get Started Free <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
