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
  ChevronDown,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTaskModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenNewTaskModal }) => {
  const navigate = useNavigate();
  const { debt, user, profile, logout } = useRipple();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

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

          {/* Quick Action Center */}
          <div className="hidden md:flex items-center gap-3">
            <IntensitySelector />

            {/* User Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs text-slate-200 gap-2"
                >
                  <span className="text-sm">👤</span>
                  <span className="font-semibold truncate max-w-[120px]">
                    {user ? (profile?.fullName || user.email?.split('@')[0]) : 'Guest'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-900 border-slate-800 text-slate-100 w-64 rounded-xl p-1">
                <DropdownMenuLabel className="text-[11px] font-mono text-slate-400 uppercase tracking-wider px-2 py-1.5">
                  Account
                </DropdownMenuLabel>
                {user ? (
                  <>
                    <div className="px-2.5 py-2 bg-slate-950/80 rounded-lg border border-slate-800 mb-1">
                      <p className="text-xs font-bold text-white truncate">{profile?.fullName || 'Active User'}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    onClick={() => navigate('/login')}
                    className="cursor-pointer rounded-lg px-2.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Sign In
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              onClick={onOpenNewTaskModal}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs gap-1.5 shadow-md shadow-rose-950"
            >
              <Plus className="w-4 h-4" />
              New Task
            </Button>
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