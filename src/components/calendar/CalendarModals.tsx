import React from 'react';
import { Task, TimetableSlot, StudyLog } from '@/types/ripple';
import { getStatusTheme } from '@/utils/timeUtils';
import { formatRecurrenceLabel } from '@/utils/recurrenceUtils';
import { GraduationCap, Zap, Play, Trash2, Repeat, BookOpen, AlertOctagon, Trophy, FileText, Bell, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CalendarModalsProps {
  selectedTask: Task | null;
  selectedSlot: TimetableSlot | null;
  selectedStudyLog: StudyLog | null;
  onCloseTaskModal: () => void;
  onCloseSlotModal: () => void;
  onCloseStudyLogModal: () => void;
  onOpenPrediction: (task: Task) => void;
  onOpenFocus: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteSlot: (slotId: string) => void;
  onDeleteStudyLog: (logId: string) => void;
}

export const CalendarModals: React.FC<CalendarModalsProps> = ({
  selectedTask,
  selectedSlot,
  selectedStudyLog,
  onCloseTaskModal,
  onCloseSlotModal,
  onCloseStudyLogModal,
  onOpenPrediction,
  onOpenFocus,
  onDeleteTask,
  onDeleteSlot,
  onDeleteStudyLog
}) => {
  const getTaskTypeBadge = (type: string) => {
    switch (type) {
      case 'exam':
        return <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold gap-1">🏆 Major Exam</Badge>;
      case 'test':
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold gap-1">✍️ Class Test / Quiz</Badge>;
      case 'assignment':
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 gap-1">📄 Assignment</Badge>;
      case 'deadline':
        return <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 gap-1">⏳ Deadline</Badge>;
      case 'study_session':
        return <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 gap-1">📚 Planned Study Session</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      {/* TASK / EXAM / EVENT DETAILS MODAL */}
      <Dialog open={!!selectedTask} onOpenChange={onCloseTaskModal}>
        {selectedTask && (
          <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-md rounded-2xl p-6 shadow-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {getTaskTypeBadge(selectedTask.taskType)}
                <Badge className={getStatusTheme(selectedTask.status).badge}>
                  {selectedTask.hasDeadline === false ? 'Self-Paced' : getStatusTheme(selectedTask.status).label}
                </Badge>
              </div>
              <DialogTitle className="text-lg font-extrabold text-white">
                {selectedTask.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 my-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Scheduled Date & Time:</span>
                  <span className="font-mono text-amber-300 font-bold">
                    {selectedTask.dueDate
                      ? new Date(selectedTask.dueDate).toLocaleString([], {
                          dateStyle: 'full',
                          timeStyle: 'short'
                        })
                      : 'Flexible / Self-Study'}
                  </span>
                </div>

                <span className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1 pt-1">
                  <Repeat className="w-3.5 h-3.5 text-indigo-400" />
                  {formatRecurrenceLabel(selectedTask.recurrence, selectedTask.dueDate)}
                </span>
              </div>

              {/* Syllabus / Topics to Cover */}
              {selectedTask.syllabus && (
                <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1">
                  <span className="text-[11px] font-extrabold uppercase text-indigo-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    Syllabus / Topics to Cover
                  </span>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {selectedTask.syllabus}
                  </p>
                </div>
              )}

              {/* Description */}
              {selectedTask.description && (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold block">Notes:</span>
                  <p className="text-slate-300">{selectedTask.description}</p>
                </div>
              )}

              {/* Active Reminders */}
              {selectedTask.reminders && selectedTask.reminders.length > 0 && (
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] pt-1">
                  <Bell className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>
                    Reminders set for: {selectedTask.reminders.join(', ')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800">
              {selectedTask.hasDeadline !== false ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const t = selectedTask;
                    onCloseTaskModal();
                    onOpenPrediction(t);
                  }}
                  className="bg-slate-900 border-slate-700 hover:bg-slate-800 text-xs text-amber-300 gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Predict Forecast
                </Button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onDeleteTask(selectedTask.id);
                    onCloseTaskModal();
                  }}
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-xs gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    const t = selectedTask;
                    onCloseTaskModal();
                    onOpenFocus(t);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Start Timer
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* TIMETABLE SLOT / CLASS DETAILS MODAL */}
      <Dialog open={!!selectedSlot} onOpenChange={onCloseSlotModal}>
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

                <span className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1 pt-1">
                  <Repeat className="w-3.5 h-3.5 text-indigo-400" />
                  {selectedSlot.specificDate ? `One-time session on ${selectedSlot.specificDate}` : formatRecurrenceLabel(selectedSlot.recurrence)}
                </span>
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

            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDeleteSlot(selectedSlot.id);
                  onCloseSlotModal();
                }}
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-xs gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Class
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* LOGGED STUDY SESSION DETAILS MODAL */}
      <Dialog open={!!selectedStudyLog} onOpenChange={onCloseStudyLogModal}>
        {selectedStudyLog && (
          <DialogContent className="bg-slate-950 border-emerald-500/40 text-white max-w-md rounded-2xl p-6">
            <DialogHeader>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1">
                <BookOpen className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-white">
                Logged Study Session: {selectedStudyLog.subject}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 my-2 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Total Duration Logged:</span>
                  <span className="font-mono text-emerald-400 font-extrabold text-sm">
                    {Math.floor(selectedStudyLog.durationMinutes / 60) > 0
                      ? `${Math.floor(selectedStudyLog.durationMinutes / 60)}h ${selectedStudyLog.durationMinutes % 60}m`
                      : `${selectedStudyLog.durationMinutes}m`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>Logged Date & Time:</span>
                  <span className="font-mono text-slate-200">
                    {new Date(selectedStudyLog.loggedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>Source:</span>
                  <span className="font-mono capitalize text-slate-300">
                    {selectedStudyLog.source === 'timer' ? '⏱️ Live Focus Timer / Stopwatch' : '✍️ Manual Log'}
                  </span>
                </div>
              </div>

              {selectedStudyLog.topic && (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-300 uppercase">Topic / Study Notes:</span>
                  <p className="text-slate-200">{selectedStudyLog.topic}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDeleteStudyLog(selectedStudyLog.id);
                  onCloseStudyLogModal();
                }}
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-xs gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Study Entry
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onCloseStudyLogModal}
                className="bg-slate-900 border-slate-800 text-xs text-slate-300"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
};