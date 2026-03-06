import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, Star, DollarSign, Users, Shield, Clock, Dumbbell,
  ChevronRight, SlidersHorizontal, MapPin, Briefcase, Building, Award, Home, Apple,
  Zap, Eye, Heart, Trophy, Loader2,
} from 'lucide-react';
import { useTutors, type TrainerWithDetails } from '@/hooks/useTutors';
import { useGroups } from '@/hooks/useGroups';
import { useRecommendedGroups } from '@/hooks/useMatching';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useMyBookings } from '@/hooks/useBookings';
import { useTutorReviews } from '@/hooks/useReviews';
import { useDiscoverBrowsingCount, useTrackDiscoverSession, computeMatchScore, useTrackEvent } from '@/hooks/useRetention';
import { useSavedTrainers, useToggleSaveTrainer } from '@/hooks/useFeaturesV2';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { TrainerCardSkeleton } from '@/components/ui/skeleton';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const GOAL_FILTERS = [
  { label: 'Lose Weight', emoji: '🔥', specialties: ['Weight Loss', 'HIIT', 'Cardio'] },
  { label: 'Build Muscle', emoji: '💪', specialties: ['Bodybuilding', 'Strength Training'] },
  { label: 'Flexibility & Yoga', emoji: '🧘', specialties: ['Yoga', 'Pilates', 'Flexibility & Mobility'] },
  { label: 'Cardio & Endurance', emoji: '🏃', specialties: ['HIIT', 'CrossFit', 'Functional Training'] },
  { label: 'Martial Arts / Boxing', emoji: '🥊', specialties: ['Boxing / Kickboxing'] },
  { label: 'Diet & Nutrition', emoji: '🍽️', specialties: ['Nutrition Coaching'] },
];

