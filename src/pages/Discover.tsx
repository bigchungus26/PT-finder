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
  BookOpen,
  Users,
  Shield,
  Clock,
  Dumbbell,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { useTutors, type TutorWithDetails } from '@/hooks/useTutors';
import { useCourses } from '@/hooks/useCourses';
import { useGroups } from '@/hooks/useGroups';
import { useRecommendedGroups } from '@/hooks/useMatching';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

function TutorCard({ tutor }: { tutor: TutorWithDetails }) {
  const courses = (tutor.user_courses ?? []).map((uc) => uc.courses).filter(Boolean);

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
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{tutor.name}</h3>
            {tutor.verified_status && (
              <Badge variant="outline" className="text-xs gap-1 text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                <Shield className="w-3 h-3" />
                Verified
              </Badge>
            )}
          </div>
          {tutor.bio_expert && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{tutor.bio_expert}</p>
          )}
          <div className="flex items-center gap-3 text-sm">
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
                        <span className="text-muted-foreground">{tutor.school || 'Gym'}</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0 mt-1 transition-colors" />
      </div>
      {(tutor.subjects?.length > 0 || courses.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
          {(tutor.subjects ?? []).slice(0, 4).map((s) => (
            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
          ))}
          {courses.slice(0, 3).map((c) => (
            <Badge key={c!.id} variant="outline" className="text-xs">{c!.code}</Badge>
          ))}
        </div>
      )}
    </Link>
  );
}

const Discover = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'tutors';

  const [search, setSearch] = useState('');
  const [rateFilter, setRateFilter] = useState<string>('any');
  const [ratingFilter, setRatingFilter] = useState<string>('any');
  const [courseFilter, setCourseFilter] = useState<string>('any');
  const [showFilters, setShowFilters] = useState(false);

  const { data: allCourses = [] } = useCourses();
  const { data: tutors = [], isLoading: tutorsLoading } = useTutors();
  const { data: allGroups = [], isLoading: groupsLoading } = useGroups();
  const recommendedGroups = useRecommendedGroups();

  const filteredTutors = useMemo(() => {
    let list = tutors;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.bio_expert?.toLowerCase().includes(q) ||
          (t.subjects ?? []).some((s) => s.toLowerCase().includes(q)) ||
          (t.user_courses ?? []).some((uc) => uc.courses?.code?.toLowerCase().includes(q))
      );
    }

    if (rateFilter !== 'any') {
      const max = parseInt(rateFilter);
      list = list.filter((t) => (t.hourly_rate ?? 0) <= max);
    }

    if (ratingFilter !== 'any') {
      const min = parseFloat(ratingFilter);
      list = list.filter((t) => (t.rating_avg ?? 0) >= min);
    }

    if (courseFilter !== 'any') {
      list = list.filter((t) =>
        (t.user_courses ?? []).some((uc) => uc.course_id === courseFilter)
      );
    }

    return list;
  }, [tutors, search, rateFilter, ratingFilter, courseFilter]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return allGroups;
    const q = search.toLowerCase();
    return allGroups.filter(
      (g) =>
        g.name?.toLowerCase().includes(q) ||
        g.description?.toLowerCase().includes(q)
    );
  }, [allGroups, search]);

  const handleTab = (value: string) => {
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
            Find the perfect trainer or join a training community
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="tutors" className="gap-2">
              <Dumbbell className="w-4 h-4" />
              Find a Trainer
            </TabsTrigger>
            <TabsTrigger value="community" className="gap-2">
              <Users className="w-4 h-4" />
              Community
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tutors" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search trainers by name or specialty..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-lg border border-border bg-card">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Max Rate</label>
                  <Select value={rateFilter} onValueChange={setRateFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any price</SelectItem>
                      <SelectItem value="20">Under $20/hr</SelectItem>
                      <SelectItem value="35">Under $35/hr</SelectItem>
                      <SelectItem value="50">Under $50/hr</SelectItem>
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
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Specialty</label>
                  <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any specialty</SelectItem>
                      {allCourses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.code} - {c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  {search.trim()
                    ? 'Try different search terms or adjust your filters.'
                    : 'Be the first to sign up as a trainer and start helping clients!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{filteredTutors.length} trainer{filteredTutors.length !== 1 ? 's' : ''} available</p>
                {filteredTutors.map((tutor) => (
                  <TutorCard key={tutor.id} tutor={tutor} />
                ))}
              </div>
            )}
          </TabsContent>

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
