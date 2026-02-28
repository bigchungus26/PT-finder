import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/components/layout/AppLayout';
import {
  Plus,
  Users,
  MessageCircle,
  Sparkles,
  Calendar,
  ArrowRight,
  Star,
  Clock,
  BookOpen,
} from 'lucide-react';
import { useRecommendedPeople, useRecommendedGroups } from '@/hooks/useMatching';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useGroups } from '@/hooks/useGroups';
import { useUpcomingSessions } from '@/hooks/useSessions';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile } = useCurrentProfile();
  const { data: recommendedPeople = [] } = useRecommendedPeople();
  const { data: recommendedGroups = [] } = useRecommendedGroups();
  const { data: allGroups = [] } = useGroups();

  const myGroupIds = useMemo(
    () =>
      user
        ? allGroups
            .filter((g) => g.group_members.some((m) => m.user_id === user.id))
            .map((g) => g.id)
        : [],
    [user, allGroups]
  );
  const { data: upcomingSessions = [] } = useUpcomingSessions(myGroupIds);

  const firstName = profile?.name?.split(' ')[0] ?? 'there';
  const displayPeople = recommendedPeople.slice(0, 3);
  const displayGroups = recommendedGroups.slice(0, 3);
  const displaySessions = upcomingSessions.slice(0, 2);

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your study groups
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Plus, label: 'Create Group', color: 'bg-primary text-primary-foreground', path: '/groups/create' },
            { icon: Users, label: 'Join Group', color: 'bg-secondary text-secondary-foreground', path: '/groups' },
            { icon: Sparkles, label: 'Ask AI', color: 'bg-accent text-accent-foreground', path: '/ai' },
            { icon: MessageCircle, label: 'Post Question', color: 'bg-success text-success-foreground', path: '/courses' },
          ].map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className={cn(
                'flex flex-col items-center justify-center p-4 rounded-xl transition-all card-hover',
                action.color
              )}
            >
              <action.icon className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Recommended Groups
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/groups">
                    View all <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
              <div className="space-y-3">
                {displayGroups.map(({ group, score, reasons }) => (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    className="block bg-card rounded-xl p-4 border border-border/50 shadow-soft card-hover"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground truncate">{group.name}</h3>
                          <Badge variant="outline" className="shrink-0">
                            {group.courses?.code ?? group.course_id}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {group.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {reasons.slice(0, 2).map((reason, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {reason.description}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 text-warning" />
                          <span className="font-medium">{score}%</span>
                        </div>
                        <div className="flex -space-x-2">
                          {(group.group_members ?? []).slice(0, 3).map((member) => (
                            <Avatar key={member.user_id} className="w-6 h-6 border-2 border-card">
                              <AvatarImage src={member.profiles?.avatar ?? undefined} />
                              <AvatarFallback className="text-xs">
                                {(member.profiles?.name ?? '?')[0]}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {(group.group_members?.length ?? 0) > 3 && (
                            <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs">
                              +{(group.group_members?.length ?? 0) - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Study Partners for You
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/groups">View all <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {displayPeople.map(({ user: matchUser, score, reasons }) => (
                  <div
                    key={matchUser.id}
                    className="bg-card rounded-xl p-4 border border-border/50 shadow-soft card-hover"
                  >
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="w-16 h-16 mb-3">
                        <AvatarImage src={matchUser.avatar ?? undefined} />
                        <AvatarFallback>{(matchUser.name ?? '?')[0]}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-medium text-foreground">{matchUser.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {matchUser.major ?? ''} • {matchUser.year ?? ''}
                      </p>
                      <div className="flex items-center gap-1 text-sm mb-3">
                        <Star className="w-4 h-4 text-warning" />
                        <span className="font-medium">{score}% match</span>
                      </div>
                      <div className="flex flex-wrap justify-center gap-1 mb-3">
                        {reasons.slice(0, 2).map((reason, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {reason.description.split(':')[0]}
                          </Badge>
                        ))}
                      </div>
                      <Button size="sm" variant="soft" className="w-full" asChild>
                        <Link to="/groups">Connect</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-card rounded-xl p-4 border border-border/50 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="font-display font-semibold text-foreground">
                  Upcoming Sessions
                </h2>
              </div>
              {displaySessions.length > 0 ? (
                <div className="space-y-3">
                  {displaySessions.map((session) => (
                    <div key={session.id} className="p-3 rounded-lg bg-muted/50">
                      <h3 className="font-medium text-sm text-foreground mb-1">
                        {session.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {new Date(session.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                          {' • '}
                          {session.start_time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming sessions</p>
              )}
              <Button variant="soft" size="sm" className="w-full mt-3" asChild>
                <Link to="/groups">View Groups</Link>
              </Button>
            </section>

            <section className="bg-card rounded-xl p-4 border border-border/50 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="font-display font-semibold text-foreground">
                  Your Courses
                </h2>
              </div>
              <div className="space-y-2">
                {(profile?.user_courses ?? []).map((uc) => (
                  <Link
                    key={uc.course_id}
                    to={`/courses/${uc.course_id}`}
                    className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="font-medium text-sm text-foreground">
                      {uc.courses?.code ?? uc.course_id}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {uc.courses?.title ?? ''}
                    </div>
                  </Link>
                ))}
              </div>
              <Button variant="soft" size="sm" className="w-full mt-3" asChild>
                <Link to="/courses">View All Courses</Link>
              </Button>
            </section>

            <section className="bg-gradient-to-br from-primary/10 to-accent rounded-xl p-4 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="font-display font-semibold text-foreground">Study Tip</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Try the Pomodoro technique: 25 minutes of focused study, then a 5-minute break.
                It keeps your brain fresh!
              </p>
              <Button variant="soft" size="sm" className="w-full" asChild>
                <Link to="/ai">
                  Get Study Plan
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
