import React from 'react';
import { AdminUserSummary } from '@/types/admin';
import { 
  ArrowLeft, 
  ExternalLink, 
  UserCheck, 
  BookOpen, 
  CheckCircle2, 
  CalendarDays, 
  Clock, 
  ShieldCheck,
  TrendingUp,
  FileText
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
  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
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

      {/* User Overview Profile Card */}
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
              <span className="font-bold text-slate-200">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-500 font-mono block text-[10px]">Last Session</span>
              <span className="font-bold text-emerald-400">{new Date(user.lastActivity).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Stats Grid */}
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
            <p className="text-[11px] text-slate-400 mt-1">{user.tasksCompleted} marked 100% complete</p>
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
            <p className="text-[11px] text-slate-400 mt-1">Timetable classes & task deadlines</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Procrastination Risk
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-rose-300">28 / 100</div>
            <p className="text-[11px] text-slate-400 mt-1">Low compounding debt score</p>
          </CardContent>
        </Card>
      </div>

      {/* Deep-Dive Activity History Feed */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          Recent Account Events & Product Analytics
        </h3>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Completed 25-min Focus Sprint in Physics</span>
              <span className="text-[11px] text-slate-400">Wave Optics & Double Slit Practice</span>
            </div>
            <span className="font-mono text-slate-500 text-[10px]">Today, 10:15 AM</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-emerald-400 block">Marked Task "Chemistry Diagram" Completed</span>
              <span className="text-[11px] text-slate-400">Completed 2 hours before submission deadline</span>
            </div>
            <span className="font-mono text-slate-500 text-[10px]">Yesterday, 6:30 PM</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-amber-300 block">Logged Evidence Case File Entry</span>
              <span className="text-[11px] text-slate-400">Rating: 5 Stars (Prediction matched outcome)</span>
            </div>
            <span className="font-mono text-slate-500 text-[10px]">2 days ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};