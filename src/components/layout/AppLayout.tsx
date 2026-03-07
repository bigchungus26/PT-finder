import { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dumbbell,
  Home,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  MessageCircle,
  Bell,
  Check,
  Shield,
  Calendar,
  Clock,
  Radio,
  Building2,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useTotalUnreadDMs } from '@/hooks/useDirectMessages';
import {
  useNotifications,
  useUnreadCount,
  useMarkAllRead,
  useNotificationSubscription,
} from '@/hooks/useNotifications';
import { useGroups } from '@/hooks/useGroups';
import { useMyGym } from '@/hooks/useGyms';
import { useUpcomingSessions, useActiveSessions } from '@/hooks/useSessions';
import type { SessionWithDetails } from '@/hooks/useSessions';
import SessionCockpit from '@/components/SessionCockpit';
import { BottomNav } from '@/components/BottomNav';

function isSessionLive(session: SessionWithDetails): boolean {
  const today = new Date().toISOString().split('T')[0];
  if (session.date !== today) return false;
  const now = new Date();
  const [nowHours, nowMins] = [now.getHours(), now.getMinutes()];
  const parse = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const start = parse(session.start_time);
  const end = parse(session.end_time);
  const current = nowHours * 60 + nowMins;
  return current >= start && current <= end;
}

interface AppLayoutProps {
  children: React.ReactNode;
}

const CLIENT_NAV = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Dumbbell, label: 'Find Trainers', path: '/discover' },
  { icon: MessageCircle, label: 'Chats', path: '/messages' },
  { icon: Radio, label: 'Requests', path: '/requests' },
] as const;

const TRAINER_NAV_BASE = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  // My Profile is injected dynamically with the trainer's ID
  { icon: BookOpen, label: 'Courses', path: '/courses' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
  { icon: Sparkles, label: 'AI Fitness Consultant', path: '/ai' },
  { icon: Radio, label: 'Requests', path: '/requests' },
] as const;

const GYM_NAV_BASE = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  // My Gym is injected dynamically with the gym's ID
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
] as const;

