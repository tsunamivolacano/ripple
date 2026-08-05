import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import { RippleProvider, useRipple } from "@/context/RippleContext";

const queryClient = new QueryClient();

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useRipple();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-slate-400 font-mono">Authenticating session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Auth Route Wrapper (Redirects to / if logged in)
const PublicAuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useRipple();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-slate-400 font-mono">Loading...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <PublicAuthRoute>
          <Login />
        </PublicAuthRoute>
      }
    />
    <Route
      path="/signup"
      element={
        <PublicAuthRoute>
          <SignUp />
        </PublicAuthRoute>
      }
    />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RippleProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </RippleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;