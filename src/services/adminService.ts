import { supabase } from '@/integrations/supabase/client';
import { AppOverviewMetrics, SubjectStudyBreakdown, UserActivityTrend, AdminUserSummary, AdminAuditEntry, AdminSystemActivity } from '@/types/admin';

export const AUTHORIZED_ADMIN_EMAIL = 'shanniddhya@gmail.com';

export function isAuthorizedAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
}

export async function verifyAdminAccess(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Check if user is the authorized admin
    if (user.email?.toLowerCase().trim() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      return true;
    }
    
    // Check if user has admin role in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    return profile?.role === 'admin';
  } catch (e) {
    console.warn('[adminService] Admin verification failed:', e);
    return false;
  }
}

// Fetch Admin Overview Data - REAL DATA FROM SUPABASE
export async function fetchAdminOverview(): Promise<{
  metrics: AppOverviewMetrics;
  subjectBreakdown: SubjectStudyBreakdown[];
  userActivityTrend: UserActivityTrend[];
}> {
  const isAdmin = await verifyAdminAccess();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }

  try {
    // Get all users from auth
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const allUsers = usersData || [];
    
    // Get profiles for additional info
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*');
    
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    // Calculate metrics
    const totalRegisteredUsers = allUsers.length;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    
    const activeUsersCount = allUsers.filter(u => 
      u.last_sign_in_at && new Date(u.last_sign_in_at) >= sevenDaysAgo
    ).length;
    const newUsersCount = allUsers.filter(u => 
      new Date(u.created_at) >= sevenDaysAgo
    ).length;
    
    // Get real task data
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*');
    
    const totalTasksCreated = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
    const incompleteTasks = totalTasksCreated - completedTasks;
    
    // Get real calendar events
    const { data: calendarEvents } = await supabase
      .from('calendar_events')
      .select('*');
    
    // Get study logs for study minutes
    const { data: studyLogs } = await supabase
      .from('study_logs')
      .select('duration_minutes');
    
    const totalStudyMinutesLogged = studyLogs?.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;
    const timerSessionsCount = studyLogs?.filter(l => l.source === 'timer').length || 0;
    const avgSessionDurationMinutes = timerSessionsCount > 0 ? Math.round(totalStudyMinutesLogged / timerSessionsCount) : 0;
    
    // Subject breakdown from study logs
    const { data: studyLogsWithSubject } = await supabase
      .from('study_logs')
      .select('subject, duration_minutes');
    
    const subjectMap = new Map<string, { minutes: number; sessions: number }>();
    studyLogsWithSubject?.forEach(log => {
      const existing = subjectMap.get(log.subject) || { minutes: 0, sessions: 0 };
      subjectMap.set(log.subject, {
        minutes: existing.minutes + (log.duration_minutes || 0),
        sessions: existing.sessions + 1
      });
    });
    
    const subjectBreakdown: SubjectStudyBreakdown[] = Array.from(subjectMap.entries())
      .map(([subject, data]) => ({ subject, studyMinutes: data.minutes, sessions: data.sessions }))
      .sort((a, b) => b.studyMinutes - a.studyMinutes);
    
    // User activity trend (last 7 days)
    const userActivityTrend: UserActivityTrend[] = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 3600 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      // Count active users (users who had activity this day)
      const { data: dayLogs } = await supabase
        .from('user_logs')
        .select('user_id')
        .gte('timestamp', dayStart.toISOString())
        .lte('timestamp', dayEnd.toISOString());
      
      const activeUsers = new Set(dayLogs?.map(l => l.user_id) || []).size;
      
      // Count completed tasks this day
      const { data: dayTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('status', 'completed')
        .gte('completed_at', dayStart.toISOString())
        .lte('completed_at', dayEnd.toISOString());
      
      // Study hours this day
      const { data: dayStudy } = await supabase
        .from('study_logs')
        .select('duration_minutes')
        .gte('logged_at', dayStart.toISOString())
        .lte('logged_at', dayEnd.toISOString());
      
      const studyHours = (dayStudy?.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0) / 60;
      
      userActivityTrend.push({
        date: days[date.getDay()],
        activeUsers,
        tasksCompleted: dayTasks?.length || 0,
        studyHours: Math.round(studyHours * 10) / 10
      });
    }
    
    return {
      metrics: {
        totalRegisteredUsers,
        activeUsers7Days: activeUsersCount,
        newUsers7Days: newUsersCount,
        totalTasksCreated,
        completedTasks,
        incompleteTasks,
        totalStudyMinutesLogged,
        timerSessionsCount,
        avgSessionDurationMinutes,
        calendarEventsCount: calendarEvents?.length || 0,
        generalTasksCount: tasks?.filter(t => t.category === 'personal').length || 0
      },
      subjectBreakdown,
      userActivityTrend
    };
  } catch (e) {
    console.error('[adminService] Failed to fetch admin overview:', e);
    throw e;
  }
}