function TrainerCard({ trainer, matchScore, reviewSnippet, isReturning, isSaved, onToggleSave }: {
  trainer: TrainerWithDetails;
  matchScore?: number;
  reviewSnippet?: string;
  isReturning?: boolean;
  isSaved?: boolean;
  onToggleSave?: () => void;
}) {
  return (
    <Link
      to={`/trainers/${trainer.id}`}
      className="block active:scale-[0.98] transition-transform"
      style={{
        borderRadius: 16,
        background: '#111',
        border: '1px solid #1E1E1E',
        padding: 16,
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="overflow-hidden shrink-0"
          style={{ width: 64, height: 64, borderRadius: 12, background: '#141414' }}
        >
          {trainer.profile_photo_url ? (
            <img src={trainer.profile_photo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : trainer.avatar ? (
            <img src={trainer.avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: '#555', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22 }}>
              {trainer.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 16, color: '#F5F0E8' }} className="truncate">
              {trainer.name}
            </span>
            {trainer.verified_status && (
              <span className="flex items-center gap-0.5" style={{ fontSize: 10, color: '#16A34A' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                Verified
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mb-1.5">
            {(trainer.specialty ?? []).slice(0, 2).map((s: string) => (
              <span key={s} style={{ padding: '1px 6px', borderRadius: 4, background: '#1A1A1A', color: '#555', fontSize: 10 }}>
                {s}
              </span>
            ))}
            {(trainer.specialty ?? []).length > 2 && (
              <span style={{ padding: '1px 6px', borderRadius: 4, background: '#1A1A1A', color: '#555', fontSize: 10 }}>
                +{(trainer.specialty ?? []).length - 2}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3" style={{ fontSize: 12 }}>
            {trainer.city && (
              <span className="flex items-center gap-1" style={{ color: '#555' }}>
                <MapPin style={{ width: 12, height: 12 }} />{trainer.city}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star style={{ width: 12, height: 12, fill: '#EAB308', color: '#EAB308' }} />
              <span style={{ color: '#F5F0E8' }}>{(trainer.rating_avg ?? 0).toFixed(1)}</span>
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#16A34A', fontFamily: "'Syne', sans-serif", fontWeight: 600, marginTop: 4 }}>
            from ${trainer.hourly_rate ?? 0}/hr
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 shrink-0">
          {onToggleSave && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
              className="touch-target"
            >
              <Heart className={cn('w-5 h-5', isSaved ? 'fill-red-500 text-red-500 heart-pop' : '')} style={{ color: isSaved ? undefined : '#333' }} />
            </button>
          )}
          {matchScore != null && matchScore > 2 && (
            <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(22,163,74,0.15)', color: '#16A34A', fontSize: 10, fontWeight: 600 }}>
              {Math.min(Math.round((matchScore / 8) * 100), 99)}%
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function FeaturedTrainers({ trainers }: { trainers: TrainerWithDetails[] }) {
  const featured = useMemo(() =>
    trainers
      .filter(t => (t.rating_avg ?? 0) >= 4.0 && (t.total_reviews ?? 0) >= 4)
      .sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0))
      .slice(0, 3),
    [trainers]
  );

  if (featured.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>
          FEATURED TRAINERS
        </h2>
        <Link to="/leaderboard" style={{ fontSize: 12, color: '#16A34A', fontWeight: 500 }}>Leaderboard</Link>
      </div>
      <div className="horizontal-scroll flex gap-3 -mx-4 px-4 pb-1">
        {featured.map(t => (
          <Link
            key={t.id}
            to={`/trainers/${t.id}`}
            className="shrink-0 active:scale-[0.98] transition-transform"
            style={{ width: 180, borderRadius: 14, background: '#0D0D0D', border: '1px solid rgba(22,163,74,0.2)', padding: 14 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="overflow-hidden shrink-0" style={{ width: 40, height: 40, borderRadius: 10, background: '#141414' }}>
                {t.profile_photo_url ? (
                  <img src={t.profile_photo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: '#555', fontSize: 14 }}>{t.name?.charAt(0) ?? '?'}</div>
                )}
              </div>
              <div className="min-w-0">
                <p style={{ fontSize: 13, fontWeight: 600, color: '#F5F0E8' }} className="truncate">{t.name}</p>
                <p style={{ fontSize: 11, color: '#555' }}>{t.city ?? ''}</p>
              </div>
            </div>
            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: 'rgba(22,163,74,0.15)', color: '#16A34A', fontSize: 10, fontWeight: 600, marginBottom: 8 }}>
              ⭐ Top Rated
            </span>
            <div className="flex items-center gap-2" style={{ fontSize: 12 }}>
              <span className="flex items-center gap-0.5">
                <Star style={{ width: 12, height: 12, fill: '#EAB308', color: '#EAB308' }} />
                <span style={{ color: '#F5F0E8' }}>{(t.rating_avg ?? 0).toFixed(1)}</span>
              </span>
              {t.hourly_rate && <span style={{ color: '#16A34A', fontWeight: 600 }}>${t.hourly_rate}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'trainers';
  const { user } = useAuth();
  const { data: profile } = useCurrentProfile();
  const { data: myBookings = [] } = useMyBookings();
  const trackDiscover = useTrackDiscoverSession();
  const trackEvent = useTrackEvent();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'newest' | 'price_low' | 'price_high'>('rating');
  const [rateFilter, setRateFilter] = useState('any');
  const [ratingFilter, setRatingFilter] = useState('any');
  const [specialtyFilter, setSpecialtyFilter] = useState('any');
  const [cityFilter, setCityFilter] = useState('');
  const [trainerTypeFilter, setTrainerTypeFilter] = useState('any');
  const [genderFilter, setGenderFilter] = useState('any');
  const [dayFilter, setDayFilter] = useState('any');
  const [homeTrainingFilter, setHomeTrainingFilter] = useState(false);
  const [dietFilter, setDietFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [goalFilter, setGoalFilter] = useState<string | null>(null);
  const [availabilityFilter, setAvailabilityFilter] = useState<'any' | 'today' | 'week'>('any');

  const { data: savedTrainers = [] } = useSavedTrainers();
  const toggleSave = useToggleSaveTrainer();
  const savedIds = useMemo(() => new Set(savedTrainers.map((s: any) => s.trainer_id)), [savedTrainers]);

  useEffect(() => {
    setSearchLoading(true);
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: trainers = [], isLoading: trainersLoading } = useTutors();
  const { data: allGroups = [], isLoading: groupsLoading } = useGroups();
  const recommendedGroups = useRecommendedGroups();

  const browsingCity = cityFilter.trim() || profile?.city || '';
  const { data: browsingCount = 0 } = useDiscoverBrowsingCount(browsingCity || undefined);

  useEffect(() => {
    trackDiscover.mutate(browsingCity || undefined);
    trackEvent.mutate({ event_name: 'first_discover_load' });
  }, []);

  const bookedTrainerIds = useMemo(() => {
    if (!user) return new Set<string>();
    return new Set(
      myBookings
        .filter(b => b.student_id === user.id && b.status === 'completed')
        .map(b => b.tutor_id)
    );
  }, [myBookings, user]);

  const allSpecialties = useMemo(() => {
    const set = new Set<string>();
    trainers.forEach(t => (t.specialty ?? []).forEach((s: string) => set.add(s)));
    return Array.from(set).sort();
  }, [trainers]);

  const allCities = useMemo(() => {
    const set = new Set<string>();
    trainers.forEach(t => { if (t.city) set.add(t.city); });
    return Array.from(set).sort();
  }, [trainers]);

  const filteredTrainers = useMemo(() => {
    let list = trainers;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.name?.toLowerCase().includes(q) ||
        t.bio_expert?.toLowerCase().includes(q) ||
        (t.specialty ?? []).some((s: string) => s.toLowerCase().includes(q)) ||
        t.city?.toLowerCase().includes(q) ||
        t.gym?.toLowerCase().includes(q)
      );
    }
    if (rateFilter !== 'any') {
      const max = parseInt(rateFilter);
      list = list.filter(t => (t.hourly_rate ?? 0) <= max);
    }
    if (ratingFilter !== 'any') {
      const min = parseFloat(ratingFilter);
      list = list.filter(t => (t.rating_avg ?? 0) >= min);
    }
    if (specialtyFilter !== 'any') {
      list = list.filter(t => (t.specialty ?? []).some((s: string) => s === specialtyFilter));
    }
    if (cityFilter.trim()) {
      const c = cityFilter.toLowerCase();
      list = list.filter(t => t.city?.toLowerCase().includes(c));
    }
    if (trainerTypeFilter !== 'any') {
      list = list.filter(t => t.trainer_type === trainerTypeFilter);
    }
    if (genderFilter !== 'any') {
      list = list.filter(t => t.gender === genderFilter);
    }
    if (dayFilter !== 'any') {
      list = list.filter(t =>
        (t.availability ?? []).some(a => a.day.toLowerCase() === dayFilter.toLowerCase())
      );
    }
    if (homeTrainingFilter) {
      list = list.filter(t => t.offers_home_training);
    }
    if (dietFilter) {
      list = list.filter(t => t.offers_diet_plan);
    }
    // Goal-based filter (Section 8b)
    if (goalFilter) {
      const gf = GOAL_FILTERS.find(g => g.label === goalFilter);
      if (gf) {
        list = list.filter(t =>
          (t.specialty ?? []).some((s: string) =>
            gf.specialties.some(gs => s.toLowerCase().includes(gs.toLowerCase()))
          )
        );
      }
    }
    // Availability filter (Section 8a)
    if (availabilityFilter === 'today') {
      const todayDay = DAYS[((new Date().getDay() + 6) % 7)];
      list = list.filter(t =>
        (t.availability ?? []).some(a => a.day === todayDay)
      );
    } else if (availabilityFilter === 'week') {
      list = list.filter(t => (t.availability ?? []).length > 0);
    }

    // Smart sort for returning clients (Section 8e)
    if (bookedTrainerIds.size > 0) {
      list = [...list].sort((a, b) => {
        const aBooked = bookedTrainerIds.has(a.id) ? 1 : 0;
        const bBooked = bookedTrainerIds.has(b.id) ? 1 : 0;
        if (aBooked !== bBooked) return bBooked - aBooked;
        const aArea = a.area?.toLowerCase() === profile?.area?.toLowerCase() ? 1 : 0;
        const bArea = b.area?.toLowerCase() === profile?.area?.toLowerCase() ? 1 : 0;
        if (aArea !== bArea) return bArea - aArea;
        return (b.rating_avg ?? 0) - (a.rating_avg ?? 0);
      });
    } else {
      list = [...list].sort((a, b) => {
        switch (sortBy) {
          case 'reviews': return (b.total_reviews ?? 0) - (a.total_reviews ?? 0);
          case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'price_low': return (a.hourly_rate ?? 999) - (b.hourly_rate ?? 999);
          case 'price_high': return (b.hourly_rate ?? 0) - (a.hourly_rate ?? 0);
          default: return (b.rating_avg ?? 0) - (a.rating_avg ?? 0);
        }
      });
    }

    return list;
  }, [trainers, search, rateFilter, ratingFilter, specialtyFilter, cityFilter, trainerTypeFilter, genderFilter, dayFilter, homeTrainingFilter, dietFilter, goalFilter, availabilityFilter, bookedTrainerIds, profile?.area, sortBy]);

  const filteredGroups = useMemo(() => {
    if (!searchInput.trim()) return allGroups;
    const q = searchInput.toLowerCase();
    return allGroups.filter(g => g.name?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q));
  }, [allGroups, searchInput]);

  const activeFilterCount = [
    rateFilter !== 'any', ratingFilter !== 'any', specialtyFilter !== 'any',
    cityFilter.trim() !== '', trainerTypeFilter !== 'any', genderFilter !== 'any', dayFilter !== 'any',
    homeTrainingFilter, dietFilter, goalFilter !== null, availabilityFilter !== 'any',
  ].filter(Boolean).length;

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-1">Discover</h1>
          <p className="text-muted-foreground">Find the perfect trainer or join a community</p>
        </div>

        <Tabs value={activeTab} onValueChange={v => setSearchParams({ tab: v })}>
          <TabsList className="mb-6">
            <TabsTrigger value="trainers" className="gap-2"><Dumbbell className="w-4 h-4" />Find a Trainer</TabsTrigger>
            <TabsTrigger value="community" className="gap-2"><Users className="w-4 h-4" />Community</TabsTrigger>
          </TabsList>

          <TabsContent value="trainers" className="space-y-4">
            {/* Live browsing counter (Section 5e) */}
            {browsingCount >= 3 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <Eye className="w-4 h-4 text-primary" />
                <span>{browsingCount} people are browsing trainers{browsingCity ? ` in ${browsingCity}` : ''} right now</span>
              </div>
            )}

            {/* Goal-based quick filters (Section 8b) */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {GOAL_FILTERS.map(gf => (
                <button
                  key={gf.label}
                  onClick={() => setGoalFilter(goalFilter === gf.label ? null : gf.label)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-medium whitespace-nowrap transition-all shrink-0',
                    goalFilter === gf.label
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-foreground hover:border-primary/50'
                  )}
                >
                  <span>{gf.emoji}</span> {gf.label}
                </button>
              ))}
            </div>

            {/* Availability quick toggles (Section 8a) */}
            <div className="flex gap-2">
              <button
                onClick={() => setAvailabilityFilter(availabilityFilter === 'today' ? 'any' : 'today')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                  availabilityFilter === 'today'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-border bg-card text-foreground hover:border-emerald-300'
                )}
              >
                <Zap className="w-3.5 h-3.5" /> Available today
              </button>
              <button
                onClick={() => setAvailabilityFilter(availabilityFilter === 'week' ? 'any' : 'week')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                  availabilityFilter === 'week'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'border-border bg-card text-foreground hover:border-blue-300'
                )}
              >
                <Clock className="w-3.5 h-3.5" /> Available this week
              </button>
            </div>

            {/* Featured Trainers (Section 4d) */}
            {!search.trim() && !goalFilter && (
              <FeaturedTrainers trainers={trainers} />
            )}

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                {searchLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
                <Input placeholder="Search by name, specialty, city, or gym..." value={searchInput} onChange={e => setSearchInput(e.target.value)} className="pl-9" />
              </div>
              <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviewed</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_low">Lowest Price</SelectItem>
                  <SelectItem value="price_high">Highest Price</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className="relative">
                <SlidersHorizontal className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-lg border border-border bg-card">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Max Rate</label>
                  <Select value={rateFilter} onValueChange={setRateFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any price</SelectItem>
                      <SelectItem value="30">Under $30</SelectItem>
                      <SelectItem value="50">Under $50</SelectItem>
                      <SelectItem value="75">Under $75</SelectItem>
                      <SelectItem value="100">Under $100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Min Rating</label>
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any rating</SelectItem>
                      <SelectItem value="4.5">4.5+ stars</SelectItem>
                      <SelectItem value="4.0">4.0+ stars</SelectItem>
                      <SelectItem value="3.5">3.5+ stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Specialty</label>
                  <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any specialty</SelectItem>
                      {allSpecialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Trainer Type</label>
                  <Select value={trainerTypeFilter} onValueChange={setTrainerTypeFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any type</SelectItem>
                      <SelectItem value="freelancer">Freelancer</SelectItem>
                      <SelectItem value="gym_affiliated">Gym-Affiliated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Gender</label>
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Available On</label>
                  <Select value={dayFilter} onValueChange={setDayFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any day</SelectItem>
                      {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">City</label>
                  <Input placeholder="Filter by city..." value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Services</label>
                  <div className="flex flex-col gap-2">
                    <button type="button" onClick={() => setHomeTrainingFilter(!homeTrainingFilter)}
                      className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                        homeTrainingFilter ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:border-primary/50")}>
                      <Home className="w-3.5 h-3.5" /> Home Training
                    </button>
                    <button type="button" onClick={() => setDietFilter(!dietFilter)}
                      className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                        dietFilter ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-border bg-card text-foreground hover:border-emerald-300")}>
                      <Apple className="w-3.5 h-3.5" /> Diet Planning
                    </button>
                  </div>
                </div>
                <div className="flex items-end">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setRateFilter('any'); setRatingFilter('any'); setSpecialtyFilter('any');
                    setCityFilter(''); setTrainerTypeFilter('any'); setGenderFilter('any'); setDayFilter('any');
                    setHomeTrainingFilter(false); setDietFilter(false); setGoalFilter(null); setAvailabilityFilter('any');
                  }}>
                    Clear filters
                  </Button>
                </div>
              </div>
            )}

            {trainersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <TrainerCardSkeleton key={i} />)}
              </div>
            ) : filteredTrainers.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                  <Dumbbell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">No trainers found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {search.trim() || activeFilterCount > 0
                    ? 'Try different search terms or adjust your filters.'
                    : 'Be the first to sign up as a trainer!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{filteredTrainers.length} trainer{filteredTrainers.length !== 1 ? 's' : ''} available</p>
                {filteredTrainers.map(t => (
                  <TrainerCard
                    key={t.id}
                    trainer={t}
                    matchScore={profile ? computeMatchScore(profile, t) : undefined}
                    isReturning={bookedTrainerIds.has(t.id)}
                    isSaved={savedIds.has(t.id)}
                    onToggleSave={() => toggleSave.mutate(t.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search training groups..." value={searchInput} onChange={e => setSearchInput(e.target.value)} className="pl-9" />
            </div>
            {recommendedGroups.length > 0 && !search.trim() && (
              <div>
                <h2 className="font-semibold text-foreground mb-3">Recommended for You</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {recommendedGroups.slice(0, 4).map(gm => (
                    <Link key={gm.group.id} to={`/groups/${gm.group.id}`}
                      className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-all">
                      <h3 className="font-medium text-foreground mb-1 truncate">{gm.group.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{gm.group.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        <span>{gm.group.group_members?.length ?? 0}/{gm.group.max_members} members</span>
                        <Badge variant="outline" className="text-xs ml-auto">{gm.group.level}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h2 className="font-semibold text-foreground mb-3 flex items-center justify-between">
                All Groups
                <Link to="/groups/create"><Button size="sm" variant="outline">Create Group</Button></Link>
              </h2>
              {groupsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="text-center py-12"><p className="text-muted-foreground">No groups found.</p></div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredGroups.map(g => (
                    <Link key={g.id} to={`/groups/${g.id}`}
                      className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-all">
                      <h3 className="font-medium text-foreground mb-1 truncate">{g.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{g.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        <span>{g.group_members?.length ?? 0}/{g.max_members} members</span>
                        <Badge variant="outline" className="text-xs ml-auto">{g.level}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
