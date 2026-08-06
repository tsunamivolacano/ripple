import React from 'react';
import { IntensitySelector } from './IntensitySelector';
import { useRipple } from '@/context/RippleContext';
import { 
  Zap, 
  Clock, 
  Calendar, 
  FileText, 
  TrendingDown, 
  Plus, 
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTaskModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenNewTaskModal }) => {
  const { debt, profile, signOut } = useRipple();

  const navItems = [
    { id: 'warroom', label: 'War Room', icon: Clock, badge: debt.missedDeadlinesCount > 0 ? debt.missedDeadlinesCount : null },
    { id: 'timetable', label: 'Timetable & Context', icon: Calendar },
    { id: 'evidence', label: 'Evidence Case File', icon: FileText },
    { id: 'debt', label: 'Debt Ledger', icon: TrendingDown, badge: `${debt.totalHoursBehind}h` }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('warroom')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-rose-900/30">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  RIPPLE
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Consequence-Aware AI Task Manager
              </p>
            </div>
          </div>

          {/* Controls & Account */}
          <div className="flex items-center gap-3">
            <IntensitySelector />

            <Button
              size="sm"
              onClick={onOpenNewTaskModal}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs gap-1.5 shadow-md shadow-rose-950 hidden sm:flex"
            >
              <Plus className="w-4 h-4" />
              New Task
            </Button>

            {profile && (
              <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
                <div className="hidden md:block text-right">
                  <div className="text-xs font-bold text-white leading-none">
                    {profile.name}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {profile.role} • {profile.email}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  title="Log Out"
                  className="text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 h-8 w-8"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-800/80 pt-1 pb-2 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <Badge className="bg-slate-800 text-rose-300 text-[10px] px-1.5 py-0 h-4 border border-rose-500/30">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
</dyad-file>

<dyad-write path="src/App.tsx" description="Updating App routes to use profile context check for route protection">
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
  const { profile, loading } = useRipple();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-slate-400 font-mono">Restoring profile session...</p>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Auth Route Wrapper (Redirects to / if logged in)
const PublicAuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { profile, loading } = useRipple();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-slate-400 font-mono">Loading...</p>
      </div>
    );
  }

  if (profile) {
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