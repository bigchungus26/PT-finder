import { useState, useEffect, useCallback } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SplashScreen } from "./components/SplashScreen";
import { useKeyboardAware } from "./hooks/useScrollAnimations";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Discover from "./pages/Discover";
import DiscoverPreview from "./pages/DiscoverPreview";
import GroupDetail from "./pages/GroupDetail";
import CreateGroup from "./pages/CreateGroup";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import Admin from "./pages/Admin";
import TutorProfile from "./pages/TutorProfile";
import RequestBoard from "./pages/RequestBoard";
import MyClients from "./pages/MyClients";
import Guidelines from "./pages/Guidelines";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

function AuthLoadingScreen() {
  const { authError } = useAuth();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#000' }}>
      {authError ? (
        <>
          <p style={{ color: '#888', fontSize: 14 }}>{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="active:scale-[0.96] transition-transform"
            style={{ padding: '10px 24px', borderRadius: 10, background: '#16A34A', color: '#000', fontWeight: 700, fontSize: 14 }}
          >
            Retry
          </button>
        </>
      ) : (
        <div style={{ width: 32, height: 32, border: '2px solid #1E1E1E', borderTopColor: '#16A34A', borderRadius: '50%', animation: 'spinRefresh 600ms linear infinite' }} />
      )}
    </div>
  );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <AuthLoadingScreen />;
  if (!user) return <Navigate to="/" replace />;

  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <AuthLoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (!profile?.is_admin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as unknown as Record<string, boolean>).standalone;
    if (isStandalone) return;

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua);
    setIsIOS(ios);

    if (ios) {
      const timer = setTimeout(() => setShowPrompt(true), 30000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      (window as unknown as Record<string, unknown>).__deferredPrompt = e;
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!showPrompt) return null;

  const handleInstall = async () => {
    const prompt = (window as unknown as Record<string, unknown>).__deferredPrompt as { prompt: () => void } | undefined;
    if (prompt) {
      prompt.prompt();
    }
    setShowPrompt(false);
  };

  return (
    <div
      className="fixed left-4 right-4 z-[80] flex items-center gap-3"
      style={{
        bottom: `calc(var(--bottom-nav-height) + var(--sab) + 12px)`,
        padding: '14px 16px',
        borderRadius: 14,
        background: '#0D0D0D',
        border: '1px solid #1E1E1E',
      }}
    >
      <div className="flex-1">
        <p style={{ fontSize: 13, fontWeight: 600, color: '#F5F0E8' }}>
          Add Kotch to Home Screen
        </p>
        <p style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
          {isIOS ? 'Tap the share icon, then "Add to Home Screen"' : 'For the best experience'}
        </p>
      </div>
      {!isIOS && (
        <button
          onClick={handleInstall}
          className="active:scale-[0.96] transition-transform"
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: '#16A34A',
            color: '#000',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          Install
        </button>
      )}
      <button
        onClick={() => setShowPrompt(false)}
        style={{ color: '#555', fontSize: 18, padding: 4 }}
        className="touch-target"
      >
        ×
      </button>
    </div>
  );
}

function AppShell() {
  useKeyboardAware();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/discover-preview" element={<DiscoverPreview />} />
      <Route path="/guidelines" element={<Guidelines />} />

      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/discover" element={
        <ProtectedRoute><Discover /></ProtectedRoute>
      } />
      <Route path="/groups" element={<Navigate to="/discover?tab=community" replace />} />
      <Route path="/trainers/:tutorId" element={
        <ProtectedRoute><TutorProfile /></ProtectedRoute>
      } />
      <Route path="/tutors/:tutorId" element={<Navigate to="/discover" replace />} />
      <Route path="/groups/create" element={
        <ProtectedRoute><CreateGroup /></ProtectedRoute>
      } />
      <Route path="/groups/:id" element={
        <ProtectedRoute><GroupDetail /></ProtectedRoute>
      } />
      <Route path="/courses" element={<Navigate to="/discover" replace />} />
      <Route path="/courses/:id" element={<Navigate to="/discover" replace />} />
      <Route path="/ai" element={<Navigate to="/dashboard" replace />} />
      <Route path="/messages" element={
        <ProtectedRoute><Messages /></ProtectedRoute>
      } />
      <Route path="/messages/:userId" element={
        <ProtectedRoute><Messages /></ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute><Settings /></ProtectedRoute>
      } />
      <Route path="/requests" element={
        <ProtectedRoute><RequestBoard /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <AdminRoute><Admin /></AdminRoute>
      } />
      <Route path="/my-clients" element={
        <ProtectedRoute><MyClients /></ProtectedRoute>
      } />
      <Route path="/leaderboard" element={
        <ProtectedRoute><Leaderboard /></ProtectedRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {
  const [splashDone, setSplashDone] = useState(() => {
    return sessionStorage.getItem('kotch_splash_shown') === '1';
  });

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('kotch_splash_shown', '1');
    setSplashDone(true);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AppShell />
              <PWAInstallPrompt />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
