import React from 'react';
import { Task } from '@/types/ripple';
import { useRipple } from '@/context/RippleContext';
import { generateConsequenceForecast } from '@/utils/predictionEngine';
import { Trophy, ShieldCheck, Sparkles, Zap, Flame, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PositiveRecapModalProps {
  task: Task | null;
  onClose: () => void;
}

export const PositiveRecapModal: React.FC<PositiveRecapModalProps> = ({ task, onClose }) => {
  const { slots, settings } = useRipple();

  if (!task) return null;

  const slot = slots.find((s) => s.id === task.slotId);
  const forecast = generateConsequenceForecast(task, slot, settings.intensityMode, settings.personalVelocityMultiplier);
  const loop = forecast.positiveCounterLoop;

  return (
    <Dialog open={!!task} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-emerald-500/60 text-white max-w-md rounded-2xl text-center p-6 shadow-2xl">
        <DialogHeader>
          <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center mb-2 shadow-lg shadow-emerald-950 animate-bounce">
            <Trophy className="w-7 h-7" />
          </div>
          <DialogTitle className="text-xl font-extrabold text-emerald-300">
            {loop.headline}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-3 text-left">
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Avoided Consequence
            </span>
            <p className="text-xs text-slate-200">
              {loop.avoidedConsequence}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Gained Confidence & Velocity
            </span>
            <p className="text-xs text-slate-300">
              {loop.gainedConfidence}
            </p>
          </div>

          <p className="text-xs text-center text-slate-400 italic">
            "{loop.rewardMessage}"
          </p>
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 mt-2"
        >
          Claim Streak & Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
};