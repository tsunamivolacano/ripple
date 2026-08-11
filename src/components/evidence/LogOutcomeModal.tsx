import React, { useState, useEffect } from 'react';
import { useRipple } from '@/context/RippleContext';
import { FileText, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LogOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogOutcomeModal: React.FC<LogOutcomeModalProps> = ({ isOpen, onClose }) => {
  const { logEvidence, tasks, slots } = useRipple();

  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [actualOutcome, setActualOutcome] = useState('');
  const [wasOnTime, setWasOnTime] = useState(true);
  const [accuracyRating, setAccuracyRating] = useState(5);
  const [userNotes, setUserNotes] = useState('');

  useEffect(() => {
    if (isOpen && tasks.length > 0) {
      if (!selectedTaskId || !tasks.some((t) => t.id === selectedTaskId)) {
        setSelectedTaskId(tasks[0].id);
      }
    }
  }, [isOpen, tasks, selectedTaskId]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];
  const slot = slots.find((s) => s.id === selectedTask?.slotId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    logEvidence({
      taskId: selectedTask.id,
      taskTitle: selectedTask.title,
      subject: slot?.subject || 'General',
      teacherName: slot?.teacherName || 'Unknown Instructor',
      predictedScenario: `Forecasted consequence for ${selectedTask.taskType} submission under ${slot?.teacherName || 'teacher'}.`,
      actualOutcome: actualOutcome || 'Completed and handed in.',
      wasOnTime,
      accuracyRating,
      userNotes
    });

    setActualOutcome('');
    setUserNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            Log Outcome to Evidence Log
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          {tasks.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Select Task</label>
              <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                  {tasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Actual Real-World Outcome</label>
            <Textarea
              placeholder="e.g. Teacher checked notebook, gave 10/10; or Got called upon during class..."
              value={actualOutcome}
              onChange={(e) => setActualOutcome(e.target.value)}
              required
              className="bg-slate-900 border-slate-800 text-xs text-white h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Was it On Time?</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={wasOnTime ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWasOnTime(true)}
                  className={`flex-1 text-xs font-semibold ${
                    wasOnTime ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-slate-800 text-slate-400'
                  }`}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={!wasOnTime ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWasOnTime(false)}
                  className={`flex-1 text-xs font-semibold ${
                    !wasOnTime ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'border-slate-800 text-slate-400'
                  }`}
                >
                  Late / Missed
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">AI Forecast Accuracy (1-5 Stars)</label>
              <div className="flex items-center gap-1 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setAccuracyRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= accuracyRating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Reflective Personal Notes</label>
            <Input
              placeholder="What will you do differently next week?"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              className="bg-slate-900 border-slate-800 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white text-xs">
              Cancel
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs">
              Save Case File Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};