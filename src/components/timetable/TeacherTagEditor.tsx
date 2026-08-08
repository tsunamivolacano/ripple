import React, { useState, useEffect } from 'react';
import { TimetableSlot, StrictnessTag, StakesTag } from '@/types/ripple';
import { useRipple } from '@/context/RippleContext';
import { GraduationCap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TeacherTagEditorProps {
  isOpen: boolean;
  editingSlot: TimetableSlot | null;
  onClose: () => void;
}

export const TeacherTagEditor: React.FC<TeacherTagEditorProps> = ({
  isOpen,
  editingSlot,
  onClose
}) => {
  const { addSlot, updateSlot } = useRipple();

  const [subject, setSubject] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<TimetableSlot['dayOfWeek']>('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:15');
  const [room, setRoom] = useState('Room 101');
  const [teacherName, setTeacherName] = useState('');
  const [strictnessTag, setStrictnessTag] = useState<StrictnessTag>('NOTEBOOK_CHECK');
  const [stakesTag, setStakesTag] = useState<StakesTag>('GRADED_QUIZ');
  const [weight, setWeight] = useState<number>(25);

  useEffect(() => {
    if (editingSlot) {
      setSubject(editingSlot.subject);
      setDayOfWeek(editingSlot.dayOfWeek);
      setStartTime(editingSlot.startTime);
      setEndTime(editingSlot.endTime || '10:15');
      setRoom(editingSlot.room);
      setTeacherName(editingSlot.teacherName);
      setStrictnessTag(editingSlot.strictnessTag);
      setStakesTag(editingSlot.stakesTag);
      setWeight(editingSlot.weight);
    } else {
      setSubject('');
      setTeacherName('');
      setStartTime('09:00');
      setEndTime('10:15');
      setWeight(25);
    }
  }, [editingSlot, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !teacherName) return;

    if (editingSlot) {
      updateSlot({
        ...editingSlot,
        subject,
        dayOfWeek,
        startTime,
        endTime,
        room,
        teacherName,
        strictnessTag,
        stakesTag,
        weight
      });
    } else {
      addSlot({
        subject,
        dayOfWeek,
        startTime,
        endTime,
        room,
        teacherName,
        strictnessTag,
        stakesTag,
        weight
      });
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-lg rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            {editingSlot ? 'Edit Class & Teacher Context' : 'Add Class & Human Context'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Subject Name</label>
              <Input
                placeholder="e.g. Physics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="bg-slate-900 border-slate-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Teacher / Instructor</label>
              <Input
                placeholder="e.g. Dr. Sharma"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                required
                className="bg-slate-900 border-slate-800 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Day</label>
              <Select value={dayOfWeek} onValueChange={(v: any) => setDayOfWeek(v)}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Start Time</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="bg-slate-900 border-slate-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">End Time</label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="bg-slate-900 border-slate-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Room / Hall</label>
              <Input
                placeholder="Lab 204"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs text-white"
              />
            </div>
          </div>

          {/* Teacher Strictness & Stakes */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-rose-300">Teacher Strictness Tag</label>
              <Select value={strictnessTag} onValueChange={(v: any) => setStrictnessTag(v)}>
                <SelectTrigger className="bg-slate-900 border-rose-500/30 text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                  <SelectItem value="COLD_CALL">Spot Cold-Calls</SelectItem>
                  <SelectItem value="NOTEBOOK_CHECK">Checks Notebook Copies</SelectItem>
                  <SelectItem value="ATTENDANCE_STRICT">Strict Locks Doors</SelectItem>
                  <SelectItem value="PUBLIC_SCOLD">Public Scolder</SelectItem>
                  <SelectItem value="QUIET_TALK">Quiet Disappointment Talk</SelectItem>
                  <SelectItem value="LENIENT">Lenient (-10% late fee)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-indigo-300">Submission Stake</label>
              <Select value={stakesTag} onValueChange={(v: any) => setStakesTag(v)}>
                <SelectTrigger className="bg-slate-900 border-indigo-500/30 text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                  <SelectItem value="GRADED_QUIZ">Graded Quiz</SelectItem>
                  <SelectItem value="NOTEBOOK_COPY">Notebook / Diagram Copy</SelectItem>
                  <SelectItem value="LAB_PRACTICAL">Lab Practical Report</SelectItem>
                  <SelectItem value="PRESENTATION">Class Presentation</SelectItem>
                  <SelectItem value="HOMEWORK">Regular Homework</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Category Grade Weight:</span>
              <span className="font-mono text-amber-400">{weight}%</span>
            </div>
            <Input
              type="number"
              min={1}
              max={100}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="bg-slate-900 border-slate-800 text-xs text-white font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white text-xs">
              Cancel
            </Button>
            <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs">
              Save Class Context
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};