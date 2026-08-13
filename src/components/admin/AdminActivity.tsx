import React, { useState, useEffect } from 'react';
import { Activity, Clock, User, List, BookOpen, Calendar, Settings, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchUserActivityLogs } from '@/services/adminService';

interface ActivityLogEntry {
  id: string;
  userEmail: string;
  userName: string;
  eventType: string;
  description: string;
  timestamp: string;
}

const ACTION_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
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
};

export const AdminActivity: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      setIsLoading(true);
      try {
        const logs = await fetchUserActivityLogs();
        setActivities(logs);
      } catch (error) {
        console.error('Failed to load activity logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivities();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Activity className="w-5 h-5 text-purple-400" />
        <h2 className="text-xl font-extrabold text-white">Live System Activity Stream</h2>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-400">
          Loading activity logs...
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-3 text-xs">
          {activities.map((act, idx) => {
            const actionInfo = ACTION_LABELS[act.eventType] || { 
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
        <div className="p-8 text-center text-slate-500">
          No activity logged yet. Users will appear here as they interact with the app.
        </div>
      )}
    </div>
  );
}