import React, { useState } from 'react';
import { useRipple } from '@/context/RippleContext';
import { IntensityMode } from '@/types/ripple';
import { Flame, Shield, Sparkles, AlertTriangle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const IntensitySelector: React.FC = () => {
  const { settings, updateSettings } = useRipple();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<IntensityMode | null>(null);

  const handleSelectMode = (mode: IntensityMode) => {
    if (mode === 'doomsday') {
      setPendingMode(mode);
    } else {
      updateSettings({ intensityMode: mode });
    }
  };

  const confirmDoomsday = () => {
    if (pendingMode) {
      updateSettings({ intensityMode: pendingMode });
      setPendingMode(null);
    }
  };

  const getModeBadge = () => {
    switch (settings.intensityMode) {
      case 'doomsday':
        return (
          <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30 cursor-pointer gap-1.5 px-2.5 py-1">
            <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span className="font-semibold tracking-wide">DOOMSDAY MODE</span>
          </Badge>
        );
      case 'coach':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30 cursor-pointer gap-1.5 px-2.5 py-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold tracking-wide">COACH MODE</span>
          </Badge>
        );
      case 'standard':
      default:
        return (
          <Badge className="bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 cursor-pointer gap-1.5 px-2.5 py-1">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold tracking-wide">STANDARD MODE</span>
          </Badge>
        );
    }
  };

  return (
    <>
      <div data-tour="intensity-mode" onClick={() => setIsOpen(true)}>
        {getModeBadge()}
      </div>

      {/* Selection Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Select AI Prediction Intensity
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Adjust how the AI frames consequence forecasts and scenario urgency based on your focus state.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2">
            {/* Coach Mode */}
            <div
              onClick={() => handleSelectMode('coach')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                settings.intensityMode === 'coach'
                  ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/50'
                  : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-emerald-300 text-sm">Coach Mode</h4>
                  <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">Gentle & Actionable</Badge>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Focuses on supportive guidance, clear step-by-step solutions, and micro-wins without heavy pressure.
                </p>
              </div>
            </div>

            {/* Standard Mode */}
            <div
              onClick={() => handleSelectMode('standard')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                settings.intensityMode === 'standard'
                  ? 'bg-blue-950/40 border-blue-500/60 ring-1 ring-blue-500/50'
                  : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-blue-300 text-sm">Standard Mode</h4>
                  <Badge variant="outline" className="text-[10px] border-blue-500/40 text-blue-400">Balanced Realism</Badge>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Provides objective, realistic forecasts detailing academic and timeline consequences calmly.
                </p>
              </div>
            </div>

            {/* Doomsday Mode */}
            <div
              onClick={() => handleSelectMode('doomsday')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                settings.intensityMode === 'doomsday'
                  ? 'bg-rose-950/40 border-rose-500/60 ring-1 ring-rose-500/50'
                  : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-rose-300 text-sm">Doomsday Mode</h4>
                  <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-400">High Urgency</Badge>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Generates vivid, second-person narrative forecasts designed to shatter deadline blur and compel immediate start.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Safety Confirmation for Doomsday Mode */}
      <Dialog open={!!pendingMode} onOpenChange={() => setPendingMode(null)}>
        <DialogContent className="bg-slate-900 border-rose-500/50 text-white max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Enable Doomsday Mode?
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-xs mt-2">
              Doomsday Mode uses urgent language to highlight severe consequences. If you are experiencing high anxiety or prefer a calm tone, we recommend remaining in <strong>Coach Mode</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl my-2 flex gap-2 items-start">
            <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-rose-200">
              Safety Guard: You can revert back to Coach Mode at any time using the header badge.
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setPendingMode(null)} className="border-slate-700 text-slate-300">
              Cancel
            </Button>
            <Button onClick={confirmDoomsday} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold">
              Activate Doomsday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};