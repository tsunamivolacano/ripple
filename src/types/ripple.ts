export type StrictnessTag = 
  | 'COLD_CALL' 
  | 'NOTEBOOK_CHECK' 
  | 'ATTENDANCE_STRICT' 
  | 'PUBLIC_SCOLD' 
  | 'QUIET_TALK' 
  | 'LENIENT';

export type StakesTag = 
  | 'GRADED_QUIZ' 
  | 'ATTENDANCE' 
  | 'PRESENTATION' 
  | 'NOTEBOOK_COPY' 
  | 'LAB_PRACTICAL' 
  | 'HOMEWORK';

export type IntensityMode = 'coach' | 'standard' | 'doomsday';

export type TaskStatus = 'manageable' | 'tight' | 'critical' | 'too_late' | 'completed' | 'renegotiated';

export type TaskType = 
  | 'essay' 
  | 'lab_report' 
  | 'reading' 
  | 'problem_set' 
  | 'revision' 
  | 'project' 
  | 'personal' 
  | 'meeting' 
  | 'appointment' 
  | 'reminder' 
  | 'event' 
  | 'chore' 
  | 'self_study';

export type TaskCategory = 'academic' | 'personal';

export type ReminderTiming = 'exact' | '5m' | '15m' | '30m' | '1h' | '1d' | 'overdue';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

export interface RecurrenceRule {
  type: RecurrenceType;
  interval?: number; // e.g. 1 = every week, 2 = every 2 weeks
  daysOfWeek?: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[];
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD optional cutoff
  count?: number;     // max occurrences
}

export interface TimetableSlot {
  id: string;
  subject: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  room: string;
  teacherName: string;
  strictnessTag: StrictnessTag;
  stakesTag: StakesTag;
  weight: number; // 1 to 100%
  reminders?: ReminderTiming[];
  recurrence?: RecurrenceRule;
  specificDate?: string; // YYYY-MM-DD for single-occurrence / only-this-week class
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  slotId?: string;
  hasDeadline?: boolean;
  dueDate?: string; // ISO String in UTC
  estimatedHours: number;
  completionPercentage: number;
  taskType: TaskType;
  category?: TaskCategory;
  status: TaskStatus;
  reminders?: ReminderTiming[];
  recurrence?: RecurrenceRule;
  createdAt: string;
  completedAt?: string;
  renegotiatedCount?: number;
  lastRenegotiated?: string;
}

export interface DomainConsequence {
  domain: 'Academic' | 'Social' | 'Physical' | 'Financial' | 'Emotional' | 'Long-term';
  severity: 'low' | 'medium' | 'high' | 'severe';
  title: string;
  description: string;
  impactScore: number; // 0 - 100
}

export interface SplitTimelineScenario {
  title: string;
  timeframe: string;
  outcomeSummary: string;
  stressLevel: number; // 1 - 10
  academicImpact: string;
  socialImpact: string;
  energyCost: string;
  actionableStep: string;
}

export interface ConsequenceForecast {
  academic: DomainConsequence;
  social: DomainConsequence;
  physical: DomainConsequence;
  financial: DomainConsequence;
  emotional: DomainConsequence;
  longTerm: DomainConsequence;
  cinematicScene: string;
  startNowTimeline: SplitTimelineScenario;
  delay2HrTimeline: SplitTimelineScenario;
  positiveCounterLoop: {
    headline: string;
    avoidedConsequence: string;
    gainedConfidence: string;
    rewardMessage: string;
  };
}

export interface EvidenceEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  subject: string;
  teacherName: string;
  predictedScenario: string;
  actualOutcome: string;
  wasOnTime: boolean;
  accuracyRating: number; // 1-5
  dateLogged: string;
  userNotes?: string;
}

export interface StudyLog {
  id: string;
  subject: string;
  durationMinutes: number;
  topic?: string;
  loggedAt: string; // ISO string
  source: 'manual' | 'timer';
}

export interface ProcrastinationDebt {
  totalHoursBehind: number;
  missedDeadlinesCount: number;
  streakDays: number;
  compoundingScore: number; // calculated metric
  weeklyDebtTrend: { day: string; debtHours: number }[];
}

export interface NotificationSettings {
  taskRemindersEnabled: boolean;
  classRemindersEnabled: boolean;
  defaultTaskReminders: ReminderTiming[];
  defaultClassReminders: ReminderTiming[];
}

export interface ScheduledNotification {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'task' | 'class' | 'overdue';
  title: string;
  body: string;
  triggerTime: string; // ISO UTC
  reminderOffset: ReminderTiming;
  status: 'pending' | 'sent' | 'cancelled';
  createdAt: string;
}

export interface UserSettings {
  intensityMode: IntensityMode;
  isMinorProfile: boolean;
  weeklyDigestOnly: boolean;
  personalVelocityMultiplier: number; // e.g. 1.2x
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  timestamp: string;
  event_type: string;
  event_name: string;
  message: string;
  source: string;
  route: string;
  request_id: string;
  session_id: string;
  task_id: string;
  metadata: any;
  prompt: string;
  response: string;
  model: string;
  provider: string;
  status_code: number;
  duration_ms: number;
  error_message: string;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  start_time: string;
  end_time: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UserLog {
  id: string;
  user_id: string;
  timestamp: string;
  event_type: string;
  event_name: string;
  message: string;
  source: string;
  route: string;
  request_id: string;
  session_id: string;
  task_id: string;
  metadata: any;
  prompt: string;
  response: string;
  model: string;
  provider: string;
  status_code: number;
  duration_ms: number;
  error_message: string;
  created_at: string;
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