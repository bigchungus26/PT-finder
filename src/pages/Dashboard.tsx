import { useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/components/layout/AppLayout';
import {
  Users,
  MessageCircle,
  Calendar,
  ArrowRight,
  Star,
  Clock,
  DollarSign,
  Dumbbell,
  TrendingUp,
  CheckCircle2,
  Shield,
  Search,
  Bell,
  ChevronRight,
  Flame,
  MapPin,
  Building2,
  Copy,
} from 'lucide-react';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useMyBookings, usePendingBookingsForTutor, useUpcomingBookings, useCompletedBookingsForTutor, useUpdateBookingStatus } from '@/hooks/useBookings';
import { useTutors } from '@/hooks/useTutors';
import { useMyGym } from '@/hooks/useGyms';
import { useUpdateLastActive, computeMatchScore } from '@/hooks/useRetention';
import { useToggleAcceptingBookings, useSavedTrainers, useAnnouncements, usePlatformChallenge, useChallengeProgress } from '@/hooks/useFeaturesV2';
import { useAnimatedCounter, useScrollEntrance } from '@/hooks/useScrollAnimations';
import { cn } from '@/lib/utils';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'Good morning';
  if (h >= 12 && h < 18) return 'Good afternoon';
  if (h >= 18 && h < 22) return 'Good evening';
  return 'Good night';
}

function getContextMessage(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'Ready to train today?';
  if (h >= 12 && h < 18) return 'Keep the momentum going.';
  if (h >= 18 && h < 22) return 'Evening session time.';
  return "Plan tomorrow's session.";
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  const counterRef = useAnimatedCounter(value);
  return (
    <div
      className="shrink-0"
      style={{
        width: 120,
        background: '#141414',
        border: '1px solid #1E1E1E',
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Icon style={{ width: 16, height: 16, color: '#16A34A' }} />
        <span style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
          {label}
        </span>
      </div>
      <span
        ref={counterRef}
        style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 28, color: '#F5F0E8' }}
      >
        0
      </span>
    </div>
  );
}