// Fetch All Registered Users List - REAL DATA FROM SUPABASE
export async function fetchAdminUsersList(): Promise<AdminUserSummary[]> {
  const isAdmin = await verifyAdminAccess();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }

  try {
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const allUsers = usersData || [];
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*');
    
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    // Get task counts per user
    const { data: tasks } = await supabase
      .from('tasks')
      .select('user_id, status');
    
    const taskCounts = new Map<string, { created: number; completed: number }>();
    tasks?.forEach(task => {
      const existing = taskCounts.get(task.user_id) || { created: 0, completed: 0 };
      existing.created++;
      if (task.status === 'completed') existing.completed++;
      taskCounts.set(task.user_id, existing);
    });
    
    // Get calendar events per user
    const { data: calendarEvents } = await supabase
      .from('calendar_events')
      .select('user_id');
    
    const calendarCounts = new Map<string, number>();
    calendarEvents?.forEach(event => {
      calendarCounts.set(event.user_id, (calendarCounts.get(event.user_id) || 0) + 1);
    });
    
    // Get study logs per user
    const { data: studyLogs } = await supabase
      .from('study_logs')
      .select('user_id, duration_minutes, source');
    
    const studyStats = new Map<string, { minutes: number; timerSessions: number }>();
    studyLogs?.forEach(log => {
      const existing = studyStats.get(log.user_id) || { minutes: 0, timerSessions: 0 };
      existing.minutes += log.duration_minutes || 0;
      if (log.source === 'timer') existing.timerSessions++;
      studyStats.set(log.user_id, existing);
    });
    
    // Get last activity per user
    const { data: userLogs } = await supabase
      .from('user_logs')
      .select('user_id, timestamp')
      .order('timestamp', { ascending: false });
    
    const lastActivityMap = new Map<string, string>();
    userLogs?.forEach(log => {
      if (!lastActivityMap.has(log.user_id)) {
        lastActivityMap.set(log.user_id, log.timestamp);
      }
    });
    
    return allUsers.map(u => {
      const profile = profileMap.get(u.id);
      const taskCount = taskCounts.get(u.id) || { created: 0, completed: 0 };
      const studyStat = studyStats.get(u.id) || { minutes: 0, timerSessions: 0 };
      const lastActivity = lastActivityMap.get(u.id) || u.last_sign_in_at || u.created_at;
      
      return {
        id: u.id,
        email: u.email || 'Unknown',
        name: profile?.name || u.user_metadata?.first_name 
          ? `${u.user_metadata.first_name} ${u.user_metadata.last_name || ''}`.trim()
          : (u.email?.split('@')[0] || `User`),
        createdAt: u.created_at,
        lastActivity,
        tasksCreated: taskCount.created,
        tasksCompleted: taskCount.completed,
        studyHours: (studyStat.minutes / 60).toFixed(1),
        timerSessions: studyStat.timerSessions,
        calendarEvents: calendarCounts.get(u.id) || 0,
        role: profile?.role || (u.email?.toLowerCase().trim() === AUTHORIZED_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'student')
      };
    });
  } catch (e) {
    console.error('[adminService] Failed to fetch users list:', e);
    throw e;
  }
}

// Fetch User Activity Logs - REAL DATA FROM SUPABASE
export async function fetchUserActivityLogs(userId?: string, limit: number = 50): Promise<AdminSystemActivity[]> {
  const isAdmin = await verifyAdminAccess();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }

  try {
    let query = supabase
      .from('user_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get user emails for mapping
    const userIds = [...new Set(data?.map(l => l.user_id) || [])];
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const userMap = new Map(usersData?.map(u => [u.id, u.email]) || []);
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);
    const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || {});
    
    return data?.map(log => ({
      id: log.id,
      userEmail: userMap.get(log.user_id) || log.user_id,
      userName: profileMap.get(log.user_id) || log.event_name || 'Unknown',
      eventType: log.event_type,
      description: log.message || '',
      timestamp: log.timestamp
    })) || [];
  } catch (e) {
    console.error('[adminService] Failed to fetch activity logs:', e);
    throw e;
  }
}

// Log Audit Action - STORE IN SUPABASE
export async function logAdminAuditAction(
  action: AdminAuditEntry['action'],
  targetUserId: string,
  targetUserEmail: string,
  details?: string
): Promise<void> {
  const isAdmin = await verifyAdminAccess();
  if (!isAdmin) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase
      .from('admin_audit_logs')
      .insert({
        admin_id: user?.id,
        admin_email: user?.email || AUTHORIZED_ADMIN_EMAIL,
        action,
        target_user_id: targetUserId,
        target_user_email: targetUserEmail,
        details: details || `Admin inspected account for ${targetUserEmail}`,
        created_at: new Date().toISOString()
      });
  } catch (e) {
    console.warn('[adminService] Audit log write failed:', e);
  }
}

// Subscribe to real-time updates for admin dashboard
export function subscribeToAdminUpdates(
  onUserChange: () => void,
  onTaskChange: () => void,
  onCalendarChange: () => void,
  onLogChange: () => void
) {
  const profilesChannel = supabase
    .channel('admin-profiles')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, onUserChange)
    .subscribe();

  const tasksChannel = supabase
    .channel('admin-tasks')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, onTaskChange)
    .subscribe();

  const calendarChannel = supabase
    .channel('admin-calendar')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, onCalendarChange)
    .subscribe();

  const logsChannel = supabase
    .channel('admin-logs')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_logs' }, onLogChange)
    .subscribe();

  return () => {
    supabase.removeChannel(profilesChannel);
    supabase.removeChannel(tasksChannel);
    supabase.removeChannel(calendarChannel);
    supabase.removeChannel(logsChannel);
  };
}