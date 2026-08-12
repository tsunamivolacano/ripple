import React from 'react';
import { Task, TimetableSlot } from '@/types/ripple';
import { getStatusTheme } from '@/utils/timeUtils';
import { FilterType } from './CalendarHeader';

interface MonthViewGridProps {
  currentMonthDays: (Date | null)[];
  today: Date;
  filterType: FilterType;
  getItemsForDate: (date: Date) => { dayTasks: Task[]; daySlots: TimetableSlot[] };
  onSelectTask: (task: Task) => void;
  onSelectSlot: (slot: TimetableSlot) => void;
}

export const MonthViewGrid: React.FC<MonthViewGridProps> = ({
  currentMonthDays,
  today,
  filterType,
  getItemsForDate,
  onSelectTask,
  onSelectSlot
}) => {
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  return (
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
                        onClick={() => onSelectSlot(slot)}
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
                          onClick={() => onSelectTask(task)}
                          className={`p-1 rounded text-[10px] truncate cursor-pointer border ${theme.bgClass}`}
                        >
                          <span className="font-bold">
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'Self-Study'}
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
  );
};