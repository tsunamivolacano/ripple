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
import { 
  scheduleTaskNotifications, 
  scheduleClassNotifications, 
  cancelItemNotifications, 
  getNextSlotDateISO 
} from '@/utils/notificationService';
import { logUserActivity } from '@/services/loggerService';
import { UserAccount } from './useRippleAuth';

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

  const addSlot = async (slotData: Omit<TimetableSlot, 'id'>) => {
    if (!currentUser) return;
    const newSlot: TimetableSlot = { ...slotData, id: `slot-${Date.now()}` };
    const updatedSlots = [...slots, newSlot];
    setSlots(updatedSlots);

    const nextClassISO = getNextSlotDateISO(newSlot.dayOfWeek, newSlot.startTime);
    await scheduleClassNotifications(currentUser.id, newSlot, nextClassISO, notificationSettings);
    showSuccess(`Timetable slot for ${newSlot.subject} created with reminders.`);

    logUserActivity({
      eventName: 'timetable_slot_created',
      eventType: 'timetable',
      userId: currentUser.id,
      userEmail: currentUser.email,
      success: true,
      metadata: { slotId: newSlot.id, subject: newSlot.subject, teacher: newSlot.teacherName, day: newSlot.dayOfWeek }
    });
  };

  const updateSlot = async (updatedSlot: TimetableSlot) => {
    if (!currentUser) return;
    const updatedSlots = slots.map((s) => (s.id === updatedSlot.id ? updatedSlot : s));
    setSlots(updatedSlots);

    const nextClassISO = getNextSlotDateISO(updatedSlot.dayOfWeek, updatedSlot.startTime);
    await scheduleClassNotifications(currentUser.id, updatedSlot, nextClassISO, notificationSettings);
    showSuccess(`Updated ${updatedSlot.subject} class schedule.`);

    logUserActivity({
      eventName: 'timetable_slot_updated',
      eventType: 'timetable',
      userId: currentUser.id,
      userEmail: currentUser.email,
      success: true,
      metadata: { slotId: updatedSlot.id, subject: updatedSlot.subject, teacher: updatedSlot.teacherName }
    });
  };

  const deleteSlot = async (id: string) => {
    if (!currentUser) return;
    const slotToDelete = slots.find((s) => s.id === id);
    setSlots((prev) => prev.filter((s) => s.id !== id));
    await cancelItemNotifications(currentUser.id, id);
    showSuccess('Timetable slot removed.');

    logUserActivity({
      eventName: 'timetable_slot_deleted',
      eventType: 'timetable',
      userId: currentUser.id,
      userEmail: currentUser.email,
      success: true,
      metadata: { slotId: id, subject: slotToDelete?.subject }
    });
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    if (!currentUser) return;
    const computedStatus = calculateTaskStatus(
      taskData.dueDate,
      taskData.estimatedHours,
      taskData.completionPercentage,
      settings.personalVelocityMultiplier,
      taskData.hasDeadline ?? true
    );

    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: computedStatus
    };

    setTasks((prev) => [newTask, ...prev]);

    if (newTask.hasDeadline && newTask.dueDate) {
      await scheduleTaskNotifications(currentUser.id, newTask, notificationSettings);
    }
    showSuccess(`Activity "${newTask.title}" added successfully.`);

    logUserActivity({
      eventName: 'task_created',
      eventType: 'task',
      userId: currentUser.id,
      userEmail: currentUser.email,
      success: true,
      metadata: {
        taskId: newTask.id,
        title: newTask.title,
        category: newTask.category,
        taskType: newTask.taskType,
        estimatedHours: newTask.estimatedHours,
        hasDeadline: newTask.hasDeadline,
        dueDate: newTask.dueDate
      }
    });
  };

  const updateTaskProgress = async (taskId: string, percentage: number) => {
    if (!currentUser) return;

    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        if (t.id === taskId) {
          const isComplete = percentage >= 100;
          const updatedStatus = isComplete
            ? 'completed'
            : calculateTaskStatus(t.dueDate, t.estimatedHours, percentage, settings.personalVelocityMultiplier, t.hasDeadline ?? true);

          const updatedTask = {
            ...t,
            completionPercentage: percentage,
            status: updatedStatus,
            completedAt: isComplete ? new Date().toISOString() : t.completedAt
          };

          if (isComplete) {
            setCompletedTaskForCelebration(updatedTask);
            cancelItemNotifications(currentUser.id, taskId);

            setDebt((d) => ({
              ...d,
              streakDays: d.streakDays + 1,
              compoundingScore: Math.max(0, d.compoundingScore - 5)
            }));

            logUserActivity({
              eventName: 'task_completed',
              eventType: 'task',
              userId: currentUser.id,
              userEmail: currentUser.email,
              success: true,
              metadata: { taskId: t.id, title: t.title, completionPercentage: percentage }
            });
          } else {
            logUserActivity({
              eventName: 'task_progress_updated',
              eventType: 'task',
              userId: currentUser.id,
              userEmail: currentUser.email,
              success: true,
              metadata: { taskId: t.id, title: t.title, completionPercentage: percentage }
            });
          }

          return updatedTask;
        }
        return t;
      })
    );
  };

  const completeTask = async (taskId: string) => {
    await updateTaskProgress(taskId, 100);
  };

  const renegotiateTask = async (taskId: string, newDueDate: string, reason: string) => {
    if (!currentUser) return;

    let updatedTaskObj: Task | null = null;

    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        if (t.id === taskId) {
          const count = (t.renegotiatedCount || 0) + 1;
          const newStatus = calculateTaskStatus(newDueDate, t.estimatedHours, t.completionPercentage, settings.personalVelocityMultiplier, true);
          const obj: Task = {
            ...t,
            hasDeadline: true,
            dueDate: newDueDate,
            renegotiatedCount: count,
            lastRenegotiatedAt: new Date().toISOString(),
            status: newStatus === 'too_late' ? 'tight' : newStatus
          };
          updatedTaskObj = obj;
          return obj;
        }
        return t;
      })
    );

    if (updatedTaskObj) {
      await scheduleTaskNotifications(currentUser.id, updatedTaskObj, notificationSettings);
    }

    setDebt((d) => ({
      ...d,
      totalHoursBehind: d.totalHoursBehind + 0.5,
      compoundingScore: Math.min(100, d.compoundingScore + 8)
    }));

    showSuccess('Task schedule renegotiated & notifications updated.');

    logUserActivity({
      eventName: 'task_renegotiated',
      eventType: 'task',
      userId: currentUser.id,
      userEmail: currentUser.email,
      success: true,
      metadata: { taskId, newDueDate, reason }
    });
  };

  const deleteTask = async (id: string) => {
    if (!currentUser) return;
    const taskToDelete = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await cancelItemNotifications(currentUser.id, id);
    showSuccess('Task removed.');

    logUserActivity({
      eventName: 'task_deleted',
      eventType: 'task',
      userId: currentUser.id,
      userEmail: currentUser.email,
      success: true,
      metadata: { taskId: id, title: taskToDelete?.title }
    });
  };

  const logEvidence = async (entryData: Omit<EvidenceEntry, 'id' | 'dateLogged'>) => {
    if (!currentUser) return;
    const newEntry: EvidenceEntry = {
      ...entryData,
      id: `ev-${Date.now()}`,
      dateLogged: new Date().toISOString()
    };
    setEvidenceEntries((prev) => [newEntry, ...prev]);
    showSuccess('Outcome logged in Evidence Case File!');

    logUserActivity({
      eventName: 'evidence_case_logged',
      eventType: 'evidence',
      userId: currentUser.id,
      userEmail: currentUser.email,
      success: true,
      metadata: {
        evidenceId: newEntry.id,
        taskTitle: newEntry.taskTitle,
        wasOnTime: newEntry.wasOnTime,
        accuracyRating: newEntry.accuracyRating
      }
    });
  };

  const addStudyLog = async (logData: Omit<StudyLog, 'id' | 'loggedAt'>) => {
    if (!currentUser) return;
    const newLog: StudyLog = {
      ...logData,
      id: `study-${Date.now()}`,
      loggedAt: new Date().toISOString()
    };
    setStudyLogs((prev) => [newLog, ...prev]);
    showSuccess(`Logged ${newLog.durationMinutes} minutes of study for ${newLog.subject}!`);

    logUserActivity({
      eventName: 'study_session_logged',
      eventType: 'study',
      userId: currentUser.id,
      userEmail: currentUser.email,
      success: true,
      metadata: {
        studyLogId: newLog.id,
        subject: newLog.subject,
        durationMinutes: newLog.durationMinutes,
        source: newLog.source
      }
    });
  };

  const deleteStudyLog = async (id: string) => {
    if (!currentUser) return;
    const logToDelete = studyLogs.find((l) => l.id === id);
    setStudyLogs((prev) => prev.filter((l) => l.id !== id));
    showSuccess('Study entry removed.');

    logUserActivity({
      eventName: 'study_session_deleted',
      eventType: 'study',
      userId: currentUser.id,
      userEmail: currentUser.email,
      success: true,
      metadata: { studyLogId: id, subject: logToDelete?.subject }
    });
  };

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