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
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  Shield,
  Search,
} from 'lucide-react';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useMyBookings, usePendingBookingsForTutor, useUpcomingBookings, useCompletedBookingsForTutor, useUpdateBookingStatus } from '@/hooks/useBookings';
import { useTutors } from '@/hooks/useTutors';
import { cn } from '@/lib/utils';

const STUDY_TIPS = [
  'Break study sessions into 25-minute focused blocks with 5-minute breaks (Pomodoro Technique).',
  'Teaching a concept to someone else is one of the best ways to solidify your understanding.',
  'Review your notes within 24 hours of a lecture to boost retention by up to 60%.',
  'Study in different locations — changing environments improves recall.',
  'Use active recall: close your notes and try to write down everything you remember.',
  'Create a study schedule at the start of each week and stick to it.',
  'Sleep is essential for memory consolidation — avoid all-nighters before exams.',
  'Explain difficult concepts in your own words to check your understanding.',
  'Start assignments early so you have time to ask questions when you get stuck.',
  'Ask your tutor for a study plan tailored to your goals.',
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
  const [coursePickerOpen, setCoursePickerOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * STUDY_TIPS.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % STUDY_TIPS.length);
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  const firstName = profile?.name?.split(' ')[0] ?? 'there';
  const userCourses = profile?.user_courses ?? [];
  const isTutor = profile?.user_role === 'tutor';

  const totalEarnings = useMemo(() => {
    return completedBookings.reduce((sum, b) => {
      const tutor = b.tutor;
      return sum + (tutor?.hourly_rate ?? 0);
    }, 0);
  }, [completedBookings]);

  if (isTutor) {
    return (
      <AppLayout>
        <div className="p-4 lg:p-8">
          <div className="mb-8">
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Welcome back, {firstName}!
            </h1>
            <p className="text-muted-foreground">
              Here's your tutoring dashboard
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
                              <span className="font-medium text-foreground">{booking.student?.name ?? 'Student'}</span>
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

              {/* Upcoming Lessons */}
              <section>
                <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Lessons
                </h2>
                {upcomingBookings.filter(b => b.status === 'confirmed' && b.tutor_id === user?.id).length > 0 ? (
                  <div className="space-y-3">
                    {upcomingBookings.filter(b => b.status === 'confirmed' && b.tutor_id === user?.id).map((booking) => (
                      <div key={booking.id} className="bg-card rounded-xl p-4 border border-border/50">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-foreground">{booking.student?.name ?? 'Student'}</span>
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
                    <p className="text-sm text-muted-foreground">No upcoming lessons. Share your profile to get more bookings!</p>
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

              <section className="bg-card rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h2 className="font-display font-semibold text-foreground">Your Courses</h2>
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
                  <Link to="/settings">Manage Courses</Link>
                </Button>
              </section>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ─── Student Dashboard ───
  const displayTutors = topTutors.slice(0, 3);

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Welcome back, {firstName}!
          </h1>
          <p className="text-muted-foreground">
            Find a tutor, manage your bookings, and ace your courses
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Search, label: 'Find Tutors', color: 'bg-primary text-primary-foreground', path: '/discover' },
            { icon: Users, label: 'Community', color: 'bg-secondary text-secondary-foreground', path: '/discover?tab=community' },
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
            <p className="text-sm text-muted-foreground mb-4">Select a course to post your question in:</p>
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
                <p className="text-sm text-muted-foreground mb-3">You haven't added any courses yet.</p>
                <Button variant="outline" size="sm" onClick={() => { setCoursePickerOpen(false); navigate('/courses'); }}>
                  <Plus className="w-4 h-4 mr-1" />Browse Courses
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Top Tutors */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Top Rated Tutors
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/discover">View all <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
              </div>
              {displayTutors.length > 0 ? (
                <div className="space-y-3">
                  {displayTutors.map((tutor) => (
                    <Link key={tutor.id} to={`/tutors/${tutor.id}`}
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
                  <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium text-foreground mb-1">No tutors yet</h3>
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
                            <span className="font-medium text-foreground">{booking.tutor?.name ?? 'Tutor'}</span>
                            <Badge variant={booking.status === 'confirmed' ? 'default' : 'outline'} className="text-xs">
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            {booking.date} &middot; {booking.start_time} - {booking.end_time}
                          </div>
                        </div>
                        <Link to={`/tutors/${booking.tutor_id}`}>
                          <Button size="sm" variant="ghost">View Tutor</Button>
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
                    <Link to="/discover">Find a Tutor</Link>
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
                <h2 className="font-display font-semibold text-foreground">Your Courses</h2>
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
                <Link to="/courses">View All Courses</Link>
              </Button>
            </section>
          </div>
        </div>

        {/* Study Tips */}
        <div className="mt-6 bg-gradient-to-r from-primary/10 via-accent/30 to-primary/10 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Study Tip</h3>
              <p className="text-sm text-foreground">{STUDY_TIPS[tipIndex]}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8"
                onClick={() => setTipIndex((prev) => (prev - 1 + STUDY_TIPS.length) % STUDY_TIPS.length)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8"
                onClick={() => setTipIndex((prev) => (prev + 1) % STUDY_TIPS.length)}>
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
