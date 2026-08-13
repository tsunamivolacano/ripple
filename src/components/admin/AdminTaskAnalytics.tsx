import React from 'react';
import { AppOverviewMetrics } from '@/types/admin';
import { CheckCircle2, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdminTaskAnalyticsProps {
  metrics: AppOverviewMetrics;
}

export const AdminTaskAnalytics: React.FC<AdminTaskAnalyticsProps> = ({ metrics }) => {
  const rate = Math.round((metrics.completedTasks / metrics.totalTasksCreated) * 100);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-extrabold text-white">Task Completion Analytics</h2>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
            {rate}% Completion Rate
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Total Tasks Created</span>
            <span className="text-2xl font-extrabold font-mono text-white">{metrics.totalTasksCreated}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Completed On-Time</span>
            <span className="text-2xl font-extrabold font-mono text-emerald-400">{metrics.completedTasks}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Incomplete / Active</span>
            <span className="text-2xl font-extrabold font-mono text-amber-400">{metrics.incompleteTasks}</span>
          </div>
        </div>
      </div>
    </div>
  );
};