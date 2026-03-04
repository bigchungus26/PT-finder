import { useState, useMemo } from 'react';
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
  ChevronRight, SlidersHorizontal, MapPin, Briefcase, Building, Award,
} from 'lucide-react';
import { useTutors, type TrainerWithDetails } from '@/hooks/useTutors';
import { useGroups } from '@/hooks/useGroups';
import { useRecommendedGroups } from '@/hooks/useMatching';
import { cn } from '@/lib/utils';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function TrainerCard({ trainer }: { trainer: TrainerWithDetails }) {
  const slotCount = trainer.availability?.length ?? 0;

  return (
    <Link
      to={`/trainers/${trainer.id}`}
      className="group block rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xl font-bold text-primary shrink-0 overflow-hidden">
          {trainer.profile_photo_url ? (
            <img src={trainer.profile_photo_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
          ) : trainer.avatar ? (
            <img src={trainer.avatar} alt="" className="w-14 h-14 rounded-xl object-cover" />
          ) : (
            trainer.name?.charAt(0)?.toUpperCase() ?? '?'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{trainer.name}</h3>
            {trainer.verified_status && (
              <Badge variant="outline" className="text-xs gap-1 text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                <Shield className="w-3 h-3" /> Verified
              </Badge>
            )}
            {trainer.trainer_type === 'freelancer' && (
              <Badge variant="outline" className="text-xs gap-1 text-purple-600 border-purple-200 bg-purple-50">
                <Briefcase className="w-3 h-3" />
              </Badge>
            )}
            {trainer.trainer_type === 'gym_affiliated' && (
              <Badge variant="outline" className="text-xs gap-1 text-emerald-600 border-emerald-200 bg-emerald-50">
                <Building className="w-3 h-3" />
              </Badge>
            )}
          </div>
          {trainer.bio_expert && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{trainer.bio_expert}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <Star className="w-3.5 h-3.5 fill-current" />
              {(trainer.rating_avg ?? 0).toFixed(1)}
              <span className="text-muted-foreground font-normal">({trainer.total_reviews})</span>
            </span>
            {trainer.hourly_rate != null && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <DollarSign className="w-3.5 h-3.5" />{trainer.hourly_rate}/session
              </span>
            )}
            {trainer.city && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />{trainer.city}
              </span>
            )}
            {slotCount > 0 && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />{slotCount} slots
              </span>
            )}
            {(trainer.years_experience ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Award className="w-3.5 h-3.5" />{trainer.years_experience}yr exp
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0 mt-1 transition-colors" />
      </div>
      {(trainer.specialty ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
          {(trainer.specialty ?? []).slice(0, 4).map((s: string) => (
            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
          ))}
          {(trainer.specialty ?? []).length > 4 && (
            <Badge variant="secondary" className="text-xs">+{(trainer.specialty ?? []).length - 4}</Badge>
          )}
        </div>
      )}
    </Link>
  );
}

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'trainers';

  const [search, setSearch] = useState('');
  const [rateFilter, setRateFilter] = useState('any');
  const [ratingFilter, setRatingFilter] = useState('any');
  const [specialtyFilter, setSpecialtyFilter] = useState('any');
  const [cityFilter, setCityFilter] = useState('');
  const [trainerTypeFilter, setTrainerTypeFilter] = useState('any');
  const [genderFilter, setGenderFilter] = useState('any');
  const [dayFilter, setDayFilter] = useState('any');
  const [showFilters, setShowFilters] = useState(false);

  const { data: trainers = [], isLoading: trainersLoading } = useTutors();
  const { data: allGroups = [], isLoading: groupsLoading } = useGroups();
  const recommendedGroups = useRecommendedGroups();

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

    return list;
  }, [trainers, search, rateFilter, ratingFilter, specialtyFilter, cityFilter, trainerTypeFilter, genderFilter, dayFilter]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return allGroups;
    const q = search.toLowerCase();
    return allGroups.filter(g => g.name?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q));
  }, [allGroups, search]);

  const activeFilterCount = [
    rateFilter !== 'any', ratingFilter !== 'any', specialtyFilter !== 'any',
    cityFilter.trim() !== '', trainerTypeFilter !== 'any', genderFilter !== 'any', dayFilter !== 'any',
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
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by name, specialty, city, or gym..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
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
                <div className="flex items-end">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setRateFilter('any'); setRatingFilter('any'); setSpecialtyFilter('any');
                    setCityFilter(''); setTrainerTypeFilter('any'); setGenderFilter('any'); setDayFilter('any');
                  }}>
                    Clear filters
                  </Button>
                </div>
              </div>
            )}

            {trainersLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
                {filteredTrainers.map(t => <TrainerCard key={t.id} trainer={t} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search training groups..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
