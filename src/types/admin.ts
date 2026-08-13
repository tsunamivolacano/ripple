export interface AppOverviewMetrics {
  totalRegisteredUsers: number;
  activeUsers7Days: number;
  newUsers7Days: number;
  totalTasksCreated: number;
  completedTasks: number;
  incompleteTasks: number;
  totalStudyMinutesLogged: number;
  timerSessionsCount: number;
  avgSessionDurationMinutes: number;
  calendarEventsCount: number;
  generalTasksCount: number;
}

export interface SubjectStudyBreakdown {
  subject: string;
  studyMinutes: number;
  sessions: number;
}

export interface UserActivityTrend {
  date: string;
  activeUsers: number;
  tasksCompleted: number;
  studyHours: number;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastActivity: string;
  tasksCreated: number;
  tasksCompleted: number;
  studyHours: string;
  timerSessions: number;
  calendarEvents: number;
  role: 'admin' | 'student';
}

export interface AdminAuditEntry {
  id: string;
  adminEmail: string;
  action: 'IMPERSONATE_USER_START' | 'IMPERSONATE_USER_END' | 'VIEW_USER_DETAILS' | 'RENEGOTIATE_OVERRIDE' | 'SETTINGS_CHANGE';
  targetUserId: string;
  targetUserEmail: string;
  timestamp: string;
  details?: string;
}

export interface AdminSystemActivity {
  id: string;
  userEmail: string;
  userName: string;
  eventType: string;
  description: string;
  timestamp: string;
}