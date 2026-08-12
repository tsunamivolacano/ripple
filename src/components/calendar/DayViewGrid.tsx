import React from 'react';
import { Task, TimetableSlot, StudyLog } from '@/types/ripple';
import { getStatusTheme, getTimeRemaining } from '@/utils/timeUtils';
import { Clock, GraduationCap, Zap, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FilterType } from './CalendarHeader';

interface DayViewGridProps {
  currentDate: Date;
  today: Date;
  userTimeZone: string;
  hours: number[];
  filterType: FilterType;
  getItemsForDate: (date: Date) => { dayTasks: Task[]; daySlots: TimetableSlot[]; dayStudyLogs: StudyLog[] };
  onSelectTask: (task: Task) => void;
  onSelectSlot: (slot: TimetableSlot) => void;
  onSelectStudyLog: (log: StudyLog) => void;
  onOpenPrediction: (task: Task) => void;
}

export const DayViewGrid: React.FC<DayViewGridProps> = ({
  currentDate,
  today,
  userTimeZone,
  hours,
  filterType,
  getItemsForDate,
  onSelectTask,
  onSelectSlot,
  onSelectStudyLog,
  onOpenPrediction
}) => {
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isTodayDay = isSameDay(currentDate, today);

  return (
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

        {isTodayDay && (
          <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 gap-1.5 py-1 px-3">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            Live Schedule Today
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {hours.map((hour) => {
          const formattedHour = `${String(hour).padStart(2, '0')}:00`;
          const { dayTasks, daySlots, dayStudyLogs } = getItemsForDate(currentDate);

          const hourLogs = dayStudyLogs.filter((l) => new Date(l.loggedAt).getHours() === hour);
          const hourSlots = daySlots.filter((s) => parseInt(s.startTime.split(':')[0], 10) === hour);
          const hourTasks = dayTasks.filter((t) => t.dueDate && new Date(t.dueDate).getHours() === hour);

          const isCurrentHour = isTodayDay && today.getHours() === hour;

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
                {hourSlots.length === 0 && hourTasks.length === 0 && hourLogs.length === 0 ? (
                  <span className="text-[11px] text-slate-600 italic">No scheduled activities</span>
                ) : (
                  <>
                    {/* Logged Study Sessions */}
                    {filterType !== 'classes' &&
                      hourLogs.map((l) => {
                        const hrs = Math.floor(l.durationMinutes / 60);
                        const mins = l.durationMinutes % 60;
                        const durationStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                        return (
                          <div
                            key={l.id}
                            onClick={() => onSelectStudyLog(l)}
                            className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between cursor-pointer hover:bg-emerald-900/40"
                          >
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-emerald-400" />
                              <div>
                                <h4 className="text-xs font-bold text-emerald-200">
                                  Logged Study: {l.subject}
                                </h4>
                                {l.topic && (
                                  <span className="text-[10px] text-slate-300 italic block">
                                    "{l.topic}"
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-mono text-xs">
                              +{durationStr}
                            </Badge>
                          </div>
                        );
                      })}

                    {filterType !== 'tasks' &&
                      filterType !== 'study_logs' &&
                      hourSlots.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => onSelectSlot(s)}
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
                      filterType !== 'study_logs' &&
                      hourTasks.map((t) => {
                        const theme = getStatusTheme(t.status);
                        const timeInfo = getTimeRemaining(t.dueDate);
                        return (
                          <div
                            key={t.id}
                            onClick={() => onSelectTask(t)}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${theme.bgClass}`}
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-400" />
                              <div>
                                <h4 className="text-xs font-bold text-white">{t.title}</h4>
                                <span className="text-[10px] text-slate-300">
                                  {t.dueDate
                                    ? `Due at ${new Date(t.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${timeInfo.formattedRemaining}`
                                    : 'Self-Study Goal'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={theme.badge}>{theme.label}</Badge>
                              {t.hasDeadline !== false && (
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
                              )}
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
  );
};