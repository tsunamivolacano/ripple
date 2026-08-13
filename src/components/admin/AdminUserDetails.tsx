import React, { useState, useEffect } from 'react';
import { AdminUserSummary } from '@/types/admin';
import { fetchUserActivityLogs } from '@/services/adminService';
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
  FileText,
  List,
  AlertCircle,
  Calendar,
  User,
  LogOut,
  Settings,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      setIsLoading(true);
      try {
        const logs = await fetchUserActivityLogs(user.id, 50);
        setActivities(logs);
      } catch (error) {
        console.error('Failed to load activity logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivities();
  }, [user.id]);

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
              <h2 className="text-2xl font-extrabold text-white">
                {user.name}
              </h2>
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
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-500 font-mono block text-[10px]">Last Session</span>
              <span className="font-bold text-emerald-400">
                {new Date(user.lastActivity).toLocaleDateString()}
              </span>
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
            <div className="text-2xl font-extrabold font-mono text-emerald-300">
              {user.tasksCreated}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {user.tasksCompleted} marked complete
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
            <div className="text-2xl font-extrabold font-mono text-indigo-300">
              {user.studyHours} hrs
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {user.timerSessions} focus sprint sessions
            </p>
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
            <div className="text-2xl font-extrabold font-mono text-amber-300">
              {user.calendarEvents} Events
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Timetable classes & task deadlines
            </p>
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
            <div className="text-2xl font-extrabold font-mono text-rose-300">
              28 / 100
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Low compounding debt score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deep-Dive Activity History Feed */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          Recent Account Events & Product Analytics
        </h3>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            Loading activity logs...
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3 text-xs">
            {activities.map((act, idx) => {
              const actionInfo = {
                'TASK_CREATE': { label: 'Task Created', icon: List, color: 'text-emerald-400' },
                'TASK_UPDATE': { label: 'Task Updated', icon: List, color: 'text-blue-400' },
                'TASK_DELETE': { label: 'Task Deleted', icon: List, color: 'text-rose-400' },
                'TASK_COMPLETE': { label: 'Task Completed', icon: CheckCircle2, color: 'text-emerald-400' },
                'TASK_RENEGOTIATE': { label: 'Task Renegotiated', icon: AlertCircle, color: 'text-amber-400' },
                'STUDY_LOG_ADD': { label: 'Study Log Added', icon: BookOpen, color: 'text-indigo-400' },
                'STUDY_LOG_DELETE': { label: 'Study Log Deleted', icon: BookOpen, color: 'text-rose-400' },
                'SLOT_ADD': { label: 'Class Added', icon: Calendar, color: 'text-emerald-400' },
                'SLOT_UPDATE': { label: 'Class Updated', icon: Calendar, color: 'text-blue-400' },
                'SLOT_DELETE': { label: 'Class Deleted', icon: Calendar, color: 'text-rose-400' },
                'EVIDENCE_LOG': { label: 'Evidence Logged', icon: CheckCircle2, color: 'text-amber-400' },
                'USER_LOGIN': { label: 'User Login', icon: User, color: 'text-emerald-400' },
                'USER_SIGNUP': { label: 'User Signup', icon: User, color: 'text-blue-400' },
                'USER_LOGOUT': { label: 'User Logout', icon: LogOut, color: 'text-slate-400' },
                'SETTINGS_UPDATE': { label: 'Settings Updated', icon: Settings, color: 'text-amber-400' }
              }[act.eventType] || {
                label: act.eventType,
                icon: Activity,
                color: 'text-slate-400'
              };

              const Icon = actionInfo.icon;

              return (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${actionInfo.color} bg-slate-900 border border-slate-800`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white">{act.userName}</span>
                      <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                        {act.userEmail}
                      </Badge>
                    </div>
                    <div className="text-slate-300">
                      <span className="font-semibold text-slate-200">{actionInfo.label}</span>
                      {act.description && <span className="ml-2 text-slate-400">• {act.description}</span>}
                    </div>
                  </div>
                  <span className="font-mono text-slate-500 text-[10px] whitespace-nowrap">
                    {new Date(act.timestamp).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            No activity logged yet. Users will appear here as they interact with the app.
          </div>
        )}
      </div>
    </div>
  );
}