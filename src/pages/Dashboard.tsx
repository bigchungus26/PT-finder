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
  Target
} from 'lucide-react';
import { 
  currentUser, 
  getRecommendedPeople, 
  getRecommendedGroups,
  mockSessions
} from '@/data/mockData';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const recommendedPeople = getRecommendedPeople(currentUser).slice(0, 3);
  const recommendedGroups = getRecommendedGroups(currentUser).slice(0, 3);
  const upcomingSessions = mockSessions.slice(0, 2);

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Welcome back, {currentUser.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your study groups
          </p>
        </div>

        {/* Quick actions */}
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
                "flex flex-col items-center justify-center p-4 rounded-xl transition-all card-hover",
                action.color
              )}
            >
              <action.icon className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recommended Groups */}
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
                {recommendedGroups.map(({ group, score, reasons }) => (
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
                            {group.course.code}
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
                          {group.members.slice(0, 3).map(member => (
                            <Avatar key={member.userId} className="w-6 h-6 border-2 border-card">
                              <AvatarImage src={member.user.avatar} />
                              <AvatarFallback className="text-xs">{member.user.name[0]}</AvatarFallback>
                            </Avatar>
                          ))}
                          {group.members.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs">
                              +{group.members.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Recommended People */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Study Partners for You
                </h2>
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {recommendedPeople.map(({ user, score, reasons }) => (
                  <div
                    key={user.id}
                    className="bg-card rounded-xl p-4 border border-border/50 shadow-soft card-hover"
                  >
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="w-16 h-16 mb-3">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-medium text-foreground">{user.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{user.major} • {user.year}</p>
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
                      <Button size="sm" variant="soft" className="w-full">
                        Connect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Sessions */}
            <section className="bg-card rounded-xl p-4 border border-border/50 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="font-display font-semibold text-foreground">
                  Upcoming Sessions
                </h2>
              </div>
              {upcomingSessions.length > 0 ? (
                <div className="space-y-3">
                  {upcomingSessions.map(session => (
                    <div
                      key={session.id}
                      className="p-3 rounded-lg bg-muted/50"
                    >
                      <h3 className="font-medium text-sm text-foreground mb-1">
                        {session.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {' • '}
                          {session.startTime}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming sessions</p>
              )}
              <Button variant="soft" size="sm" className="w-full mt-3">
                View Calendar
              </Button>
            </section>

            {/* Your Courses */}
            <section className="bg-card rounded-xl p-4 border border-border/50 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="font-display font-semibold text-foreground">
                  Your Courses
                </h2>
              </div>
              <div className="space-y-2">
                {currentUser.courses.map(({ course }) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="font-medium text-sm text-foreground">{course.code}</div>
                    <div className="text-xs text-muted-foreground truncate">{course.title}</div>
                  </Link>
                ))}
              </div>
              <Button variant="soft" size="sm" className="w-full mt-3" asChild>
                <Link to="/courses">View All Courses</Link>
              </Button>
            </section>

            {/* AI Study Tip */}
            <section className="bg-gradient-to-br from-primary/10 to-accent rounded-xl p-4 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="font-display font-semibold text-foreground">
                  Study Tip
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                "Try the Pomodoro technique: 25 minutes of focused study, then a 5-minute break. 
                It keeps your brain fresh!"
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
