import React from 'react';
import { 
  AppOverviewMetrics, 
  SubjectStudyBreakdown, 
  UserActivityTrend 
} from '@/types/admin';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  CalendarDays, 
  TrendingUp, 
  Sparkles, 
  BarChart2, 
  Zap,
  BookOpen,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AdminOverviewProps {
  metrics: AppOverviewMetrics;
  subjectBreakdown: SubjectStudyBreakdown[];
  userActivityTrend: UserActivityTrend[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  metrics,
  subjectBreakdown,
  userActivityTrend
}) => {
  const totalHours = (metrics.totalStudyMinutesLogged / 60).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950 border border-purple-500/30 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 gap-1.5 py-1 px-3">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              Owner Command Center
            </Badge>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            App-Wide Performance Metrics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry on user engagement, study velocity, and task completion rates.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Registered</span>
            <div className="text-2xl font-extrabold font-mono text-purple-300">{metrics.totalRegisteredUsers} Users</div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 border-slate-800 text-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Users & Retention
            </CardTitle>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-white">{metrics.totalRegisteredUsers}</div>
            <p className="text-[11px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> {metrics.activeUsers7Days} Active in past 7 days (+{metrics.newUsers7Days} new)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tasks & Completion Velocity
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-emerald-300">{metrics.completedTasks} / {metrics.totalTasksCreated}</div>
            <p className="text-[11px] text-slate-400 mt-1">
              {Math.round((metrics.completedTasks / metrics.totalTasksCreated) * 100)}% overall completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Independent Study Logged
            </CardTitle>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-indigo-300">{totalHours} Hours</div>
            <p className="text-[11px] text-slate-400 mt-1">
              {metrics.timerSessionsCount} timer sprints completed (Avg: {metrics.avgSessionDurationMinutes}m)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Calendar & Timetable Slots
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CalendarDays className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-amber-300">{metrics.calendarEventsCount} Events</div>
            <p className="text-[11px] text-slate-400 mt-1">
              {metrics.generalTasksCount} flexible general activities tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Trend */}
        <Card className="bg-slate-900/80 border-slate-800 text-white rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Weekly User Engagement & Study Hours
            </h3>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userActivityTrend}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="studyHours" stroke="#a855f7" fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Subject Study Breakdown */}
        <Card className="bg-slate-900/80 border-slate-800 text-white rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              Subject-Wise Study Distribution (Minutes)
            </h3>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectBreakdown}>
                <XAxis dataKey="subject" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="studyMinutes" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};