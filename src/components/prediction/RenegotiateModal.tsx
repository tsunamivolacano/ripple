import React, { useState } from 'react';
import { Task } from '@/types/ripple';
import { useRipple } from '@/context/RippleContext';
import { Handshake, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RenegotiateModalProps {
  task: Task | null;
  onClose: () => void;
}

export const RenegotiateModal: React.FC<RenegotiateModalProps> = ({ task, onClose }) => {
  const { renegotiateTask } = useRipple();
  const [reason, setReason] = useState<string>('underestimated');
  const [extensionHours, setExtensionHours] = useState<number>(24);

  if (!task) return null;

  const handleConfirm = () => {
    const newDueDate = new Date(Date.now() + extensionHours * 3600 * 1000).toISOString();
    renegotiateTask(task.id, newDueDate, reason);
    onClose();
  };

  return (
    <Dialog open={!!task} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-blue-500/40 text-white max-w-md rounded-2xl p-6">
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-1 border border-blue-500/30">
            <Handshake className="w-5 h-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-white">
            Honest Exit & Schedule Renegotiation
          </DialogTitle>
          <p className="text-xs text-slate-400">
            Resetting your buffer is better than ghosting a deadline. Pick a real reason to adjust task calibration.
          </p>
        </DialogHeader>

        <div className="space-y-4 my-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Renegotiation Reason</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="bg-slate-900 border-slate-800 text-xs text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                <SelectItem value="underestimated">Underestimated task complexity / time required</SelectItem>
                <SelectItem value="burnout">High fatigue / burnout — need mandatory rest</SelectItem>
                <SelectItem value="emergency">Unexpected conflict / higher priority task</SelectItem>
                <SelectItem value="teacher_delay">Teacher extended submission window</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">New Deadline Extension Window</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '+12 Hours', hrs: 12 },
                { label: '+24 Hours', hrs: 24 },
                { label: '+48 Hours', hrs: 48 }
              ].map((opt) => (
                <button
                  key={opt.hrs}
                  type="button"
                  onClick={() => setExtensionHours(opt.hrs)}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                    extensionHours === opt.hrs
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-start gap-2 text-[11px] text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Renegotiation resets the Doomsday Dial, but adds a +0.5h debt score to your Procrastination Ledger.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white text-xs">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs">
            Confirm Extension
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};