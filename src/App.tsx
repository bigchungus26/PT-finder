import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Discover from "./pages/Discover";
import GroupDetail from "./pages/GroupDetail";
import CreateGroup from "./pages/CreateGroup";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import AIAssistant from "./pages/AIAssistant";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import Admin from "./pages/Admin";
import TutorProfile from "./pages/TutorProfile";
import RequestBoard from "./pages/RequestBoard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

// Protected route wrapper using real auth
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/onboarding" element={<Onboarding />} />
    <Route path="/login" element={<Login />} />

    {/* Protected routes */}
    <Route path="/dashboard" element={
      <ProtectedRoute><Dashboard /></ProtectedRoute>
    } />
    <Route path="/discover" element={
      <ProtectedRoute><Discover /></ProtectedRoute>
    } />
    <Route path="/groups" element={<Navigate to="/discover?tab=community" replace />} />
    <Route path="/tutors/:tutorId" element={
      <ProtectedRoute><TutorProfile /></ProtectedRoute>
    } />
    <Route path="/groups/create" element={
      <ProtectedRoute><CreateGroup /></ProtectedRoute>
    } />
    <Route path="/groups/:id" element={
      <ProtectedRoute><GroupDetail /></ProtectedRoute>
    } />
    <Route path="/courses" element={
      <ProtectedRoute><Courses /></ProtectedRoute>
    } />
    <Route path="/courses/:id" element={
      <ProtectedRoute><CourseDetail /></ProtectedRoute>
    } />
    <Route path="/ai" element={
      <ProtectedRoute><AIAssistant /></ProtectedRoute>
    } />
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
      <ProtectedRoute><Admin /></ProtectedRoute>
    } />

    {/* Catch-all */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
