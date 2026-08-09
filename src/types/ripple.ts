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
  | 'chore';

export type TaskCategory = 'academic' | 'personal';

export type ReminderTiming = 'exact' | '5m' | '15m' | '30m' | '1h' | '1d' | 'overdue';

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
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  slotId?: string;
  dueDate: string; // ISO String in UTC
  estimatedHours: number;
  completionPercentage: number;
  taskType: TaskType;
  category?: TaskCategory;
  status: TaskStatus;
  reminders?: ReminderTiming[];
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