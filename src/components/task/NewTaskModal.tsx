import React, { useState } from 'react';
import { useRipple } from '@/context/RippleContext';
import { TaskType } from '@/types/ripple';
import { Plus, Clock, GraduationCap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose }) => {
  const { addTask, slots } = useRipple();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slotId, setSlotId] = useState(slots[0]?.id || '');
  const [hoursLeft, setHoursLeft] = useState(4);
  const [estimatedHours, setEstimatedHours] = useState(2.0);
  const [taskType, setTaskType] = useState<TaskType>('problem_set');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const dueDate = new Date(Date.now() + hoursLeft * 3600 * 1000).toISOString();

    addTask({
      title,
      description,
      slotId,
      dueDate,
      estimatedHours,
      completionPercentage: 0,
      taskType
    });

    // Reset
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-rose-500" />
            Add New Task to War Room
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Task Title</label>
            <Input
              placeholder="e.g. Physics Numerical Homework"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-slate-900 border-slate-800 text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Link to Timetable Slot / Subject</label>
            <Select value={slotId} onValueChange={setSlotId}>
              <SelectTrigger className="bg-slate-900 border-slate-800 text-xs text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                {slots.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.subject} ({s.teacherName} • {s.strictnessTag.replace('_', ' ')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Hours Until Deadline</label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                value={hoursLeft}
                onChange={(e) => setHoursLeft(Number(e.target.value))}
                className="bg-slate-900 border-slate-800 text-xs text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Estimated Effort (Hours)</label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="bg-slate-900 border-slate-800 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Task Type</label>
            <Select value={taskType} onValueChange={(v: any) => setTaskType(v)}>
              <SelectTrigger className="bg-slate-900 border-slate-800 text-xs text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                <SelectItem value="problem_set">Problem Set / Numericals</SelectItem>
                <SelectItem value="lab_report">Lab Report / Diagrams</SelectItem>
                <SelectItem value="essay">Essay / Writing</SelectItem>
                <SelectItem value="reading">Reading / Chapter Prep</SelectItem>
                <SelectItem value="revision">Exam Revision Sheet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Description / Details</label>
            <Textarea
              placeholder="Key sub-tasks or requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-900 border-slate-800 text-xs text-white h-16"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white text-xs">
              Cancel
            </Button>
            <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs">
              Add Task to War Room
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};