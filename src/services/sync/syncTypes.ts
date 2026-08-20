import { 
  TimetableSlot, 
  Task, 
  EvidenceEntry, 
  StudyLog, 
  ProcrastinationDebt, 
  UserSettings, 
  NotificationSettings 
} from '@/types/ripple';

export interface UserFullData {
  slots: TimetableSlot[];
  tasks: Task[];
  evidenceEntries: EvidenceEntry[];
  studyLogs: StudyLog[];
  debt: ProcrastinationDebt;
  settings: UserSettings;
  notificationSettings: NotificationSettings;
}

export const defaultSettings: UserSettings = {
  intensityMode: 'standard',
  isMinorProfile: false,
  weeklyDigestOnly: false,
  personalVelocityMultiplier: 1.0,
  dailyStudyTargetHours: 3.0
};

export const defaultNotifSettings: NotificationSettings = {
  taskRemindersEnabled: true,
  classRemindersEnabled: true,
  defaultTaskReminders: ['15m', 'exact'],
  defaultClassReminders: ['15m']
};