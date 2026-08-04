import React from 'react';
import { SplitTimelineScenario } from '@/types/ripple';
import { Clock, AlertOctagon, CheckCircle, Flame, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SplitTimelineProps {
  startNow: SplitTimelineScenario;
  delay2Hr: SplitTimelineScenario;
  onStartNow: () => void;
  onRenegotiate: () => void;
}

export const SplitTimeline: React.FC<SplitTimelineProps> = ({
  startNow,
  delay2Hr,
  onStartNow,
  onRenegotiate
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Split-Timeline Simulator
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">
          Compare future outcomes side-by-side
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Timeline A: Start Now */}
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full filter blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 gap-1 text-[11px]">
                <CheckCircle className="w-3 h-3" />
                TIMELINE A (RECOMMENDED)
              </Badge>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                Stress: {startNow.stressLevel}/10
              </span>
            </div>

            <h4 className="font-bold text-sm text-emerald-200 mb-1">
              {startNow.title}
            </h4>
            <p className="text-xs text-slate-300 mb-3">
              {startNow.outcomeSummary}
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-lg bg-emerald-900/20 border border-emerald-500/20">
                <span className="font-semibold text-emerald-400 block text-[11px]">Academic Protection:</span>
                <span className="text-slate-300 text-[11px]">{startNow.academicImpact}</span>
              </div>

              <div className="p-2 rounded-lg bg-emerald-900/20 border border-emerald-500/20">
                <span className="font-semibold text-emerald-400 block text-[11px]">Social & Energy Benefit:</span>
                <span className="text-slate-300 text-[11px]">{startNow.socialImpact}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={onStartNow}
            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-2"
          >
            <span>Activate Timeline A (Start Now)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Timeline B: Delay 2 Hours */}
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full filter blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 gap-1 text-[11px]">
                <Flame className="w-3 h-3 text-rose-400" />
                TIMELINE B (RISK CASCADE)
              </Badge>
              <span className="text-[10px] font-mono text-rose-400 font-semibold">
                Stress: {delay2Hr.stressLevel}/10
              </span>
            </div>

            <h4 className="font-bold text-sm text-rose-200 mb-1">
              {delay2Hr.title}
            </h4>
            <p className="text-xs text-slate-300 mb-3">
              {delay2Hr.outcomeSummary}
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-lg bg-rose-900/20 border border-rose-500/20">
                <span className="font-semibold text-rose-400 block text-[11px]">Academic Consequence:</span>
                <span className="text-slate-300 text-[11px]">{delay2Hr.academicImpact}</span>
              </div>

              <div className="p-2 rounded-lg bg-rose-900/20 border border-rose-500/20">
                <span className="font-semibold text-rose-400 block text-[11px]">Sleep & Energy Penalty:</span>
                <span className="text-slate-300 text-[11px]">{delay2Hr.energyCost}</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={onRenegotiate}
            className="w-full mt-4 bg-slate-900 border-rose-500/30 hover:bg-rose-950/50 text-rose-300 font-semibold text-xs gap-2"
          >
            <span>Renegotiate Task Buffer</span>
          </Button>
        </div>
      </div>
    </div>
  );
};