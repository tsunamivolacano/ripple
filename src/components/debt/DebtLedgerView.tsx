import React from 'react';
import { useRipple } from '@/context/RippleContext';
import { 
  TrendingDown, 
  Sparkles,
  ShieldCheck,
  AlertCircle,
  BookOpen,
  Target,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const DebtLedgerView: React.FC = () => {
  const { debt, studyLogs, settings } = useRipple();

  const getRiskBadge = () => {
    if (debt.compoundingScore > 70) {
      return <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/50">Severe Backlog Deficit</Badge>;
    } else if (debt.compoundingScore > 40) {
      return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/50">Moderate Study Deficit</Badge>;
    } else {
      return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/50">Healthy Buffer & Flow</Badge>;
    }
  };

  const dailyTarget = debt.dailyTargetHours || settings.dailyStudyTargetHours || 3.0;
  const studyShortfall = debt.studyDeficitHours ?? 0;
  const recommendedTomorrow = debt.recommendedNextDayTargetHours || dailyTarget;

  return (
    <div data-tour="debt-section" className="space-y-6">
      {/* Top Banner Overview */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 border border-purple-500/30 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-extrabold text-white">
                Procrastination & Study Debt Ledger
              </h2>
              {getRiskBadge()}
            </div>
            <p className="text-xs text-slate-400">
              Tracks accumulated unfinished study time, daily goal shortfalls, and task delays. <em>(Note: This is study time debt, not financial debt—it decreases automatically when you study extra!)</em>
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
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Clock className="w-4 h-4 text-rose-400" />
            Total Study Hours Behind Goal
          </span>
          <h3 className="text-3xl font-extrabold text-rose-400 font-mono">
            {debt.totalHoursBehind} hrs
          </h3>
          <p className="text-[11px] text-slate-500">
            Includes {studyShortfall}h study deficit from past days + pending urgent task backlog.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Missed / Overdue Deadlines
          </span>
          <h3 className="text-3xl font-extrabold text-amber-400 font-mono">
            {debt.missedDeadlinesCount}
          </h3>
          <p className="text-[11px] text-slate-500">
            Tasks past due or in critical doomsday buffer territory.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Target className="w-4 h-4 text-indigo-400" />
            Next-Day Adaptive Study Target
          </span>
          <h3 className="text-3xl font-extrabold text-indigo-400 font-mono">
            {recommendedTomorrow} hrs
          </h3>
          <p className="text-[11px] text-slate-500">
            AI-calibrated target: base ({dailyTarget}h) + gentle deficit recovery.
          </p>
        </div>
      </div>

      {/* 7-Day Shortfall Trend Chart */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          7-Day Shortfall Accumulation Trend
        </h3>

        <div className="h-40 flex items-end justify-between gap-3 pt-4 px-2 border-b border-slate-800">
          {debt.weeklyDebtTrend.map((item, index) => {
            const heightPercentage = Math.min(100, (item.debtHours / 5.0) * 100);
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
          Recommended Deficit Recovery Actions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <h4 className="font-bold text-emerald-300">1. Run a 25-min Focus Sprint</h4>
            <p className="text-slate-400">
              Each completed focus block is saved to Supabase and immediately shaves off your study shortfall.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <h4 className="font-bold text-indigo-300">2. Aim for {recommendedTomorrow}h Study Tomorrow</h4>
            <p className="text-slate-400">
              Gradually making up {((recommendedTomorrow - dailyTarget)).toFixed(1)}h extra study time resets your compounding score safely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};