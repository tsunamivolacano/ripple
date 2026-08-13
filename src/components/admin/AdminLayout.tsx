import React, { useState, useEffect } from 'react';
import { 
  AppOverviewMetrics, 
  SubjectStudyBreakdown, 
  UserActivityTrend, 
  AdminUserSummary 
} from '@/types/admin';
import { 
  fetchAdminOverview, 
  fetchAdminUsersList, 
  logAdminAuditAction,
  AUTHORIZED_ADMIN_EMAIL,
  fetchUserActivityLogs
} from '@/services/adminService';
import { AdminOverview } from './AdminOverview';
import { AdminUsersList } from './AdminUsersList';
import { AdminUserDetails } from './AdminUserDetails';
import { AdminStudyAnalytics } from './AdminStudyAnalytics';
import { AdminTaskAnalytics } from './AdminTaskAnalytics';
import { AdminActivity } from './AdminActivity';
import { AdminAuditLog } from './AdminAuditLog';
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  CheckCircle2, 
  Activity, 
  ShieldCheck, 
  LogOut, 
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdminLayoutProps {
  onExitAdmin: () => void;
  onImpersonateUser: (user: AdminUserSummary) => void;
}

export type AdminTab = 'dashboard' | 'users' | 'user_details' | 'study' | 'tasks' | 'activity' | 'audit';

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  onExitAdmin,
  onImpersonateUser
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);

  const [metrics, setMetrics] = useState<AppOverviewMetrics | null>(null);
  const [subjectBreakdown, setSubjectBreakdown] = useState<SubjectStudyBreakdown[]>([]);
  const [userActivityTrend, setUserActivityTrend] = useState<UserActivityTrend[]>([]);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const overview = await fetchAdminOverview();
      const userList = await fetchAdminUsersList();

      setMetrics(overview.metrics);
      setSubjectBreakdown(overview.subjectBreakdown);
      setUserActivityTrend(overview.userActivityTrend);
      setUsers(userList);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleSelectUser = (user: AdminUserSummary) => {
    setSelectedUser(user);
    setActiveTab('user_details');
    logAdminAuditAction('VIEW_USER_DETAILS', user.id, user.email, `Inspected user details for ${user.name}`);
  };

  const handleStartImpersonating = (user: AdminUserSummary) => {
    logAdminAuditAction('IMPERSONATE_USER_START', user.id, user.email, `Started Support Mode / Viewing as user ${user.email}`);
    onImpersonateUser(user);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      {/* Distinct Top Admin Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-purple-500/30 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-rose-600 flex items-center justify-center shadow-lg shadow-purple-950">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-lg text-white tracking-tight">
                    RIPPLE Owner Console
                  </h1>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[10px] font-mono px-2 py-0.5">
                    Authorized Admin
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  {AUTHORIZED_ADMIN_EMAIL}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onExitAdmin}
                className="border-slate-700 bg-slate-950 text-slate-300 hover:text-white text-xs gap-1.5 h-9"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Student App
              </Button>
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <nav className="flex space-x-2 border-t border-slate-800/80 pt-1 pb-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'users', label: 'Registered Users', icon: Users },
              { id: 'study', label: 'Study Analytics', icon: BookOpen },
              { id: 'tasks', label: 'Task Analytics', icon: CheckCircle2 },
              { id: 'activity', label: 'Activity Stream', icon: Activity },
              { id: 'audit', label: 'Audit Trail', icon: ShieldCheck }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-20">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Loading Admin Security Data...
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && metrics && (
              <AdminOverview
                metrics={metrics}
                subjectBreakdown={subjectBreakdown}
                userActivityTrend={userActivityTrend}
              />
            )}

            {activeTab === 'users' && (
              <AdminUsersList
                users={users}
                onSelectUser={handleSelectUser}
                onImpersonateUser={handleStartImpersonating}
              />
            )}

            {activeTab === 'user_details' && selectedUser && (
              <AdminUserDetails
                user={selectedUser}
                onBack={() => setActiveTab('users')}
                onImpersonateUser={handleStartImpersonating}
              />
            )}

            {activeTab === 'study' && (
              <AdminStudyAnalytics subjectBreakdown={subjectBreakdown} />
            )}

            {activeTab === 'tasks' && metrics && (
              <AdminTaskAnalytics metrics={metrics} />
            )}

            {activeTab === 'activity' && <AdminActivity />}

            {activeTab === 'audit' && <AdminAuditLog />}
          </>
        )}
      </main>
    </div>
  );
};