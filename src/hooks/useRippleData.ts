import { useState, useEffect } from 'react';
import { 
  TimetableSlot, 
  Task, 
  EvidenceEntry, 
  StudyLog,
  ProcrastinationDebt, 
  UserSettings,
  NotificationSettings
} from '@/types/ripple';
import { calculateTaskStatus } from '@/utils/timeUtils';
import { safeGetStorage, safeSetStorage } from '@/utils/storageUtils';
import { PERSONAS_MAP } from '@/data/ripplePersonaData';
import { showSuccess } from '@/utils/toast';
import { logUserActivity } from '@/services/loggerService';
import { UserAccount } from './useRippleAuth';
import { useSlotData } from './data/useSlotData';
import { useTaskData } from './data/useTaskData';
import { useEvidenceAndStudyData } from './data/useEvidenceAndStudyData';

const defaultPersona = PERSONAS_MAP['riya'];

const initialStudyLogs: StudyLog[] = [
  {
    id: 'st-1',
    subject: 'Physics',
    durationMinutes: 90,
    topic: 'Wave Optics & Double Slit Interference',
    loggedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    source: 'manual'
  },
  {
    id: 'st-2',
    subject: 'Mathematics',
    durationMinutes: 60,
    topic: 'Calculus Definite Integration Problems',
    loggedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    source: 'timer'
  }
];

const emptyDebt: ProcrastinationDebt = {
  totalHoursBehind: 0,
  missedDeadlinesCount: 0,
  streakDays: 0,
  compoundingScore: 0,
  weeklyDebtTrend: [
    { day: 'Mon', debtHours: 0 },
    { day: 'Tue', debtHours: 0 },
    { day: 'Wed', debtHours: 0 },
    { day: 'Thu', debtHours: 0 },
    { day: 'Fri', debtHours: 0 },
    { day: 'Sat', debtHours: 0 },
    { day: 'Sun', debtHours: 0 }
  ]
};

const emptySettings: UserSettings = {
  intensityMode: 'standard',
  isMinorProfile: false,
  weeklyDigestOnly: false,
  personalVelocityMultiplier: 1.0
};

const defaultNotificationSettings: NotificationSettings = {
  taskRemindersEnabled: true,
  classRemindersEnabled: true,
  defaultTaskReminders: ['15m', 'exact'],
  defaultClassReminders: ['15m']
};

