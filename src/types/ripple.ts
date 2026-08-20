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
  interval?: number;
  daysOfWeek?: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[];
  startDate?: string;
  endDate?: string;
  count?: number;
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
  specificDate?: string;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  slotId?: string;
  hasDeadline?: boolean;
  dueDate?: string;
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
  lastRenegotiatedAt?: string;
}

export interface DomainConsequence {
  domain: 'Academic' | 'Social' | 'Physical' | 'Financial' | 'Emotional' | 'Long-term';
  severity: 'low' | 'medium' | 'high' | 'severe';
  title: string;
  description: string;
  impactScore: number;
}

export interface SplitTimelineScenario {
  title: string;
  timeframe: string;
  outcomeSummary: string;
  stressLevel: number;
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
  accuracyRating: number;
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

export interface DailyStudySummary {
  date: string; // YYYY-MM-DD
  dayLabel: string; // Mon, Tue, etc.
  targetHours: number;
  completedHours: number;
  shortfallHours: number; // positive if completed < target, negative or 0 if target met
  sessionsCount: number;
}

export interface ProcrastinationDebt {
  totalHoursBehind: number; // study debt shortfall + delayed task backlog
  missedDeadlinesCount: number;
  streakDays: number;
  compoundingScore: number; // 0 to 100 risk score
  weeklyDebtTrend: { day: string; debtHours: number }[];
  dailyTargetHours?: number; // default daily goal e.g. 3.5h
  recommendedNextDayTargetHours?: number; // AI-computed adaptive next-day goal
  studyDeficitHours?: number; // accumulated study hour shortfall
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
  triggerTime: string;
  reminderOffset: ReminderTiming;
  status: 'pending' | 'sent' | 'cancelled';
  createdAt: string;
}

export interface UserSettings {
  intensityMode: IntensityMode;
  isMinorProfile: boolean;
  weeklyDigestOnly: boolean;
  personalVelocityMultiplier: number;
  dailyStudyTargetHours?: number; // daily planned study target (default 3.0h)
}

export type TimerMode = 'stopwatch' | 'countdown';

export interface ActiveTimerState {
  id: string;
  taskId?: string;
  taskTitle: string;
  subject: string;
  topic?: string;
  mode: TimerMode;
  totalSeconds: number;
  secondsLeft: number;
  elapsedSeconds: number;
  isRunning: boolean;
  targetEndTime: number | null;
  startedAt: number; // epoch ms when current run started
  startTimeISO: string; // ISO string of when session originally began
  accumulatedSecondsBeforeRun: number;
  initialDurationMinutes: number;
  isMinimized: boolean;
}