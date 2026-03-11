import { useState, useCallback } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { SplashScreen } from "./components/SplashScreen";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import Stores from "./pages/Stores";
import StoreProfile from "./pages/StoreProfile";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Profile from "./pages/Profile";
import RequestProduct from "./pages/RequestProduct";
import NotFound from "./pages/NotFound";

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
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0A0A0A' }}>
      {authError ? (
        <>
          <p style={{ color: '#888', fontSize: 14 }}>{authError}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '10px 24px', borderRadius: 10, background: '#16A34A', color: '#000', fontWeight: 700, fontSize: 14 }}
          >
            Retry
          </button>
        </>
      ) : (
        <div style={{ width: 32, height: 32, border: '2px solid #1a1a1a', borderTopColor: '#16A34A', borderRadius: '50%', animation: 'spin 600ms linear infinite' }} />
      )}
    </div>
  );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function AppShell() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Browse without auth */}
      <Route path="/browse" element={<Browse />} />
      <Route path="/stores" element={<Stores />} />
      <Route path="/stores/:storeId" element={<StoreProfile />} />
      <Route path="/products/:productId" element={<ProductDetail />} />

      {/* Auth required */}
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      <Route path="/orders/:orderId" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/request" element={<ProtectedRoute><RequestProduct /></ProtectedRoute>} />

      {/* Old PT Finder redirects */}
      <Route path="/dashboard" element={<Navigate to="/home" replace />} />
      <Route path="/discover" element={<Navigate to="/browse" replace />} />
      <Route path="/settings" element={<Navigate to="/profile" replace />} />
      <Route path="/trainers/*" element={<Navigate to="/browse" replace />} />
      <Route path="/gyms/*" element={<Navigate to="/stores" replace />} />
      <Route path="/messages/*" element={<Navigate to="/home" replace />} />
      <Route path="/my-clients" element={<Navigate to="/home" replace />} />
      <Route path="/requests" element={<Navigate to="/request" replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {
  const [splashDone, setSplashDone] = useState(() =>
    sessionStorage.getItem('stackr_splash_shown') === '1'
  );

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('stackr_splash_shown', '1');
    setSplashDone(true);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AppShell />
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