export function useRippleData(currentUser: UserAccount | null) {
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [currentPersonaId, setCurrentPersonaId] = useState<string>('riya');
  
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntry[]>([]);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [debt, setDebt] = useState<ProcrastinationDebt>(emptyDebt);
  const [settings, setSettings] = useState<UserSettings>(emptySettings);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);

  const [activeTaskForPrediction, setActiveTaskForPrediction] = useState<Task | null>(null);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [completedTaskForCelebration, setCompletedTaskForCelebration] = useState<Task | null>(null);
  const [isNotificationModalOpen, setNotificationModalOpen] = useState<boolean>(false);

  // Modular Sub-Hooks
  const { addSlot, updateSlot, deleteSlot } = useSlotData(
    currentUser,
    slots,
    setSlots,
    notificationSettings
  );

  const { addTask, updateTaskProgress, completeTask, renegotiateTask, deleteTask } = useTaskData(
    currentUser,
    tasks,
    setTasks,
    setDebt,
    settings,
    notificationSettings,
    setCompletedTaskForCelebration
  );

  const { logEvidence, addStudyLog, deleteStudyLog } = useEvidenceAndStudyData(
    currentUser,
    setEvidenceEntries,
    studyLogs,
    setStudyLogs
  );

  // Load account data when currentUser changes
  useEffect(() => {
    if (!currentUser) {
      setSlots([]);
      setTasks([]);
      setEvidenceEntries([]);
      setStudyLogs([]);
      setDebt(emptyDebt);
      setSettings(emptySettings);
      return;
    }

    setIsLoadingData(true);
    const uKey = currentUser.id;

    if (currentUser.isDemo && currentUser.demoPersonaId) {
      const persona = PERSONAS_MAP[currentUser.demoPersonaId] || defaultPersona;
      setSlots(persona.slots);
      setTasks(persona.tasks);
      setEvidenceEntries(persona.evidenceEntries);
      setStudyLogs(initialStudyLogs);
      setDebt(persona.debt);
      setSettings(persona.settings);
      setNotificationSettings(defaultNotificationSettings);
      setCurrentPersonaId(persona.id);
      setIsLoadingData(false);
      return;
    }

    const localSlots = safeGetStorage<TimetableSlot[] | null>(`ripple_slots_${uKey}`, null);
    const localTasks = safeGetStorage<Task[] | null>(`ripple_tasks_${uKey}`, null);
    const localEvidence = safeGetStorage<EvidenceEntry[] | null>(`ripple_evidence_${uKey}`, null);
    const localStudy = safeGetStorage<StudyLog[] | null>(`ripple_study_${uKey}`, null);
    const localDebt = safeGetStorage<ProcrastinationDebt | null>(`ripple_debt_${uKey}`, null);
    const localSettings = safeGetStorage<UserSettings | null>(`ripple_settings_${uKey}`, null);
    const localNotifSettings = safeGetStorage<NotificationSettings | null>(`ripple_notif_settings_${uKey}`, null);

    setSlots(localSlots !== null ? localSlots : []);
    setTasks(localTasks !== null ? localTasks : []);
    setEvidenceEntries(localEvidence !== null ? localEvidence : []);
    setStudyLogs(localStudy !== null ? localStudy : initialStudyLogs);
    setDebt(localDebt !== null ? localDebt : emptyDebt);
    setSettings(localSettings !== null ? localSettings : emptySettings);
    setNotificationSettings(localNotifSettings !== null ? localNotifSettings : defaultNotificationSettings);

    setIsLoadingData(false);
  }, [currentUser?.id]);

  // Sync changes to storage
  useEffect(() => {
    if (currentUser && !currentUser.isDemo) {
      const uKey = currentUser.id;
      safeSetStorage(`ripple_slots_${uKey}`, slots);
      safeSetStorage(`ripple_tasks_${uKey}`, tasks);
      safeSetStorage(`ripple_evidence_${uKey}`, evidenceEntries);
      safeSetStorage(`ripple_study_${uKey}`, studyLogs);
      safeSetStorage(`ripple_debt_${uKey}`, debt);
      safeSetStorage(`ripple_settings_${uKey}`, settings);
      safeSetStorage(`ripple_notif_settings_${uKey}`, notificationSettings);
    }
  }, [currentUser, slots, tasks, evidenceEntries, studyLogs, debt, settings, notificationSettings]);

  // Dynamic task status ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTasks((prevTasks) =>
        prevTasks.map((t) => {
          if (t.status === 'completed' || t.status === 'renegotiated') return t;
          const newStatus = calculateTaskStatus(
            t.dueDate,
            t.estimatedHours,
            t.completionPercentage,
            settings.personalVelocityMultiplier,
            t.hasDeadline ?? true
          );
          return { ...t, status: newStatus };
        })
      );
    }, 30000);
    return () => clearInterval(timer);
  }, [settings.personalVelocityMultiplier]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!currentUser) return;
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      logUserActivity({
        eventName: 'settings_updated',
        eventType: 'settings',
        userId: currentUser.id,
        userEmail: currentUser.email,
        success: true,
        metadata: { updatedKeys: Object.keys(newSettings), newSettings: updated }
      });
      return updated;
    });
    showSuccess('Settings updated.');
  };

  const updateNotificationSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!currentUser) return;
    setNotificationSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      logUserActivity({
        eventName: 'notification_settings_updated',
        eventType: 'settings',
        userId: currentUser.id,
        userEmail: currentUser.email,
        success: true,
        metadata: { updatedKeys: Object.keys(newSettings) }
      });
      return updated;
    });
    showSuccess('Notification preferences saved.');
  };

  const loadPersonaData = (personaId: string) => {
    const bundle = PERSONAS_MAP[personaId] || defaultPersona;
    setCurrentPersonaId(bundle.id);
    setSlots(bundle.slots);
    setTasks(bundle.tasks);
    setEvidenceEntries(bundle.evidenceEntries);
    setStudyLogs(initialStudyLogs);
    setDebt(bundle.debt);
    setSettings(bundle.settings);
    showSuccess(`Loaded template data: ${bundle.name}`);

    if (currentUser) {
      logUserActivity({
        eventName: 'persona_template_loaded',
        eventType: 'settings',
        userId: currentUser.id,
        userEmail: currentUser.email,
        success: true,
        metadata: { personaId: bundle.id, personaName: bundle.name }
      });
    }
  };

  const resetAllData = () => {
    setSlots([]);
    setTasks([]);
    setEvidenceEntries([]);
    setStudyLogs([]);
    setDebt(emptyDebt);
    showSuccess('All data reset for active account.');

    if (currentUser) {
      logUserActivity({
        eventName: 'user_data_reset',
        eventType: 'settings',
        userId: currentUser.id,
        userEmail: currentUser.email,
        success: true
      });
    }
  };

  return {
    slots,
    tasks,
    evidenceEntries,
    studyLogs,
    debt,
    settings,
    notificationSettings,
    currentPersonaId,
    activeTaskForPrediction,
    activeFocusTask,
    completedTaskForCelebration,
    isLoadingData,
    isNotificationModalOpen,
    setNotificationModalOpen,
    setActiveTaskForPrediction,
    setActiveFocusTask,
    setCompletedTaskForCelebration,
    addSlot,
    updateSlot,
    deleteSlot,
    addTask,
    updateTaskProgress,
    completeTask,
    renegotiateTask,
    deleteTask,
    logEvidence,
    addStudyLog,
    deleteStudyLog,
    updateSettings,
    updateNotificationSettings,
    loadPersonaData,
    resetAllData
  };
}