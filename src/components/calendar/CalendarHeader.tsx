import React from 'react';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Globe, 
  Plus, 
  Filter 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type ViewMode = 'month' | 'week' | 'day';
export type FilterType = 'all' | 'tasks' | 'classes';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: ViewMode;
  filterType: FilterType;
  userTimeZone: string;
  onNavigate: (amount: number) => void;
  onGoToToday: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onFilterTypeChange: (filter: FilterType) => void;
  onOpenNewTaskModal: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  filterType,
  userTimeZone,
  onNavigate,
  onGoToToday,
  onViewModeChange,
  onFilterTypeChange,
  onOpenNewTaskModal
}) => {
  return (
    <div className="space-y-4">
      {/* Navigation Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white">
                Live Local Calendar
              </h2>
              <Badge variant="outline" className="bg-slate-950 text-emerald-400 border-emerald-500/30 text-[10px] gap-1 px-2">
                <Globe className="w-3 h-3 text-emerald-400" />
                {userTimeZone}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Synced with your device local date, deadlines, and weekly schedule.
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Navigation Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate(-1)}
              className="h-8 w-8 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onGoToToday}
              className="text-xs font-semibold text-slate-200 hover:text-white px-2.5 h-8"
            >
              Today
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate(1)}
              className="h-8 w-8 text-slate-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <span className="text-xs font-bold text-slate-200 font-mono px-2 min-w-[120px] text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>

          {/* View Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                  viewMode === mode
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={onOpenNewTaskModal}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs gap-1.5 h-9"
          >
            <Plus className="w-4 h-4" />
            New Event
          </Button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {[
          { id: 'all', label: 'All Activities' },
          { id: 'tasks', label: 'Tasks & Deadlines' },
          { id: 'classes', label: 'Classes & Timetable' }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterTypeChange(f.id as FilterType)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filterType === f.id
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
};