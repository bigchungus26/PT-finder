import { Link, useLocation } from 'react-router-dom';
import { Home, Search, MessageCircle, User, LayoutGrid, Calendar } from 'lucide-react';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useTotalUnreadDMs } from '@/hooks/useDirectMessages';
import { cn } from '@/lib/utils';

const CLIENT_TABS = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: Search, label: 'Discover', path: '/discover' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
  { icon: User, label: 'Profile', path: '/settings' },
] as const;

const TRAINER_TABS = [
  { icon: LayoutGrid, label: 'Dashboard', path: '/dashboard' },
  { icon: Calendar, label: 'Schedule', path: '/requests' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
  { icon: User, label: 'Profile', path: '/settings' },
] as const;

export function BottomNav() {
  const location = useLocation();
  const { data: profile } = useCurrentProfile();
  const { data: unreadDMs = 0 } = useTotalUnreadDMs();
  const isTrainer = profile?.user_role === 'trainer';
  const tabs = isTrainer ? TRAINER_TABS : CLIENT_TABS;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        height: `calc(56px + var(--sab))`,
        paddingBottom: 'var(--sab)',
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid #1E1E1E',
      }}
    >
      <div className="flex items-center justify-around h-[56px] px-2">
        {tabs.map((tab) => {
          const isActive = tab.path === '/messages'
            ? location.pathname.startsWith('/messages')
            : location.pathname === tab.path;
          const showBadge = tab.path === '/messages' && unreadDMs > 0;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 touch-target',
                'transition-transform duration-100',
                'active:scale-[0.88]',
              )}
            >
              {isActive && (
                <div
                  className="absolute -top-1 w-5 h-[3px] rounded-full"
                  style={{ background: '#16A34A' }}
                />
              )}
              <tab.icon
                className="transition-colors duration-150"
                style={{
                  width: 22,
                  height: 22,
                  color: isActive ? '#16A34A' : '#555',
                }}
              />
              <span
                className="transition-colors duration-150"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.04em',
                  fontWeight: 500,
                  color: isActive ? '#16A34A' : '#555',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                {tab.label}
              </span>
              {showBadge && (
                <span
                  className="absolute -top-0.5 -right-1 flex items-center justify-center"
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#16A34A',
                    color: '#000',
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {unreadDMs > 9 ? '9+' : unreadDMs}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
