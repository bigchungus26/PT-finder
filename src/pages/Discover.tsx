import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Star,
  DollarSign,
  Users,
  Shield,
  Dumbbell,
  ChevronRight,
  SlidersHorizontal,
  MapPin,
  Building2,
  X,
} from 'lucide-react';
import { useTutors, type TutorWithDetails } from '@/hooks/useTutors';
import { useGroups } from '@/hooks/useGroups';
import { useRecommendedGroups } from '@/hooks/useMatching';
import { useGyms } from '@/hooks/useGyms';
import type { GymRow } from '@/types/database';
import { cn } from '@/lib/utils';

const TRAINING_TYPES = [
  'Bodybuilding', 'Powerlifting', 'Strength Training', 'HIIT',
  'CrossFit', 'Athleticism & Sports Performance', 'Cardio Endurance',
  'Yoga', 'Pilates', 'Functional Training', 'Injury Rehab', 'Weight Loss',
];

function TutorCard({ tutor }: { tutor: TutorWithDetails }) {
  return (
    <Link
      to={`/trainers/${tutor.id}`}
      className="group block rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xl font-bold text-primary shrink-0">
          {tutor.avatar ? (
            <img src={tutor.avatar} alt="" className="w-14 h-14 rounded-xl object-cover" />
          ) : (
            tutor.name?.charAt(0)?.toUpperCase() ?? '?'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-foreground truncate">{tutor.name}</h3>
            {tutor.verified_status && (
              <Badge variant="outline" className="text-xs gap-1 text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                <Shield className="w-3 h-3" />
                Verified
              </Badge>
            )}
            {tutor.service_type === 'diet_and_training' && (
              <Badge variant="secondary" className="text-xs">Diet + Training</Badge>
            )}
          </div>
          {tutor.bio_expert && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{tutor.bio_expert}</p>
          )}
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <Star className="w-3.5 h-3.5 fill-current" />
              {(tutor.rating_avg ?? 0).toFixed(1)}
              <span className="text-muted-foreground font-normal">({tutor.total_reviews})</span>
            </span>
            {tutor.hourly_rate && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <DollarSign className="w-3.5 h-3.5" />
                {tutor.hourly_rate}/hr
              </span>
            )}
            {(tutor.city || tutor.area) && (
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <MapPin className="w-3 h-3" />
                {tutor.city || tutor.area}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0 mt-1 transition-colors" />
      </div>
      {tutor.specialty && tutor.specialty.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
          {tutor.specialty.slice(0, 4).map((s) => (
            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
          ))}
          {tutor.specialty.length > 4 && (
            <Badge variant="secondary" className="text-xs">+{tutor.specialty.length - 4} more</Badge>
          )}
        </div>
      )}
    </Link>
  );
}

function GymCard({ gym }: { gym: GymRow & { trainer_count?: number } }) {
  return (
    <Link
      to={`/gyms/${gym.id}`}
      className="group block rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 overflow-hidden">
          {gym.logo_url ? (
            <img src={gym.logo_url} alt={gym.name} className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-6 h-6 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate mb-0.5">{gym.name}</h3>
          {gym.city && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3" />
              {gym.city}
            </p>
          )}
          {gym.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">{gym.description}</p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
      </div>
    </Link>
  );
}

const Discover = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'trainers';

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Trainer filters
  const [cityFilter, setCityFilter] = useState('any');
  const [genderFilter, setGenderFilter] = useState('any');
  const [serviceFilter, setServiceFilter] = useState('any');
  const [rateFilter, setRateFilter] = useState('any');
  const [ratingFilter, setRatingFilter] = useState('any');
  const [trainingTypeFilter, setTrainingTypeFilter] = useState('any');
  const [gymTypeFilter, setGymTypeFilter] = useState('any'); // 'any' | 'gym' | 'freelancer'

  const { data: tutors = [], isLoading: tutorsLoading } = useTutors();
  const { data: allGroups = [], isLoading: groupsLoading } = useGroups();
  const { data: allGyms = [], isLoading: gymsLoading } = useGyms();
  const recommendedGroups = useRecommendedGroups();

  // Collect unique cities from trainer profiles
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    tutors.forEach(t => { if (t.city) cities.add(t.city); else if (t.area) cities.add(t.area); });
    return Array.from(cities).sort();
  }, [tutors]);

  const activeFilterCount = [
    cityFilter !== 'any', genderFilter !== 'any', serviceFilter !== 'any',
    rateFilter !== 'any', ratingFilter !== 'any', trainingTypeFilter !== 'any',
    gymTypeFilter !== 'any',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setCityFilter('any'); setGenderFilter('any'); setServiceFilter('any');
    setRateFilter('any'); setRatingFilter('any'); setTrainingTypeFilter('any');
    setGymTypeFilter('any');
  };

  const filteredTutors = useMemo(() => {
    let list = tutors;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.bio_expert?.toLowerCase().includes(q) ||
          (t.specialty ?? []).some((s) => s.toLowerCase().includes(q)) ||
          t.city?.toLowerCase().includes(q) ||
          t.area?.toLowerCase().includes(q)
      );
    }

    if (cityFilter !== 'any') {
      const c = cityFilter.toLowerCase();
      list = list.filter(t => t.city?.toLowerCase() === c || t.area?.toLowerCase() === c);
    }

    if (genderFilter !== 'any') {
      list = list.filter(t => t.gender === genderFilter);
    }

    if (serviceFilter !== 'any') {
      list = list.filter(t => t.service_type === serviceFilter);
    }

    if (rateFilter !== 'any') {
      const max = parseInt(rateFilter);
      list = list.filter(t => (t.hourly_rate ?? 0) <= max);
    }

    if (ratingFilter !== 'any') {
      const min = parseFloat(ratingFilter);
      list = list.filter(t => (t.rating_avg ?? 0) >= min);
    }

    if (trainingTypeFilter !== 'any') {
      const tt = trainingTypeFilter.toLowerCase();
      list = list.filter(t => (t.specialty ?? []).some(s => s.toLowerCase().includes(tt)));
    }

    if (gymTypeFilter === 'freelancer') {
      list = list.filter(t => !t.gym_id);
    } else if (gymTypeFilter === 'gym') {
      list = list.filter(t => !!t.gym_id);
    }

    return list;
  }, [tutors, search, cityFilter, genderFilter, serviceFilter, rateFilter, ratingFilter, trainingTypeFilter, gymTypeFilter]);

  const filteredGyms = useMemo(() => {
    if (!search.trim()) return allGyms;
    const q = search.toLowerCase();
    return allGyms.filter(g => g.name?.toLowerCase().includes(q) || g.city?.toLowerCase().includes(q));
  }, [allGyms, search]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return allGroups;
    const q = search.toLowerCase();
    return allGroups.filter(g => g.name?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q));
  }, [allGroups, search]);

  const handleTab = (value: string) => {
    setSearch('');
    setSearchParams({ tab: value });
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-1">
            Discover
          </h1>
          <p className="text-muted-foreground">
            Find the perfect trainer, browse gyms, or join a community
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="trainers" className="gap-2">
              <Dumbbell className="w-4 h-4" />
              Trainers
            </TabsTrigger>
            <TabsTrigger value="gyms" className="gap-2">
              <Building2 className="w-4 h-4" />
              Gyms
            </TabsTrigger>
            <TabsTrigger value="community" className="gap-2">
              <Users className="w-4 h-4" />
              Community
            </TabsTrigger>
          </TabsList>

          {/* ── Trainers tab ── */}
          <TabsContent value="trainers" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, specialty, city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="relative shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>

            {showFilters && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-foreground">Filters</span>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="text-xs text-primary flex items-center gap-1 hover:underline">
                      <X className="w-3 h-3" /> Clear all
                    </button>
                  )}
                </div>

                {/* Row 1: Location, Type, Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> City
                    </label>
                    <Select value={cityFilter} onValueChange={setCityFilter}>
                      <SelectTrigger><SelectValue placeholder="Any city" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any city</SelectItem>
                        {availableCities.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> Trainer Type
                    </label>
                    <Select value={gymTypeFilter} onValueChange={setGymTypeFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">All trainers</SelectItem>
                        <SelectItem value="gym">Gym-based</SelectItem>
                        <SelectItem value="freelancer">Freelancers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Gender</label>
                    <Select value={genderFilter} onValueChange={setGenderFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any gender</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Service, Rate, Rating */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Service Type</label>
                    <Select value={serviceFilter} onValueChange={setServiceFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Training or Diet+Training</SelectItem>
                        <SelectItem value="training_only">Training Only</SelectItem>
                        <SelectItem value="diet_and_training">Diet + Training</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Max Rate</label>
                    <Select value={rateFilter} onValueChange={setRateFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any price</SelectItem>
                        <SelectItem value="30">Under $30/hr</SelectItem>
                        <SelectItem value="50">Under $50/hr</SelectItem>
                        <SelectItem value="75">Under $75/hr</SelectItem>
                        <SelectItem value="100">Under $100/hr</SelectItem>
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
                </div>

                {/* Training type chips */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Training Specialty</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setTrainingTypeFilter('any')}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                        trainingTypeFilter === 'any'
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      All
                    </button>
                    {TRAINING_TYPES.map(t => (
                      <button
                        key={t}
                        onClick={() => setTrainingTypeFilter(trainingTypeFilter === t ? 'any' : t)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                          trainingTypeFilter === t
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tutorsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredTutors.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                  <Dumbbell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">No trainers found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {search.trim() || activeFilterCount > 0
                    ? 'Try different search terms or adjust your filters.'
                    : 'Be the first to sign up as a trainer and start helping clients!'}
                </p>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-sm text-primary hover:underline">Clear filters</button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {filteredTutors.length} trainer{filteredTutors.length !== 1 ? 's' : ''} found
                </p>
                {filteredTutors.map((tutor) => (
                  <TutorCard key={tutor.id} tutor={tutor} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Gyms tab ── */}
          <TabsContent value="gyms" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search gyms by name or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {gymsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredGyms.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">No gyms found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {search.trim() ? 'Try a different search term.' : 'No gyms have joined PT Finder yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {filteredGyms.length} gym{filteredGyms.length !== 1 ? 's' : ''} on PT Finder
                </p>
                {filteredGyms.map((gym) => (
                  <GymCard key={gym.id} gym={gym} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Community tab ── */}
          <TabsContent value="community" className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search training groups..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {recommendedGroups.length > 0 && !search.trim() && (
              <div>
                <h2 className="font-semibold text-foreground mb-3">Recommended for You</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {recommendedGroups.slice(0, 4).map((gm) => (
                    <Link
                      key={gm.group.id}
                      to={`/groups/${gm.group.id}`}
                      className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-all"
                    >
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
                <Link to="/groups/create">
                  <Button size="sm" variant="outline">Create Group</Button>
                </Link>
              </h2>
              {groupsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No groups found.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredGroups.map((group) => (
                    <Link
                      key={group.id}
                      to={`/groups/${group.id}`}
                      className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-all"
                    >
                      <h3 className="font-medium text-foreground mb-1 truncate">{group.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{group.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        <span>{group.group_members?.length ?? 0}/{group.max_members} members</span>
                        <Badge variant="outline" className="text-xs ml-auto">{group.level}</Badge>
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
};

export default Discover;
