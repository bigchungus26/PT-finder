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
import { useUpcomingSessions, useActiveSessions } from '@/hooks/useSessions';
import type { SessionWithDetails } from '@/hooks/useSessions';
import SessionCockpit from '@/components/SessionCockpit';

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

const BASE_NAV_ITEMS = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Dumbbell, label: 'Find Trainers', path: '/discover' },
  { icon: MessageCircle, label: 'Chats', path: '/messages' },
  { icon: Radio, label: 'Requests', path: '/requests' },
];

const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [cockpitSession, setCockpitSession] = useState<SessionWithDetails | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { data: profile } = useCurrentProfile();
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
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-card/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">Kotch</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile notification bell */}
          <button
            className="relative p-2"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </span>
            )}
          </button>
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
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
          <div className="fixed top-14 right-4 lg:top-4 lg:right-auto lg:left-[17rem] z-[61] w-80 max-h-96 bg-card rounded-xl border border-border shadow-lg overflow-hidden">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Notifications</h3>
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
            <div className="overflow-y-auto max-h-72">
              {notifications.length > 0 ? (
                notifications.slice(0, 10).map((notif) => (
                  <button
                    key={notif.id}
                    className={cn(
                      'w-full text-left p-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0',
                      !notif.is_read && 'bg-primary/5'
                    )}
                    onClick={() => {
                      setNotifOpen(false);
                      if (notif.link) navigate(notif.link);
                    }}
                  >
                    <p className="text-sm font-medium text-foreground">{notif.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notif.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">
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
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Sidebar – glassmorphism */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 border-r border-border/50 transition-transform duration-300",
        "bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/70",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo + notification bell */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">Kotch</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Desktop notification bell */}
            <button
              className="relative p-2 hidden lg:block"
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center">
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </span>
              )}
            </button>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {[
            ...BASE_NAV_ITEMS,
            ...(profile?.is_admin
              ? [{ icon: Shield, label: 'Admin', path: '/admin' } as const]
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
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {showBadge && (
                  <Badge className={cn(
                    "ml-auto text-xs h-5 min-w-[20px] flex items-center justify-center",
                    isActive
                      ? "bg-primary-foreground text-primary"
                      : "bg-primary text-primary-foreground"
                  )}>
                    {unreadDMs > 9 ? '9+' : unreadDMs}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Upcoming Sessions */}
        {sidebarSessions.length > 0 && (
          <div className="px-4 mt-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">
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
                        setSidebarOpen(false);
                      }
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-xs transition-colors',
                      live
                        ? 'bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/15'
                        : 'bg-muted/50 cursor-default'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate flex-1">{session.title}</p>
                      {live && (
                        <span className="shrink-0 flex items-center gap-1 text-primary text-[10px] font-medium">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                          </span>
                          Live
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
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

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile?.avatar ?? undefined} />
              <AvatarFallback>{(profile?.name ?? '?')[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium truncate">{profile?.name ?? 'User'}</p>
                {profile?.user_role === 'trainer' && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">Trainer</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{profile?.school ?? 'Kotch'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1" asChild>
              <Link to="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        {children}
      </main>

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
            className={cn(
              'fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]',
              'flex items-center gap-3 px-5 py-3 rounded-full shadow-lg',
              'bg-card/80 backdrop-blur-xl border border-primary/30',
              'hover:shadow-xl transition-shadow cursor-pointer'
            )}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            <span className="text-sm font-medium text-foreground">{liveSession.title}</span>
            <Radio className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">
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