const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [cockpitSession, setCockpitSession] = useState<SessionWithDetails | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { data: profile } = useCurrentProfile();
  const isTrainer = profile?.user_role === 'trainer';
  const isGym = profile?.user_role === 'gym';
  const { data: myGym } = useMyGym(isGym ? user?.id : undefined);
  const { data: unreadDMs = 0 } = useTotalUnreadDMs();
  const { data: unreadNotifCount = 0 } = useUnreadCount();
  const { data: notifications = [] } = useNotifications();
  const markAllRead = useMarkAllRead();
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
  const { data: activeSessions = [] } = useActiveSessions(myGroupIds);
  const sidebarSessions = upcomingSessions.slice(0, 3);
  const liveSession = activeSessions[0] ?? null;

  useNotificationSubscription();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen" style={{ background: '#000' }}>
      {/* Mobile header - minimal, safe-area aware */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
        style={{
          height: `calc(52px + var(--sat))`,
          paddingTop: 'var(--sat)',
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid #1E1E1E',
        }}
      >
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 18,
            letterSpacing: '0.1em',
            color: '#F5F0E8',
          }}
        >
          KOTCH
        </span>
        <div className="flex items-center gap-1">
          <button
            className="touch-target relative"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <Bell style={{ width: 20, height: 20, color: '#888' }} />
            {unreadNotifCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 flex items-center justify-center"
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#16A34A',
                  fontSize: 8,
                  fontWeight: 700,
                  color: '#000',
                }}
              >
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </span>
            )}
          </button>
          <button
            className="touch-target hidden lg:flex"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu style={{ width: 22, height: 22, color: '#888' }} />
          </button>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Notification dropdown */}
      {notifOpen && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setNotifOpen(false)}
          />
          <div
            className="fixed z-[61] w-80 max-h-96 overflow-hidden"
            style={{
              top: `calc(52px + var(--sat) + 4px)`,
              right: 16,
              background: '#0D0D0D',
              borderRadius: 16,
              border: '1px solid #1E1E1E',
            }}
          >
            <div className="p-3 border-b" style={{ borderColor: '#1E1E1E' }}>
              <div className="flex items-center justify-between">
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#F5F0E8' }}>Notifications</h3>
                {unreadNotifCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => markAllRead.mutate()}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto max-h-72 scroll-container">
              {notifications.length > 0 ? (
                notifications.slice(0, 10).map((notif) => (
                  <button
                    key={notif.id}
                    className="w-full text-left p-3 transition-colors"
                    style={{
                      borderBottom: '1px solid #1A1A1A',
                      background: !notif.is_read ? 'rgba(22,163,74,0.05)' : 'transparent',
                    }}
                    onClick={() => {
                      setNotifOpen(false);
                      if (notif.link) navigate(notif.link);
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#F5F0E8' }}>{notif.title}</p>
                    <p style={{ fontSize: 12, color: '#888', marginTop: 2 }} className="line-clamp-2">{notif.body}</p>
                    <p style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
                      {new Date(notif.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center" style={{ fontSize: 13, color: '#555' }}>
                  No notifications yet
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Desktop sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 transition-transform duration-300",
        "hidden lg:block",
      )} style={{
        background: '#0A0A0A',
        borderRight: '1px solid #1E1E1E',
      }}>
        <div className="h-16 flex items-center justify-between px-4" style={{ borderBottom: '1px solid #1E1E1E' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#16A34A' }}>
              <Dumbbell className="w-5 h-5" style={{ color: '#000' }} />
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, letterSpacing: '0.1em', color: '#F5F0E8' }}>KOTCH</span>
          </div>
          <button
            className="relative p-2"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <Bell style={{ width: 16, height: 16, color: '#888' }} />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1 right-1" style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A' }} />
            )}
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {[
            ...(isTrainer
              ? [
                  ...TRAINER_NAV_BASE.slice(0, 1),
                  { icon: UserCircle, label: 'My Profile', path: `/trainers/${user?.id}` } as const,
                  ...TRAINER_NAV_BASE.slice(1),
                ]
              : isGym
              ? [
                  ...GYM_NAV_BASE.slice(0, 1),
                  { icon: Building2, label: 'My Gym', path: myGym ? `/gyms/${myGym.id}` : '/dashboard' } as const,
                  ...GYM_NAV_BASE.slice(1),
                ]
              : CLIENT_NAV),
            ...(profile?.is_admin
              ? [{ icon: Shield, label: 'Admin', path: '/admin' }]
              : []),
          ].map(item => {
            const isActive = item.path === '/messages'
              ? location.pathname.startsWith('/messages')
              : location.pathname === item.path;
            const showBadge = item.path === '/messages' && unreadDMs > 0;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "text-[#F5F0E8]"
                    : "text-[#888] hover:text-[#F5F0E8]"
                )}
                style={{
                  background: isActive ? '#16A34A' : 'transparent',
                }}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {showBadge && (
                  <Badge className={cn(
                    "ml-auto text-xs h-5 min-w-[20px] flex items-center justify-center",
                    isActive ? "bg-[#000] text-[#16A34A]" : "bg-[#16A34A] text-[#000]"
                  )}>
                    {unreadDMs > 9 ? '9+' : unreadDMs}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {sidebarSessions.length > 0 && (
          <div className="px-4 mt-2">
            <h3 style={{ fontSize: 10, fontWeight: 500, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 12 }}>
              Upcoming Meetups
            </h3>
            <div className="space-y-1">
              {sidebarSessions.map((session) => {
                const live = isSessionLive(session);
                return (
                  <button
                    key={session.id}
                    onClick={() => {
                      if (live) {
                        setCockpitSession(session);
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors"
                    style={{
                      background: live ? 'rgba(22,163,74,0.1)' : '#0D0D0D',
                      border: live ? '1px solid rgba(22,163,74,0.2)' : '1px solid transparent',
                      cursor: live ? 'pointer' : 'default',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <p style={{ fontWeight: 500, color: '#F5F0E8' }} className="truncate flex-1">{session.title}</p>
                      {live && (
                        <span className="shrink-0 flex items-center gap-1" style={{ color: '#16A34A', fontSize: 10, fontWeight: 500 }}>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#16A34A' }} />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#16A34A' }} />
                          </span>
                          Live
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5" style={{ color: '#555' }}>
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(session.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <Clock className="w-3 h-3 ml-1" />
                      <span>{session.start_time}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4" style={{ borderTop: '1px solid #1E1E1E' }}>
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile?.avatar ?? undefined} />
              <AvatarFallback style={{ background: '#141414', color: '#888' }}>{(profile?.name ?? '?')[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p style={{ fontSize: 13, fontWeight: 600, color: '#F5F0E8' }} className="truncate">{profile?.name ?? 'User'}</p>
                {profile?.user_role === 'trainer' && (
                  <Badge variant="outline" style={{ fontSize: 10, borderColor: '#2A2A2A', color: '#888' }} className="px-1.5 py-0 h-4 shrink-0">Trainer</Badge>
                )}
              </div>
              <p style={{ fontSize: 11, color: '#555' }} className="truncate">
                {isTrainer ? (profile?.city || profile?.gym || 'Trainer') :
                 isGym ? (myGym?.name || 'Gym') :
                 (profile?.city || 'PT Finder')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1" style={{ color: '#888' }} asChild>
              <Link to="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </Button>
            <Button variant="ghost" size="sm" style={{ color: '#888' }} onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className="lg:pl-64 min-h-screen page-enter"
        style={{
          paddingTop: `calc(52px + var(--sat))`,
          paddingBottom: `calc(var(--bottom-nav-height) + var(--sab) + 8px)`,
        }}
      >
        {children}
      </main>

      {/* Bottom nav (mobile only) */}
      <BottomNav />

      {/* Floating live-session banner */}
      <AnimatePresence>
        {liveSession && !cockpitSession && (
          <motion.button
            key="live-banner"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={() => setCockpitSession(liveSession)}
            className="fixed z-[60]"
            style={{
              bottom: `calc(var(--bottom-nav-height) + var(--sab) + 16px)`,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 20px',
              borderRadius: 9999,
              background: 'rgba(13,13,13,0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(22,163,74,0.3)',
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#16A34A' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#16A34A' }} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#F5F0E8' }}>{liveSession.title}</span>
            <Radio style={{ width: 16, height: 16, color: '#16A34A' }} />
            <span style={{ fontSize: 11, color: '#555' }}>
              {liveSession.start_time} - {liveSession.end_time}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Session cockpit overlay */}
      {cockpitSession && (
        <SessionCockpit
          session={cockpitSession}
          onClose={() => setCockpitSession(null)}
        />
      )}
    </div>
  );
};

export default AppLayout;