function EarningsRing({ current, goal }: { current: number; goal: number }) {
  const progress = goal > 0 ? Math.min(current / goal, 1) : 0;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="54" fill="none" stroke="#1E1E1E" strokeWidth="8" />
        <circle
          cx="70" cy="70" r="54" fill="none"
          stroke="#16A34A" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{
            transition: 'stroke-dashoffset 1200ms ease-out',
          }}
        />
        <text x="70" y="65" textAnchor="middle" fill="#F5F0E8" fontFamily="'Syne', sans-serif" fontWeight="800" fontSize="22">
          ${current}
        </text>
        <text x="70" y="85" textAnchor="middle" fill="#555" fontSize="11">
          of ${goal} goal
        </text>
      </svg>
    </div>
  );
}

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
  const updateLastActive = useUpdateLastActive();
  const toggleAccepting = useToggleAcceptingBookings();
  const { data: savedTrainers = [] } = useSavedTrainers();
  const { data: announcements = [] } = useAnnouncements();
  const { data: platformChallenge } = usePlatformChallenge();
  const { data: challengeProgress } = useChallengeProgress(platformChallenge?.id);
  const scrollRef = useScrollEntrance();

  const firstName = profile?.name?.split(' ')[0] ?? 'there';
  const isTutor = profile?.user_role === 'trainer';
  const isGym = profile?.user_role === 'gym';
  const { data: myGym, isLoading: gymLoading } = useMyGym(isGym ? user?.id : undefined);

  useEffect(() => {
    updateLastActive.mutate();
  }, []);

  const totalEarnings = useMemo(() => {
    return completedBookings.reduce((sum, b) => sum + (b.tutor?.hourly_rate ?? 0), 0);
  }, [completedBookings]);

  const clientCompletedCount = useMemo(() =>
    allBookings.filter(b => b.student_id === user?.id && b.status === 'completed').length,
    [allBookings, user?.id]
  );

  const bestMatches = useMemo(() => {
    if (!profile || isTutor) return [];
    return topTutors
      .map(t => ({ trainer: t, score: computeMatchScore(profile, t) }))
      .filter(m => m.score > 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [topTutors, profile, isTutor]);

  const nextSession = useMemo(() => {
    const confirmed = upcomingBookings.filter(b => b.status === 'confirmed');
    return confirmed[0] ?? null;
  }, [upcomingBookings]);

  const todaySessions = useMemo(() => {
    if (!isTutor) return [];
    const today = new Date().toISOString().split('T')[0];
    return allBookings
      .filter(b => b.tutor_id === user?.id && b.date === today && b.status === 'confirmed')
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [allBookings, user?.id, isTutor]);

  const currentStreak = profile?.current_streak ?? 0;

  // ─── GYM DASHBOARD ───
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

  // ─── TRAINER DASHBOARD ───
  if (isTutor) {
    return (
      <AppLayout>
        <div ref={scrollRef} className="scroll-container" style={{ minHeight: '100%' }}>
          {/* Header */}
          <div
            style={{
              padding: '20px 16px 24px',
              background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(22,163,74,0.12) 0%, transparent 70%), #000`,
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <div>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, color: '#F5F0E8' }}>
                  Hey, {firstName}
                </h1>
                <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <Link to="/settings" className="touch-target">
                <div
                  className="overflow-hidden"
                  style={{ width: 36, height: 36, borderRadius: '50%', background: '#141414', border: '1px solid #1E1E1E' }}
                >
                  {profile?.profile_photo_url ? (
                    <img src={profile.profile_photo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: '#555', fontSize: 14, fontWeight: 600 }}>
                      {firstName[0]}
                    </div>
                  )}
                </div>
              </Link>
            </div>

            {/* Accepting toggle */}
            <div
              className="flex items-center justify-between mt-4"
              style={{ padding: '12px 14px', borderRadius: 12, background: '#0D0D0D', border: '1px solid #1E1E1E' }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#F5F0E8' }}>Accepting Bookings</p>
                <p style={{ fontSize: 11, color: '#555' }}>
                  {profile?.accepting_bookings !== false ? 'Visible to clients' : 'Hidden from clients'}
                </p>
              </div>
              <button
                onClick={() => toggleAccepting.mutate(!(profile?.accepting_bookings !== false))}
                className="relative"
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: profile?.accepting_bookings !== false ? '#16A34A' : '#1E1E1E',
                  transition: 'background 200ms ease',
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: 2,
                  left: profile?.accepting_bookings !== false ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 200ms ease',
                }} />
              </button>
            </div>
          </div>

          {/* Today's sessions strip */}
          <div className="px-4 mt-4">
            <h2 style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 10 }}>
              TODAY'S SESSIONS
            </h2>
            <div className="horizontal-scroll flex gap-3 -mx-4 px-4">
              {todaySessions.length > 0 ? todaySessions.map(b => (
                <div
                  key={b.id}
                  className="shrink-0 animate-target"
                  style={{ width: 160, height: 100, borderRadius: 12, background: '#141414', border: '1px solid #1E1E1E', padding: 14 }}
                >
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#F5F0E8' }} className="truncate">{b.student?.name ?? 'Client'}</p>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 18, color: '#16A34A', marginTop: 4 }}>
                    {b.start_time}
                  </p>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 6,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      background: 'rgba(22,163,74,0.15)',
                      color: '#16A34A',
                    }}
                  >
                    Confirmed
                  </span>
                </div>
              )) : (
                <div
                  className="shrink-0"
                  style={{ width: 200, height: 100, borderRadius: 12, background: '#141414', border: '1px solid #1E1E1E', padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <p style={{ fontSize: 13, color: '#555' }}>No sessions today</p>
                </div>
              )}
            </div>
          </div>

          {/* Earnings ring */}
          <div className="px-4 mt-6 animate-target">
            <div style={{ borderRadius: 16, background: '#0D0D0D', border: '1px solid #1E1E1E', padding: 20 }}>
              <EarningsRing current={totalEarnings} goal={profile?.earnings_goal ?? 1000} />
              <p style={{ textAlign: 'center', fontSize: 12, color: '#555', marginTop: 8 }}>Monthly Earnings</p>
            </div>
          </div>

          {/* Pending requests */}
          {pendingBookings.length > 0 && (
            <div className="px-4 mt-6">
              <div className="flex items-center gap-2 mb-3">
                <h2 style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>
                  NEW REQUESTS
                </h2>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  background: '#16A34A',
                  color: '#000',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '0 6px',
                }}>
                  {pendingBookings.length}
                </span>
              </div>
              <div className="space-y-2">
                {pendingBookings.map(b => (
                  <div
                    key={b.id}
                    className="animate-target"
                    style={{ borderRadius: 14, background: '#0D0D0D', border: '1px solid #1E1E1E', padding: 16, transition: 'all 300ms ease' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="overflow-hidden shrink-0"
                          style={{ width: 40, height: 40, borderRadius: '50%', background: '#141414' }}
                        >
                          {b.student?.profile_photo_url ? (
                            <img src={b.student.profile_photo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ color: '#555', fontSize: 14 }}>
                              {b.student?.name?.charAt(0) ?? '?'}
                            </div>
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#F5F0E8' }}>{b.student?.name ?? 'Client'}</p>
                          <p style={{ fontSize: 12, color: '#555' }}>
                            {b.student?.area ?? ''} · {b.start_time}
                          </p>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: '#555' }}>
                        {(() => {
                          const hrs = Math.floor((Date.now() - new Date(b.created_at).getTime()) / 3600000);
                          return hrs < 1 ? 'Just now' : `${hrs}h ago`;
                        })()}
                      </span>
                    </div>
                    {b.note && (
                      <p style={{ fontSize: 13, color: '#888', marginTop: 8, fontStyle: 'italic' }} className="line-clamp-2">
                        "{b.note}"
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => updateBookingStatus.mutate({ bookingId: b.id, status: 'confirmed' })}
                        disabled={updateBookingStatus.isPending}
                        className="flex-1 active:scale-[0.96] transition-transform"
                        style={{ height: 36, borderRadius: 8, background: '#16A34A', color: '#000', fontSize: 13, fontWeight: 700 }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => updateBookingStatus.mutate({ bookingId: b.id, status: 'cancelled' })}
                        disabled={updateBookingStatus.isPending}
                        className="flex-1 active:scale-[0.96] transition-transform"
                        style={{ height: 36, borderRadius: 8, background: '#141414', border: '1px solid #1E1E1E', color: '#888', fontSize: 13, fontWeight: 600 }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile strength */}
          <div className="px-4 mt-6 mb-8 animate-target">
            <div style={{ borderRadius: 14, background: '#0D0D0D', border: '1px solid #1E1E1E', padding: 16 }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 13, fontWeight: 500, color: '#F5F0E8' }}>Profile Strength: {Math.round((profile?.profile_strength ?? 0.6) * 100)}%</span>
                <Link to="/settings" style={{ fontSize: 12, color: '#16A34A', fontWeight: 500 }}>Improve →</Link>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: '#1E1E1E', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(profile?.profile_strength ?? 0.6) * 100}%`,
                    background: '#16A34A',
                    borderRadius: 3,
                    transition: 'width 800ms ease-out',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ─── CLIENT DASHBOARD ───
  return (
    <AppLayout>
      <div ref={scrollRef} className="scroll-container" style={{ minHeight: '100%' }}>
        {/* Header with gradient */}
        <div
          style={{
            padding: '20px 16px 28px',
            background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(22,163,74,0.12) 0%, transparent 70%), #000`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, color: '#F5F0E8' }}>
                {getGreeting()}, {firstName}
              </h1>
              <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
                {getContextMessage()}
              </p>
            </div>
            <Link to="/settings" className="touch-target relative">
              <Bell style={{ width: 22, height: 22, color: '#888' }} />
            </Link>
          </div>

          {/* Quick stats row */}
          <div className="horizontal-scroll flex gap-3 mt-5 -mx-4 px-4">
            <StatCard icon={Dumbbell} label="Sessions" value={clientCompletedCount} />
            <StatCard
              icon={Calendar}
              label="This Month"
              value={allBookings.filter(b => {
                const d = new Date(b.date);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && b.status === 'completed';
              }).length}
            />
            <StatCard icon={Flame} label="Streak" value={currentStreak} />
          </div>
        </div>

        {/* Announcements */}
        {announcements.filter(a => a.target_audience === 'all' || a.target_audience === 'clients').slice(0, 1).map(a => (
          <div
            key={a.id}
            className="mx-4 mt-4"
            style={{ borderRadius: 12, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.15)', padding: '12px 14px' }}
          >
            <p style={{ fontSize: 13, fontWeight: 600, color: '#F5F0E8' }}>{a.title}</p>
            <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{a.body}</p>
          </div>
        ))}

        {/* Next session card */}
        {nextSession && (
          <div className="px-4 mt-5">
            <div
              className="session-pulse"
              style={{
                borderRadius: 16,
                background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                padding: 20,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="overflow-hidden shrink-0"
                    style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.2)' }}
                  >
                    {nextSession.tutor?.profile_photo_url ? (
                      <img src={nextSession.tutor.profile_photo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: 'rgba(0,0,0,0.5)', fontWeight: 700 }}>
                        {nextSession.tutor?.name?.charAt(0) ?? '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#000' }}>{nextSession.tutor?.name ?? 'Trainer'}</p>
                    <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>{nextSession.tutor?.area ?? ''}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, color: '#000' }}>
                    {nextSession.start_time}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>
                    {new Date(nextSession.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => navigate(`/messages/${nextSession.tutor_id}`)}
                  className="flex-1 active:scale-[0.96] transition-transform"
                  style={{ height: 36, borderRadius: 8, background: 'rgba(0,0,0,0.15)', color: '#000', fontSize: 13, fontWeight: 600, border: '1px solid rgba(0,0,0,0.2)' }}
                >
                  Message
                </button>
                <button
                  onClick={() => navigate(`/trainers/${nextSession.tutor_id}`)}
                  className="flex-1 active:scale-[0.96] transition-transform"
                  style={{ height: 36, borderRadius: 8, background: 'rgba(0,0,0,0.15)', color: '#000', fontSize: 13, fontWeight: 600, border: '1px solid rgba(0,0,0,0.2)' }}
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {!nextSession && (
          <div className="px-4 mt-5">
            <Link
              to="/discover"
              className="flex items-center justify-between active:scale-[0.98] transition-transform"
              style={{ borderRadius: 16, background: '#141414', border: '1px solid #1E1E1E', padding: '18px 16px' }}
            >
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#F5F0E8' }}>Find your next trainer</p>
                <p style={{ fontSize: 12, color: '#555', marginTop: 2 }}>Browse verified trainers near you</p>
              </div>
              <ArrowRight style={{ width: 20, height: 20, color: '#16A34A' }} />
            </Link>
          </div>
        )}

        {/* Platform challenge */}
        {platformChallenge && (
          <div className="px-4 mt-5 animate-target">
            <div style={{ borderRadius: 14, background: '#0D0D0D', border: '1px solid #1E1E1E', padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#F5F0E8', marginBottom: 8 }}>🏆 {platformChallenge.title}</p>
              <div className="flex items-center gap-3">
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#1E1E1E', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(((challengeProgress?.completed_sessions ?? 0) / platformChallenge.target_sessions) * 100, 100)}%`,
                      background: '#16A34A',
                      borderRadius: 3,
                      transition: 'width 800ms ease-out',
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#16A34A' }}>
                  {challengeProgress?.completed_sessions ?? 0}/{platformChallenge.target_sessions}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Matched for you */}
        {bestMatches.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between px-4 mb-3">
              <h2 style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>
                MATCHED FOR YOU
              </h2>
              <Link to="/discover" style={{ fontSize: 12, color: '#16A34A', fontWeight: 500 }}>See all</Link>
            </div>
            <div className="horizontal-scroll flex gap-3 -mx-4 px-4">
              {bestMatches.map(({ trainer: t, score }) => (
                <Link
                  key={t.id}
                  to={`/trainers/${t.id}`}
                  className="shrink-0 active:scale-[0.98] transition-transform animate-target"
                  style={{ width: 200, borderRadius: 16, background: '#111', border: '1px solid #1E1E1E', padding: 16, display: 'block' }}
                >
                  <div
                    className="overflow-hidden"
                    style={{ width: 64, height: 64, borderRadius: 12, background: '#141414', marginBottom: 10 }}
                  >
                    {t.profile_photo_url ? (
                      <img src={t.profile_photo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: '#555', fontSize: 20, fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                        {t.name?.charAt(0) ?? '?'}
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#F5F0E8' }} className="truncate">{t.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Star style={{ width: 12, height: 12, fill: '#EAB308', color: '#EAB308' }} />
                    <span style={{ fontSize: 12, color: '#888' }}>{(t.rating_avg ?? 0).toFixed(1)}</span>
                    <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>${t.hourly_rate}</span>
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 8,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      background: 'rgba(22,163,74,0.15)',
                      color: '#16A34A',
                    }}
                  >
                    {Math.min(Math.round((score / 8) * 100), 99)}% match
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div className="px-4 mt-6 mb-8">
          <h2 style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 12 }}>
            RECENT
          </h2>
          {upcomingBookings.length > 0 ? (
            <div className="space-y-0">
              {upcomingBookings.slice(0, 3).map((b, i) => (
                <Link
                  key={b.id}
                  to={`/trainers/${b.tutor_id}`}
                  className="flex items-center gap-3 py-3 active:opacity-70 animate-target"
                  style={{
                    borderBottom: i < Math.min(upcomingBookings.length, 3) - 1 ? '1px solid #1A1A1A' : 'none',
                  }}
                >
                  <div
                    className="shrink-0 flex items-center justify-center"
                    style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(22,163,74,0.1)' }}
                  >
                    <Calendar style={{ width: 16, height: 16, color: '#16A34A' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#F5F0E8' }} className="truncate">
                      {b.status === 'confirmed' ? 'Session' : 'Request'} with {b.tutor?.name ?? 'Trainer'}
                    </p>
                    <p style={{ fontSize: 11, color: '#555' }}>
                      {b.date} · {b.start_time}
                    </p>
                  </div>
                  <ChevronRight style={{ width: 16, height: 16, color: '#333' }} />
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Dumbbell style={{ width: 32, height: 32, color: '#333', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, color: '#555' }}>No recent activity</p>
              <Link
                to="/discover"
                className="inline-block mt-3 active:scale-[0.96] transition-transform"
                style={{ padding: '8px 20px', borderRadius: 8, background: '#16A34A', color: '#000', fontSize: 13, fontWeight: 700 }}
              >
                Find a Trainer
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
