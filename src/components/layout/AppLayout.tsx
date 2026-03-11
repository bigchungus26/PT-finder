import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home, Search, ShoppingBag, Package, User,
  Store, Menu, X, LogOut, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Search, label: 'Browse', path: '/browse' },
  { icon: Store, label: 'Stores', path: '/stores' },
  { icon: Package, label: 'Orders', path: '/orders' },
  { icon: User, label: 'Profile', path: '/profile' },
];

function BottomNav() {
  const location = useLocation();
  const { itemCount } = useCart();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)' }}
    >
      <div className="flex items-stretch max-w-2xl mx-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path || (path !== '/home' && location.pathname.startsWith(path));
          const isCart = path === '/browse';

          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5', active && 'stroke-[2.5px]')} />
              </div>
              <span className={cn('text-[10px] font-medium', active ? 'text-primary' : 'text-muted-foreground')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function CartButton() {
  const { itemCount, totalLBP } = useCart();
  const navigate = useNavigate();

  if (itemCount === 0) return null;

  return (
    <button
      onClick={() => navigate('/cart')}
      className="fixed bottom-[calc(56px+env(safe-area-inset-bottom,0px)+12px)] inset-x-4 z-50 max-w-2xl mx-auto flex items-center gap-3 bg-primary text-primary-foreground rounded-2xl p-3.5 shadow-lg active:scale-[0.98] transition-transform"
    >
      <div className="relative">
        <ShoppingBag className="w-5 h-5" />
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary-foreground text-primary text-[9px] font-black flex items-center justify-center">
          {itemCount}
        </span>
      </div>
      <span className="font-semibold text-sm flex-1 text-left">View cart</span>
      <span className="text-sm font-bold opacity-90">
        {new Intl.NumberFormat('en-US').format(totalLBP)} LBP
      </span>
      <ChevronRight className="w-4 h-4 opacity-70" />
    </button>
  );
}

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const titles: Record<string, string> = {
    '/home': 'Stackr',
    '/browse': 'Browse',
    '/stores': 'Stores',
    '/orders': 'My Orders',
    '/cart': 'Cart',
    '/checkout': 'Checkout',
    '/profile': 'Profile',
    '/request': 'Request Product',
  };

  const getTitle = () => {
    for (const [prefix, title] of Object.entries(titles)) {
      if (location.pathname === prefix || location.pathname.startsWith(prefix + '/')) {
        return title;
      }
    }
    return 'Stackr';
  };

  const showBack = !NAV_ITEMS.some((n) => location.pathname === n.path || location.pathname === '/home');

  return (
    <>
      <header
        className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border flex items-center justify-between px-4"
        style={{ height: 52, paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180 text-foreground" />
          </button>
        ) : (
          <span className="font-display font-black text-lg text-primary tracking-tight">Stackr</span>
        )}

        <span className={cn('font-semibold text-sm text-foreground', !showBack && 'opacity-0')}>
          {showBack ? getTitle() : ''}
        </span>

        <button
          onClick={() => setMenuOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>
      </header>

      {/* Slide-out menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-background border-l border-border p-4 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display font-black text-xl text-primary">Stackr</span>
              <button onClick={() => setMenuOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-foreground"
                >
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-sm">{label}</span>
                </Link>
              ))}
              <Link
                to="/request"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-foreground"
              >
                <Package className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-sm">Request Product</span>
              </Link>
            </nav>

            <button
              onClick={async () => { setMenuOpen(false); await signOut(); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground mt-4"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Sign out</span>
            </button>

            <p className="text-xs text-muted-foreground/50 text-center mt-4">
              Stackr · Supplements in Lebanon
            </p>
          </div>
        </div>
      )}
    </>
  );
}

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pb-[calc(56px+env(safe-area-inset-bottom,0px)+16px)]">
        {children}
      </main>
      <CartButton />
      <BottomNav />
    </div>
  );
}
