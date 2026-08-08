import React from 'react';
import { Task, TimetableSlot } from '@/types/ripple';
import { getStatusTheme } from '@/utils/timeUtils';
import { FilterType } from './CalendarHeader';

interface WeekViewGridProps {
  currentWeekDays: Date[];
  hours: number[];
  today: Date;
  filterType: FilterType;
  getItemsForDate: (date: Date) => { dayTasks: Task[]; daySlots: TimetableSlot[] };
  onSelectTask: (task: Task) => void;
  onSelectSlot: (slot: TimetableSlot) => void;
}

export const WeekViewGrid: React.FC<WeekViewGridProps> = ({
  currentWeekDays,
  hours,
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
                          onClick={() => onSelectSlot(s)}
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
                            onClick={() => onSelectTask(t)}
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
  );
};