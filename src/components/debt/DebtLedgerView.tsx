import React from 'react';
import { useRipple } from '@/context/RippleContext';
import { 
  TrendingDown, 
  Flame, 
  AlertOctagon, 
  RotateCcw, 
  CheckCircle2, 
  Zap, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const DebtLedgerView: React.FC = () => {
  const { debt, updateSettings } = useRipple();

  const getRiskBadge = () => {
    if (debt.compoundingScore > 70) {
      return <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/50">Severe Debt Compounding</Badge>;
    } else if (debt.compoundingScore > 40) {
      return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/50">Moderate Task Backlog</Badge>;
    } else {
      return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/50">Healthy Buffer Flow</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 border border-purple-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-extrabold text-white">
                Procrastination Debt Ledger
              </h2>
              {getRiskBadge()}
            </div>
            <p className="text-xs text-slate-400">
              Tracks the hidden, compounding cost of delayed tasks and late night all-nighters.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Compounding Score</span>
              <div className="text-2xl font-extrabold font-mono text-purple-300">{debt.compoundingScore} / 100</div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">On-Time Streak</span>
              <div className="text-2xl font-extrabold font-mono text-emerald-400">{debt.streakDays} Days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400">Total Hours Behind Schedule</span>
          <h3 className="text-3xl font-extrabold text-rose-400 font-mono">
            {debt.totalHoursBehind} hrs
          </h3>
          <p className="text-[11px] text-slate-500">
            Estimated extra focused effort required to clear task debt.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400">Missed Deadlines Count</span>
          <h3 className="text-3xl font-extrabold text-amber-400 font-mono">
            {debt.missedDeadlinesCount}
          </h3>
          <p className="text-[11px] text-slate-500">
            Historical unsubmitted or severely delayed tasks.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400">Velocity Calibration Multiplier</span>
          <h3 className="text-3xl font-extrabold text-indigo-400 font-mono">
            1.15x
          </h3>
          <p className="text-[11px] text-slate-500">
            AI automatically adjusts estimates (you take 15% longer than planned).
          </p>
        </div>
      </div>

      {/* Debt Trend Bar Chart Representation */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          7-Day Debt Accumulation Trend
        </h3>

        <div className="h-40 flex items-end justify-between gap-3 pt-4 px-2 border-b border-slate-800">
          {debt.weeklyDebtTrend.map((item, index) => {
            const heightPercentage = Math.min(100, (item.debtHours / 6.0) * 100);
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] font-mono text-purple-300 font-semibold">{item.debtHours}h</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-purple-900 via-rose-600 to-rose-400 transition-all duration-500"
                  style={{ height: `${Math.max(10, heightPercentage)}%` }}
                />
                <span className="text-[10px] font-medium text-slate-400 uppercase">{item.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recovery Strategy Actions */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Recommended Debt Recovery Actions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <h4 className="font-bold text-emerald-300">1. Execute a 50-Minute Emergency Catch-Up Sprint</h4>
            <p className="text-slate-400">
              Clear low-hanging micro-tasks to immediately lower your compounding debt score by -15 pts.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <h4 className="font-bold text-blue-300">2. Enable Coach Intensity Mode</h4>
            <p className="text-slate-400">
              Switch AI framing to supportive micro-steps if feeling overwhelmed by high task debt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};