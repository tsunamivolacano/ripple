import React from 'react';
import { IntensitySelector } from './IntensitySelector';
import { useRipple } from '@/context/RippleContext';
import { ALL_PERSONAS } from '@/data/ripplePersonaData';
import { 
  Zap, 
  Clock, 
  CalendarDays,
  Calendar, 
  FileText, 
  TrendingDown, 
  Plus, 
  LogOut,
  User,
  ChevronDown,
  HelpCircle,
  RotateCcw,
  Bell,
  BookOpen
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

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTaskModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenNewTaskModal }) => {
  const { debt, studyLogs, currentUser, logout, loginDemoAccount, replayTutorial, hasCompletedTutorial, setNotificationModalOpen } = useRipple();

  const activeDemoPersona = ALL_PERSONAS.find(p => p.id === currentUser?.demoPersonaId);

  const totalStudyMins = studyLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
  const totalStudyHoursStr = `${Math.floor(totalStudyMins / 60)}h`;

  const navItems = [
    { id: 'warroom', tourKey: 'warroom-tab', label: 'War Room', icon: Clock, badge: debt.missedDeadlinesCount > 0 ? debt.missedDeadlinesCount : null },
    { id: 'study', tourKey: 'study-tab', label: 'Study Tracker', icon: BookOpen, badge: totalStudyMins > 0 ? totalStudyHoursStr : null },
    { id: 'calendar', tourKey: 'calendar-tab', label: 'Live Calendar', icon: CalendarDays },
    { id: 'timetable', tourKey: 'timetable-tab', label: 'Timetable & Context', icon: Calendar },
    { id: 'evidence', tourKey: 'evidence-tab', label: 'Evidence Case File', icon: FileText },
    { id: 'debt', tourKey: 'debt-tab', label: 'Debt Ledger', icon: TrendingDown, badge: `${debt.totalHoursBehind}h` }
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

          {/* Header Action Controls */}
          <div className="flex items-center gap-2">
            <IntensitySelector />

            {/* Notification Settings Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setNotificationModalOpen(true)}
              className="border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white h-9 w-9 rounded-xl shrink-0"
              title="Notification & Reminder Settings"
            >
              <Bell className="w-4 h-4 text-rose-400" />
            </Button>

            {/* Replay Tutorial Button at Top */}
            <Button
              variant="outline"
              size="sm"
              onClick={replayTutorial}
              className="hidden lg:flex border-indigo-500/40 bg-indigo-950/30 hover:bg-indigo-900/50 text-indigo-200 hover:text-white text-xs gap-1.5 px-3 font-semibold transition-all h-9"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>{hasCompletedTutorial ? 'Replay Guide' : 'Start Guide'}</span>
            </Button>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs text-slate-200 gap-1.5 px-2.5 h-9"
                >
                  {currentUser?.isDemo ? (
                    <>
                      <span className="text-sm">{activeDemoPersona?.avatarBadge || '👤'}</span>
                      <span className="font-semibold hidden sm:inline">{activeDemoPersona?.name || 'Demo'}</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5 text-rose-400" />
                      <span className="font-semibold truncate max-w-[100px] hidden sm:inline">{currentUser?.email}</span>
                    </>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="bg-slate-900 border-slate-800 text-slate-100 w-64 rounded-xl p-1">
                <DropdownMenuLabel className="text-[11px] font-mono text-slate-400 uppercase tracking-wider px-2 py-1.5">
                  Logged in as {currentUser?.isDemo ? 'Demo Account' : currentUser?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />

                <DropdownMenuItem
                  onClick={() => setNotificationModalOpen(true)}
                  className="cursor-pointer text-slate-200 hover:bg-slate-800 rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-xs font-semibold"
                >
                  <Bell className="w-3.5 h-3.5 text-rose-400" />
                  Background Reminder Settings
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={replayTutorial}
                  className="cursor-pointer text-indigo-300 hover:bg-indigo-950/40 rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-xs font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                  Replay Step-by-Step Guide
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-slate-800" />

                <DropdownMenuLabel className="text-[10px] text-slate-500 uppercase tracking-wider px-2 py-1">
                  Switch Demo Account
                </DropdownMenuLabel>

                {ALL_PERSONAS.map((persona) => {
                  const isSelected = currentUser?.isDemo && currentUser?.demoPersonaId === persona.id;
                  return (
                    <DropdownMenuItem
                      key={persona.id}
                      onClick={() => loginDemoAccount(persona.id)}
                      className={`cursor-pointer rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-rose-500/15 text-white font-medium border border-rose-500/30'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{persona.avatarBadge}</span>
                        <span>{persona.name}</span>
                      </div>
                      {isSelected && (
                        <Badge variant="outline" className="text-[9px] border-rose-500/40 text-rose-300 bg-rose-950/40">
                          Active
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  );
                })}

                <DropdownMenuSeparator className="bg-slate-800" />

                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-xs font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Direct Prominent Sign Out Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="border-rose-500/40 bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 hover:text-white text-xs font-semibold gap-1.5 px-3 py-1.5 h-9"
              title="Sign Out of Dashboard"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>

            <Button
              data-tour="new-task-btn"
              size="sm"
              onClick={onOpenNewTaskModal}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs gap-1.5 shadow-md shadow-rose-950 h-9"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">New Task</span>
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
                data-tour={item.tourKey}
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

          <button
            onClick={replayTutorial}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-950/40 border border-indigo-500/30"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Replay Guide</span>
          </button>
        </nav>
      </div>
    </header>
  );
};