import React from 'react';
import { Task, TimetableSlot } from '@/types/ripple';
import { getStatusTheme } from '@/utils/timeUtils';
import { formatRecurrenceLabel } from '@/utils/recurrenceUtils';
import { GraduationCap, Zap, Play, Trash2, Repeat } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CalendarModalsProps {
  selectedTask: Task | null;
  selectedSlot: TimetableSlot | null;
  onCloseTaskModal: () => void;
  onCloseSlotModal: () => void;
  onOpenPrediction: (task: Task) => void;
  onOpenFocus: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteSlot: (slotId: string) => void;
}

export const CalendarModals: React.FC<CalendarModalsProps> = ({
  selectedTask,
  selectedSlot,
  onCloseTaskModal,
  onCloseSlotModal,
  onOpenPrediction,
  onOpenFocus,
  onDeleteTask,
  onDeleteSlot
}) => {
  return (
    <>
      {/* TASK DETAILS MODAL */}
      <Dialog open={!!selectedTask} onOpenChange={onCloseTaskModal}>
        {selectedTask && (
          <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-md rounded-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className={getStatusTheme(selectedTask.status).badge}>
                  {selectedTask.hasDeadline === false ? 'Self-Paced' : getStatusTheme(selectedTask.status).label}
                </Badge>
              </div>
              <DialogTitle className="text-lg font-bold text-white">
                {selectedTask.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 my-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block">Timing:</span>
                <span className="font-mono text-amber-300 font-bold block">
                  {selectedTask.dueDate
                    ? new Date(selectedTask.dueDate).toLocaleString([], {
                        dateStyle: 'full',
                        timeStyle: 'short'
                      })
                    : 'Flexible Self-Study / No Deadline'}
                </span>

                <span className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1 pt-1">
                  <Repeat className="w-3.5 h-3.5 text-indigo-400" />
                  {formatRecurrenceLabel(selectedTask.recurrence, selectedTask.dueDate)}
                </span>
              </div>

              {selectedTask.description && (
                <p className="text-slate-300">{selectedTask.description}</p>
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
                  Delete Task
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
                  Start Focus Timer
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
    </>
  );
};