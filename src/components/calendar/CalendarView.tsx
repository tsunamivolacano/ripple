import React, { useState, useMemo } from 'react';
import { useRipple } from '@/context/RippleContext';
import { Task, TimetableSlot } from '@/types/ripple';
import { getStatusTheme, getTimeRemaining } from '@/utils/timeUtils';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Globe, 
  Plus, 
  GraduationCap, 
  Zap, 
  Play, 
  CheckCircle2, 
  Filter, 
  Sparkles,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type ViewMode = 'month' | 'week' | 'day';

interface CalendarViewProps {
  onOpenPrediction: (task: Task) => void;
  onOpenFocus: (task: Task) => void;
  onOpenNewTaskModal: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onOpenPrediction,
  onOpenFocus,
  onOpenNewTaskModal
}) => {
  const { tasks, slots } = useRipple();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'tasks' | 'classes'>('all');

  // Detect local timezone name
  const userTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';
    } catch {
      return 'Local Time';
    }
  }, []);

  // Helpers for date calculations
  const today = new Date();

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  // Day Name Helper
  const getDayName = (date: Date) =>
    date.toLocaleDateString('en-US', { weekday: 'long' });

  // Filter items per day
  const getItemsForDate = (date: Date) => {
    const dayStr = getDayName(date);

    // Filter tasks whose due date matches this local day
    const dayTasks = tasks.filter((t) => {
      if (t.status === 'completed' && filterType === 'classes') return false;
      const taskDate = new Date(t.dueDate);
      return isSameDay(taskDate, date);
    });

    // Filter recurring timetable slots matching this day of week
    const daySlots = slots.filter((s) => s.dayOfWeek === dayStr);

    return { dayTasks, daySlots };
  };

  // Month navigation
  const navigateDate = (amount: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + amount);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + amount * 7);
    } else {
      newDate.setDate(newDate.getDate() + amount);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Week days generator
  const currentWeekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    // Monday as start of week
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(startOfWeek);
      nextDay.setDate(startOfWeek.getDate() + i);
      days.push(nextDay);
    }
    return days;
  }, [currentDate]);

  // Month days generator
  const currentMonthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];
    
    // Fill leading empty padding days (Monday based)
    let startDay = firstDayOfMonth.getDay(); // 0 is Sun
    const leadingPadding = startDay === 0 ? 6 : startDay - 1;

    for (let i = 0; i < leadingPadding; i++) {
      days.push(null);
    }

    // Fill month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentDate]);

  // Hours array for day/week views (07:00 to 22:00)
  const hours = Array.from({ length: 16 }, (_, i) => i + 7);

  return (
    <div className="space-y-6">
      {/* Top Header & Control Toolbar */}
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
          {/* Navigation Controls */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate(-1)}
              className="h-8 w-8 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="text-xs font-semibold text-slate-200 hover:text-white px-2.5 h-8"
            >
              Today
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate(1)}
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
                onClick={() => setViewMode(mode)}
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

      {/* FILTER BUTTONS */}
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
            onClick={() => setFilterType(f.id as any)}
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

      {/* VIEW RENDER: MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 space-y-3 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 text-center border-b border-slate-800 pb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <span key={day} className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                {day}
              </span>
            ))}
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-7 gap-2">
            {currentMonthDays.map((date, idx) => {
              if (!date) {
                return (
                  <div key={idx} className="min-h-[110px] rounded-xl bg-slate-950/30 border border-slate-900/40 p-2 opacity-30" />
                );
              }

              const { dayTasks, daySlots } = getItemsForDate(date);
              const isTodayDay = isSameDay(date, today);

              return (
                <div
                  key={idx}
                  className={`min-h-[110px] rounded-xl p-2 border transition-all flex flex-col justify-between ${
                    isTodayDay
                      ? 'bg-rose-950/20 border-rose-500/50 ring-1 ring-rose-500/30'
                      : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-md ${
                          isTodayDay
                            ? 'bg-rose-600 text-white font-extrabold'
                            : 'text-slate-300'
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {isTodayDay && (
                        <span className="text-[9px] font-bold text-rose-400 uppercase">Today</span>
                      )}
                    </div>

                    {/* Class Slots */}
                    {filterType !== 'tasks' && daySlots.length > 0 && (
                      <div className="space-y-1 mb-1">
                        {daySlots.slice(0, 2).map((slot) => (
                          <div
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot)}
                            className="p-1 rounded bg-indigo-950/50 border border-indigo-500/30 text-[10px] text-indigo-200 truncate cursor-pointer hover:bg-indigo-900/60"
                          >
                            <span className="font-bold">{slot.startTime}</span> {slot.subject}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tasks */}
                    {filterType !== 'classes' && dayTasks.length > 0 && (
                      <div className="space-y-1">
                        {dayTasks.slice(0, 2).map((task) => {
                          const theme = getStatusTheme(task.status);
                          return (
                            <div
                              key={task.id}
                              onClick={() => setSelectedTask(task)}
                              className={`p-1 rounded text-[10px] truncate cursor-pointer border ${theme.bgClass}`}
                            >
                              <span className="font-bold">
                                {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>{' '}
                              {task.title}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {(dayTasks.length > 2 || daySlots.length > 2) && (
                    <span className="text-[9px] font-mono text-slate-500 text-right mt-1">
                      +{Math.max(0, dayTasks.length - 2) + Math.max(0, daySlots.length - 2)} more
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW RENDER: WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 space-y-3 overflow-x-auto">
          <div className="grid grid-cols-8 gap-2 min-w-[700px]">
            {/* Time Column Header */}
            <div className="text-xs font-bold text-slate-500 text-center py-2">Time</div>

            {/* 7 Day Columns */}
            {currentWeekDays.map((date, idx) => {
              const isTodayDay = isSameDay(date, today);
              return (
                <div
                  key={idx}
                  className={`text-center py-2 px-1 rounded-xl border ${
                    isTodayDay ? 'bg-rose-950/40 border-rose-500/50 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="block text-[10px] font-bold uppercase text-slate-400">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className={`text-sm font-bold font-mono ${isTodayDay ? 'text-rose-300' : ''}`}>
                    {date.getDate()}
                  </span>
                </div>
              );
            })}

            {/* Hourly Grid Rows */}
            {hours.map((hour) => {
              const formattedHour = `${String(hour).padStart(2, '0')}:00`;
              return (
                <React.Fragment key={hour}>
                  {/* Time Label */}
                  <div className="text-[10px] font-mono text-slate-500 text-center self-start pt-1">
                    {formattedHour}
                  </div>

                  {/* Day Columns for this hour */}
                  {currentWeekDays.map((date, dayIdx) => {
                    const { dayTasks, daySlots } = getItemsForDate(date);

                    // Slots matching start hour
                    const matchingSlots = daySlots.filter((s) => {
                      const startH = parseInt(s.startTime.split(':')[0], 10);
                      return startH === hour;
                    });

                    // Tasks matching due hour
                    const matchingTasks = dayTasks.filter((t) => {
                      const dueH = new Date(t.dueDate).getHours();
                      return dueH === hour;
                    });

                    return (
                      <div
                        key={dayIdx}
                        className="min-h-[48px] rounded-lg bg-slate-950/40 border border-slate-800/50 p-1 space-y-1 relative"
                      >
                        {filterType !== 'tasks' &&
                          matchingSlots.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => setSelectedSlot(s)}
                              className="p-1 rounded bg-indigo-950/80 border border-indigo-500/40 text-[10px] text-indigo-200 truncate cursor-pointer hover:bg-indigo-900"
                            >
                              <span className="font-bold">{s.subject}</span>
                            </div>
                          ))}

                        {filterType !== 'classes' &&
                          matchingTasks.map((t) => {
                            const theme = getStatusTheme(t.status);
                            return (
                              <div
                                key={t.id}
                                onClick={() => setSelectedTask(t)}
                                className={`p-1 rounded text-[10px] truncate cursor-pointer border ${theme.bgClass}`}
                              >
                                <span className="font-bold">{t.title}</span>
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW RENDER: DAY VIEW */}
      {viewMode === 'day' && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xl font-extrabold text-white">
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Local Timezone: {userTimeZone}
              </p>
            </div>

            {isSameDay(currentDate, today) && (
              <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 gap-1.5 py-1 px-3">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Live Schedule Today
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            {hours.map((hour) => {
              const formattedHour = `${String(hour).padStart(2, '0')}:00`;
              const { dayTasks, daySlots } = getItemsForDate(currentDate);

              const hourSlots = daySlots.filter((s) => parseInt(s.startTime.split(':')[0], 10) === hour);
              const hourTasks = dayTasks.filter((t) => new Date(t.dueDate).getHours() === hour);

              const isCurrentHour = isSameDay(currentDate, today) && today.getHours() === hour;

              return (
                <div
                  key={hour}
                  className={`flex items-start gap-4 p-3 rounded-xl border transition-all ${
                    isCurrentHour
                      ? 'bg-rose-950/20 border-rose-500/50 ring-1 ring-rose-500/30'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="w-16 shrink-0 text-xs font-mono font-bold text-slate-400">
                    {formattedHour}
                  </div>

                  <div className="flex-1 space-y-2">
                    {hourSlots.length === 0 && hourTasks.length === 0 ? (
                      <span className="text-[11px] text-slate-600 italic">No scheduled activities</span>
                    ) : (
                      <>
                        {filterType !== 'tasks' &&
                          hourSlots.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => setSelectedSlot(s)}
                              className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between cursor-pointer hover:bg-indigo-900/40"
                            >
                              <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-indigo-400" />
                                <div>
                                  <h4 className="text-xs font-bold text-indigo-200">{s.subject}</h4>
                                  <span className="text-[10px] text-slate-400">
                                    {s.startTime} - {s.endTime} ({s.room}) • {s.teacherName}
                                  </span>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-300">
                                {s.strictnessTag.replace('_', ' ')}
                              </Badge>
                            </div>
                          ))}

                        {filterType !== 'classes' &&
                          hourTasks.map((t) => {
                            const theme = getStatusTheme(t.status);
                            const timeInfo = getTimeRemaining(t.dueDate);
                            return (
                              <div
                                key={t.id}
                                onClick={() => setSelectedTask(t)}
                                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${theme.bgClass}`}
                              >
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-amber-400" />
                                  <div>
                                    <h4 className="text-xs font-bold text-white">{t.title}</h4>
                                    <span className="text-[10px] text-slate-300">
                                      Due at {new Date(t.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {timeInfo.formattedRemaining}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={theme.badge}>{theme.label}</Badge>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenPrediction(t);
                                    }}
                                    className="bg-slate-900 hover:bg-slate-800 text-xs text-amber-300 h-7 px-2 gap-1 border border-slate-700"
                                  >
                                    <Zap className="w-3 h-3 text-amber-400" /> Predict
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TASK DETAILS MODAL */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        {selectedTask && (
          <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-md rounded-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className={getStatusTheme(selectedTask.status).badge}>
                  {getStatusTheme(selectedTask.status).label}
                </Badge>
              </div>
              <DialogTitle className="text-lg font-bold text-white">
                {selectedTask.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 my-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block">Local Due Date & Time:</span>
                <span className="font-mono text-amber-300 font-bold">
                  {new Date(selectedTask.dueDate).toLocaleString([], {
                    dateStyle: 'full',
                    timeStyle: 'short'
                  })}
                </span>
              </div>

              {selectedTask.description && (
                <p className="text-slate-300">{selectedTask.description}</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const t = selectedTask;
                  setSelectedTask(null);
                  onOpenPrediction(t);
                }}
                className="bg-slate-900 border-slate-700 hover:bg-slate-800 text-xs text-amber-300 gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Predict Forecast
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  const t = selectedTask;
                  setSelectedTask(null);
                  onOpenFocus(t);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Start Focus Sprint
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* TIMETABLE SLOT DETAILS MODAL */}
      <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
        {selectedSlot && (
          <DialogContent className="bg-slate-950 border-indigo-500/40 text-white max-w-md rounded-2xl p-6">
            <DialogHeader>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-1">
                <GraduationCap className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-white">
                {selectedSlot.subject}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 my-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Teacher: {selectedSlot.teacherName}</span>
                  <span className="text-slate-500 font-mono">Weight: {selectedSlot.weight}%</span>
                </div>
                <div className="text-slate-400">
                  {selectedSlot.dayOfWeek}s • {selectedSlot.startTime} - {selectedSlot.endTime} ({selectedSlot.room})
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Badge variant="outline" className="border-rose-500/30 text-rose-300 bg-rose-950/40">
                  {selectedSlot.strictnessTag.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-950/40">
                  {selectedSlot.stakesTag.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};