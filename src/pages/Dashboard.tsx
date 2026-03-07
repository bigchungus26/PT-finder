import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/components/layout/AppLayout';
import {
  Plus,
  Users,
  MessageCircle,
  HelpCircle,
  Calendar,
  ArrowRight,
  Star,
  Clock,
  BookOpen,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Dumbbell,
  TrendingUp,
  CheckCircle2,
  Shield,
  Search,
  Megaphone,
  Package,
  StickyNote,
  Briefcase,
  Building2,
  MapPin,
  Copy,
} from 'lucide-react';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useMyBookings, usePendingBookingsForTutor, useUpcomingBookings, useCompletedBookingsForTutor, useUpdateBookingStatus } from '@/hooks/useBookings';
import { useTutors } from '@/hooks/useTutors';
import { useOpenRequests } from '@/hooks/useTutorRequests';
import { useMyPackages } from '@/hooks/usePackages';
import { useMyGym } from '@/hooks/useGyms';
import { cn } from '@/lib/utils';

const FITNESS_TIPS = [
  'Warm up for 5–10 minutes before every workout to prevent injury and improve performance.',
  'Progressive overload is key — gradually increase weight, reps, or intensity to keep making gains.',
  'Rest and recovery are just as important as training — aim for 7–9 hours of sleep.',
  'Stay hydrated before, during, and after your workouts for optimal performance.',
  'Vary your workouts to prevent plateaus and keep your body adapting.',
  'Focus on compound movements (squats, deadlifts, presses) for maximum efficiency.',
  'Track your workouts to monitor progress and stay motivated.',
  'Form over weight — proper technique prevents injury and builds strength effectively.',
  'Consistency beats intensity — regular moderate workouts beat sporadic intense ones.',
  'Ask your personal trainer for a plan tailored to your fitness goals.',
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useCurrentProfile();
  const { data: allBookings = [] } = useMyBookings();
  const pendingBookings = usePendingBookingsForTutor();
  const upcomingBookings = useUpcomingBookings();
  const completedBookings = useCompletedBookingsForTutor();
  const updateBookingStatus = useUpdateBookingStatus();
  const { data: topTutors = [] } = useTutors();
  const { data: openRequests = [] } = useOpenRequests();
  const { data: myPackages = [] } = useMyPackages();
  const [coursePickerOpen, setCoursePickerOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * FITNESS_TIPS.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % FITNESS_TIPS.length);
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  const firstName = profile?.name?.split(' ')[0] ?? 'there';
  const userCourses = profile?.user_courses ?? [];
  const isTutor = profile?.user_role === 'trainer';
  const isGym = profile?.user_role === 'gym';
  const { data: myGym, isLoading: gymLoading } = useMyGym(isGym ? user?.id : undefined);

  const totalEarnings = useMemo(() => {
    return completedBookings.reduce((sum, b) => {
      const tutor = b.tutor;
      return sum + (tutor?.hourly_rate ?? 0);
    }, 0);
  }, [completedBookings]);

  if (isGym) {
    return (
      <AppLayout>
        <div className="p-4 lg:p-8">
          <div className="mb-8">
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Welcome back, {firstName}!
            </h1>
            <p className="text-muted-foreground">
              Manage your gym and trainers
            </p>
          </div>

          {gymLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : myGym ? (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Gym Overview */}
                <section className="bg-card rounded-xl p-6 border border-border/50">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 overflow-hidden">
                      {myGym.logo_url ? (
                        <img src={myGym.logo_url} alt={myGym.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-7 h-7 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="font-display text-xl font-bold text-foreground mb-1">{myGym.name}</h2>
                      {myGym.city && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                          <MapPin className="w-3.5 h-3.5" />
                          {myGym.city}
                          {myGym.address && ` · ${myGym.address}`}
                        </p>
                      )}
                      {myGym.description && (
                        <p className="text-sm text-muted-foreground">{myGym.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5 pt-5 border-t border-border/50">
                    <Link to={`/gyms/${myGym.id}`}>
                      <Button size="sm" className="gap-2">
                        <Building2 className="w-4 h-4" />
                        View Gym Profile
                      </Button>
                    </Link>
                    <Link to="/settings">
                      <Button size="sm" variant="outline">Edit Settings</Button>
                    </Link>
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                {/* Invite Code */}
                <section className="bg-card rounded-xl p-5 border border-border/50">
                  <h2 className="font-display font-semibold text-foreground mb-1 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Trainer Invite Code
                  </h2>
                  <p className="text-xs text-muted-foreground mb-3">
                    Share this code with trainers so they can join your gym.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted rounded-lg px-3 py-2 text-base font-mono font-bold tracking-widest text-center text-foreground select-all">
                      {myGym.invite_code}
                    </code>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(myGym.invite_code);
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 space-y-3">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto" />
              <h3 className="font-semibold text-foreground">No gym profile found</h3>
              <p className="text-sm text-muted-foreground">
                Your gym account was set up but no gym profile was created. Please contact support.
              </p>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  if (isTutor) {
    return (
      <AppLayout>
        <div className="p-4 lg:p-8">
          <div className="mb-8">
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Welcome back, {firstName}!
            </h1>
            <p className="text-muted-foreground">
              Here's your training dashboard
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <div className="bg-card rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Pending</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{pendingBookings.length}</div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Upcoming</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{upcomingBookings.filter(b => b.tutor_id === user?.id).length}</div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Completed</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{completedBookings.length}</div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Total Earned</span>
              </div>
              <div className="text-2xl font-bold text-foreground">${totalEarnings.toFixed(0)}</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Pending Requests */}
              {pendingBookings.length > 0 && (
                <section>
                  <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    Pending Requests
                  </h2>
                  <div className="space-y-3">
                    {pendingBookings.map((booking) => (
                      <div key={booking.id} className="bg-card rounded-xl p-4 border border-amber-200 dark:border-amber-900">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-foreground">{booking.student?.name ?? 'Client'}</span>
                              {booking.course && (
                                <Badge variant="outline" className="text-xs">{booking.course.code}</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5" />
                              {booking.date} &middot; {booking.start_time} - {booking.end_time}
                            </div>
                            {booking.note && (
                              <p className="text-sm text-muted-foreground mt-1 italic">"{booking.note}"</p>
                            )}
                            {booking.student_prep && (
                              <div className="mt-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1">
                                  <StickyNote className="w-3 h-3" />
                                  Session Prep from Client
                                </div>
                                <p className="text-sm text-foreground">{booking.student_prep}</p>
                              </div>
                            )}
                            {booking.is_recurring && (
                              <Badge variant="outline" className="mt-1 text-xs">Recurring weekly</Badge>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              onClick={() => updateBookingStatus.mutate({ bookingId: booking.id, status: 'confirmed' })}
                              disabled={updateBookingStatus.isPending}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBookingStatus.mutate({ bookingId: booking.id, status: 'cancelled' })}
                              disabled={updateBookingStatus.isPending}
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Upcoming Sessions */}
              <section>
                <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Sessions
                </h2>
                {upcomingBookings.filter(b => b.status === 'confirmed' && b.tutor_id === user?.id).length > 0 ? (
                  <div className="space-y-3">
                    {upcomingBookings.filter(b => b.status === 'confirmed' && b.tutor_id === user?.id).map((booking) => (
                      <div key={booking.id} className="bg-card rounded-xl p-4 border border-border/50">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-foreground">{booking.student?.name ?? 'Client'}</span>
                              {booking.course && (
                                <Badge variant="outline" className="text-xs">{booking.course.code}</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5" />
                              {booking.date} &middot; {booking.start_time} - {booking.end_time}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateBookingStatus.mutate({ bookingId: booking.id, status: 'completed' })}
                            disabled={updateBookingStatus.isPending}
                          >
                            Mark Complete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-card rounded-xl p-8 border border-border/50 text-center">
                    <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No upcoming sessions. Share your profile to get more bookings!</p>
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <section className="bg-card rounded-xl p-4 border border-border/50">
                <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Your Profile
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rating</span>
                    <span className="font-medium flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {(profile?.rating_avg ?? 0).toFixed(1)} ({profile?.total_reviews ?? 0})
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-medium text-emerald-600">${profile?.hourly_rate ?? 0}/hr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium">
                      {profile?.verified_status ? (
                        <Badge className="gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-0 text-xs">
                          <Shield className="w-3 h-3" />Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Unverified</Badge>
                      )}
                    </span>
                  </div>
                </div>
                <Button variant="soft" size="sm" className="w-full mt-4" asChild>
                  <Link to="/settings">Edit Profile</Link>
                </Button>
              </section>

              {/* Job Board CTA */}
              <section className="bg-card rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <h2 className="font-display font-semibold text-foreground">Job Board</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {openRequests.length} open request{openRequests.length !== 1 ? 's' : ''} from clients
                </p>
                <Button variant="soft" size="sm" className="w-full gap-1.5" asChild>
                  <Link to="/requests">
                    <Megaphone className="w-3.5 h-3.5" />
                    Browse Requests
                  </Link>
                </Button>
              </section>

              {/* Package Stats */}
              {myPackages.length > 0 && (
                <section className="bg-card rounded-xl p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-5 h-5 text-primary" />
                    <h2 className="font-display font-semibold text-foreground">Your Packages</h2>
                  </div>
                  <div className="space-y-2">
                    {myPackages.filter(p => p.is_active).map(pkg => (
                      <div key={pkg.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                        <span className="font-medium text-foreground truncate">{pkg.title}</span>
                        <span className="text-muted-foreground text-xs shrink-0">{pkg.total_hours}hrs / ${pkg.price}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="soft" size="sm" className="w-full mt-3" asChild>
                    <Link to="/settings">Manage Packages</Link>
                  </Button>
                </section>
              )}

              <section className="bg-card rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h2 className="font-display font-semibold text-foreground">Your Sessions</h2>
                </div>
                <div className="space-y-2">
                  {userCourses.map((uc) => (
                    <Link key={uc.course_id} to={`/courses/${uc.course_id}`}
                      className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="font-medium text-sm text-foreground">{uc.courses?.code ?? uc.course_id}</div>
                      <div className="text-xs text-muted-foreground truncate">{uc.courses?.title ?? ''}</div>
                    </Link>
                  ))}
                </div>
                <Button variant="soft" size="sm" className="w-full mt-3" asChild>
                  <Link to="/settings">Manage Sessions</Link>
                </Button>
              </section>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ─── Client Dashboard ───
  const displayTutors = topTutors.slice(0, 3);

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Welcome back, {firstName}!
          </h1>
          <p className="text-muted-foreground">
            Find a personal trainer, manage your bookings, and crush your fitness goals
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Search, label: 'Find Trainers', color: 'bg-primary text-primary-foreground', path: '/discover' },
            { icon: Megaphone, label: 'Request Help', color: 'bg-secondary text-secondary-foreground', path: '/requests' },
            { icon: MessageCircle, label: 'Messages', color: 'bg-accent text-accent-foreground', path: '/messages' },
            { icon: HelpCircle, label: 'Post Question', color: 'bg-success text-success-foreground', path: null },
          ].map((action, index) =>
            action.path ? (
              <Link key={index} to={action.path}
                className={cn('flex flex-col items-center justify-center p-4 rounded-xl transition-all card-hover', action.color)}>
                <action.icon className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            ) : (
              <button key={index} onClick={() => setCoursePickerOpen(true)}
                className={cn('flex flex-col items-center justify-center p-4 rounded-xl transition-all card-hover', action.color)}>
                <action.icon className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            )
          )}
        </div>

        <Dialog open={coursePickerOpen} onOpenChange={setCoursePickerOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader><DialogTitle>Post a Question</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground mb-4">Select a session to post your question in:</p>
            {userCourses.length > 0 ? (
              <div className="space-y-2">
                {userCourses.map((uc) => {
                  const course = uc.courses;
                  if (!course) return null;
                  return (
                    <button key={course.id} onClick={() => { setCoursePickerOpen(false); navigate(`/courses/${course.id}`); }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground">{course.code}</div>
                        <div className="text-xs text-muted-foreground truncate">{course.title}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">You haven't added any sessions yet.</p>
                <Button variant="outline" size="sm" onClick={() => { setCoursePickerOpen(false); navigate('/courses'); }}>
                  <Plus className="w-4 h-4 mr-1" />Browse Sessions
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Top Trainers */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  Top Rated Trainers
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/discover">View all <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
              </div>
              {displayTutors.length > 0 ? (
                <div className="space-y-3">
                  {displayTutors.map((tutor) => (
                    <Link key={tutor.id} to={`/trainers/${tutor.id}`}
                      className="block bg-card rounded-xl p-4 border border-border/50 hover:border-primary/40 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                          {tutor.avatar ? (
                            <img src={tutor.avatar} alt="" className="w-12 h-12 rounded-xl object-cover" />
                          ) : (
                            tutor.name?.charAt(0)?.toUpperCase() ?? '?'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">{tutor.name}</span>
                            {tutor.verified_status && (
                              <Badge variant="outline" className="text-xs gap-1 text-blue-600 border-blue-200">
                                <Shield className="w-3 h-3" />Verified
                              </Badge>
                            )}
                          </div>
                          {tutor.bio_expert && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mb-1">{tutor.bio_expert}</p>
                          )}
                          <div className="flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-1 text-amber-600 font-medium">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              {(tutor.rating_avg ?? 0).toFixed(1)}
                            </span>
                            {tutor.hourly_rate && (
                              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                <DollarSign className="w-3.5 h-3.5" />{tutor.hourly_rate}/hr
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-xl p-8 border border-border/50 text-center">
                  <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium text-foreground mb-1">No trainers yet</h3>
                  <p className="text-sm text-muted-foreground">Check back soon or browse the discover page.</p>
                </div>
              )}
            </section>

            {/* Upcoming Bookings */}
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Your Bookings
              </h2>
              {upcomingBookings.length > 0 ? (
                <div className="space-y-3">
                  {upcomingBookings.slice(0, 4).map((booking) => (
                    <div key={booking.id} className="bg-card rounded-xl p-4 border border-border/50">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">{booking.tutor?.name ?? 'Trainer'}</span>
                            <Badge variant={booking.status === 'confirmed' ? 'default' : 'outline'} className="text-xs">
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            {booking.date} &middot; {booking.start_time} - {booking.end_time}
                          </div>
                        </div>
                        <Link to={`/trainers/${booking.tutor_id}`}>
                          <Button size="sm" variant="ghost">View Trainer</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-xl p-8 border border-border/50 text-center">
                  <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming bookings.</p>
                  <Button size="sm" className="mt-3" asChild>
                    <Link to="/discover">Find a Trainer</Link>
                  </Button>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <section className="bg-card rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="font-display font-semibold text-foreground">Your Sessions</h2>
              </div>
              <div className="space-y-2">
                {userCourses.map((uc) => (
                  <Link key={uc.course_id} to={`/courses/${uc.course_id}`}
                    className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="font-medium text-sm text-foreground">{uc.courses?.code ?? uc.course_id}</div>
                    <div className="text-xs text-muted-foreground truncate">{uc.courses?.title ?? ''}</div>
                  </Link>
                ))}
              </div>
              <Button variant="soft" size="sm" className="w-full mt-3" asChild>
                <Link to="/courses">View All Sessions</Link>
              </Button>
            </section>
          </div>
        </div>

        {/* Fitness Tips */}
        <div className="mt-6 bg-gradient-to-r from-primary/10 via-accent/30 to-primary/10 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Fitness Tip</h3>
              <p className="text-sm text-foreground">{FITNESS_TIPS[tipIndex]}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8"
                onClick={() => setTipIndex((prev) => (prev - 1 + FITNESS_TIPS.length) % FITNESS_TIPS.length)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8"
                onClick={() => setTipIndex((prev) => (prev + 1) % FITNESS_TIPS.length)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
