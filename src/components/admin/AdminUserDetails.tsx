import React from 'react';
import { AdminUserSummary } from '@/types/admin';
import {
  ArrowLeft,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  CalendarDays,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminUserDetailsProps {
  user: AdminUserSummary;
  onBack: () => void;
  onImpersonateUser: (user: AdminUserSummary) => void;
}

export const AdminUserDetails: React.FC<AdminUserDetailsProps> = ({
  user,
  onBack,
  onImpersonateUser
}) => {
  const completionRate =
    user.tasksCreated > 0 ? Math.round((user.tasksCompleted / user.tasksCreated) * 100) : 0;

  const isActiveRecent =
    user.lastActivity && new Date(user.lastActivity) >= new Date(Date.now() - 7 * 86400000);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-slate-800 bg-slate-900 text-slate-300 hover:text-white text-xs gap-1.5 h-9"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to User List
        </Button>

        <Button
          onClick={() => onImpersonateUser(user)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs gap-1.5 h-9 shadow-lg shadow-purple-950"
        >
          <ExternalLink className="w-4 h-4" />
          View as User (Impersonate Support Mode)
        </Button>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-extrabold text-white">{user.name}</h2>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">
                {user.role}
              </Badge>
            </div>
            <p className="text-xs font-mono text-slate-400">{user.email}</p>
          </div>

          <div className="flex items-center gap-4 bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 font-mono block text-[10px]">Registered On</span>
              <span className="font-bold text-slate-200">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-500 font-mono block text-[10px]">Last Session</span>
              <span className="font-bold text-emerald-400">
                {user.lastActivity ? new Date(user.lastActivity).toLocaleDateString() : "Never"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 border-slate-800 text-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Tasks
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-emerald-300">{user.tasksCreated}</div>
            <p className="text-[11px] text-slate-400 mt-1">
              {user.tasksCompleted} marked 100% complete ({completionRate}% rate)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Study Time Logged
            </CardTitle>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-indigo-300">{user.studyHours} hrs</div>
            <p className="text-[11px] text-slate-400 mt-1">{user.timerSessions} focus sprint sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Calendar Activity
            </CardTitle>
            <CalendarDays className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-amber-300">{user.calendarEvents} Events</div>
            <p className="text-[11px] text-slate-400 mt-1">Timetable classes and task deadlines</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Activity Status
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {isActiveRecent ? "Active" : "Inactive past 7 days"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {user.lastActivity
                ? `Last active ${new Date(user.lastActivity).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                : "No recorded activity yet"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};