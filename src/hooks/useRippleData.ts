import { useState, useEffect, useRef } from 'react';
import { 
  TimetableSlot, 
  Task, 
  EvidenceEntry, 
  StudyLog, 
  ProcrastinationDebt, 
  UserSettings, 
  NotificationSettings,
  ActiveTimerState 
} from '@/types/ripple';
import { calculateTaskStatus } from '@/utils/timeUtils';
import { safeGetStorage, safeSetStorage } from '@/utils/storageUtils';
import { PERSONAS_MAP } from '@/data/ripplePersonaData';
import { showSuccess, showError } from '@/utils/toast';
import { 
  scheduleTaskNotifications, 
  scheduleClassNotifications, 
  cancelItemNotifications, 
  getNextSlotDateISO 
} from '@/utils/notificationService';
import { 
  loadUserCloudData,
  syncTaskInsert,
  syncTaskUpdate,
  syncTaskDelete,
  syncSlotInsert,
  syncSlotUpdate,
  syncSlotDelete,
  syncStudyLogInsert,
  syncStudyLogDelete,
  syncEvidenceInsert,
  syncDebtUpsert,
  syncUserSettings,
  syncNotificationSettings
} from '@/services/databaseSyncService';
import { UserAccount } from './useRippleAuth';

const defaultPersona = PERSONAS_MAP['riya'];

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
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
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

  // Global Active Background Timer
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(() => {
    return safeGetStorage<ActiveTimerState | null>('ripple_active_timer', null);
  });

  const activeTimerRef = useRef<ActiveTimerState | null>(activeTimer);
  useEffect(() => {
    activeTimerRef.current = activeTimer;
    safeSetStorage('ripple_active_timer', activeTimer);
  }, [activeTimer]);

  // Load account data when currentUser changes (Cloud-first with cached fallback)
  useEffect(() => {
    let isCancelled = false;

    async function initializeUserData() {
      if (!currentUser) {
        setSlots([]);
        setTasks([]);
        setEvidenceEntries([]);
        setStudyLogs([]);
        setDebt(emptyDebt);
        setSettings(emptySettings);
        setIsLoadingData(false);
        return;
      }

      setIsLoadingData(true);

      // Demo Persona account
      if (currentUser.isDemo && currentUser.demoPersonaId) {
        const persona = PERSONAS_MAP[currentUser.demoPersonaId] || defaultPersona;
        setSlots(persona.slots);
        setTasks(persona.tasks);
        setEvidenceEntries(persona.evidenceEntries);
        setStudyLogs([]);
        setDebt(persona.debt);
        setSettings(persona.settings);
        setNotificationSettings(defaultNotificationSettings);
        setCurrentPersonaId(persona.id);
        setIsLoadingData(false);
        return;
      }

      // Live Authenticated User: Load from Supabase Cloud directly
      try {
        const cloudData = await loadUserCloudData(currentUser.id);
        if (!isCancelled) {
          setSlots(cloudData.slots);
          setTasks(cloudData.tasks);
          setEvidenceEntries(cloudData.evidenceEntries);
          setStudyLogs(cloudData.studyLogs);
          setDebt(cloudData.debt);
          setSettings(cloudData.settings);
          setNotificationSettings(cloudData.notificationSettings);
        }
      } catch (e) {
        console.error('[useRippleData] Error loading cloud data:', e);
      } finally {
        if (!isCancelled) {
          setIsLoadingData(false);
        }
      }
    }

    initializeUserData();

    return () => {
      isCancelled = true;
    };
  }, [currentUser?.id]);

  // Local storage persistence backup for offline resilience
  useEffect(() => {
    if (currentUser && !currentUser.isDemo && !isLoadingData) {
      const uKey = currentUser.id;
      safeSetStorage(`ripple_slots_${uKey}`, slots);
      safeSetStorage(`ripple_tasks_${uKey}`, tasks);
      safeSetStorage(`ripple_evidence_${uKey}`, evidenceEntries);
      safeSetStorage(`ripple_study_${uKey}`, studyLogs);
      safeSetStorage(`ripple_debt_${uKey}`, debt);
      safeSetStorage(`ripple_settings_${uKey}`, settings);
      safeSetStorage(`ripple_notif_settings_${uKey}`, notificationSettings);
    }
  }, [currentUser, slots, tasks, evidenceEntries, studyLogs, debt, settings, notificationSettings, isLoadingData]);

  // Global Timestamp Ticker for Background Timer
  useEffect(() => {
    const timerInterval = setInterval(() => {
      const current = activeTimerRef.current;
      if (!current || !current.isRunning || !current.targetEndTime) return;

      const now = Date.now();
      const remainingMs = current.targetEndTime - now;
      const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));

      if (secondsLeft <= 0) {
        const loggedMins = current.initialDurationMinutes || Math.round(current.totalSeconds / 60);
        addStudyLog({
          subject: current.subject || 'General Study',
          durationMinutes: Math.max(1, loggedMins),
          topic: `Completed Sprint: ${current.taskTitle}`,
          source: 'timer'
        });

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`🎉 Focus Sprint Completed!`, {
              body: `Great job! You finished your ${loggedMins}-minute focus block for "${current.taskTitle}".`,
              icon: '/placeholder.svg'
            });
          } catch {}
        }

        showSuccess(`🎯 Sprint Complete! Logged +${loggedMins}m of study time.`);
        setActiveTimer(null);
      } else {
        setActiveTimer((prev) => (prev ? { ...prev, secondsLeft } : null));
      }
    }, 500);

    return () => clearInterval(timerInterval);
  }, [currentUser]);

  // Status auto-refresh ticker every 30s
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

  // Timer Control Functions
  const startGlobalTimer = (params: {
    taskId?: string;
    taskTitle: string;
    subject: string;
    durationMinutes: number;
    isMinimized?: boolean;
  }) => {
    const totalSecs = params.durationMinutes * 60;
    const now = Date.now();
    const targetEnd = now + totalSecs * 1000;

    const timerObj: ActiveTimerState = {
      id: `timer-${now}`,
      taskId: params.taskId,
      taskTitle: params.taskTitle,
      subject: params.subject,
      totalSeconds: totalSecs,
      secondsLeft: totalSecs,
      isRunning: true,
      targetEndTime: targetEnd,
      startedAt: now,
      initialDurationMinutes: params.durationMinutes,
      isMinimized: params.isMinimized ?? false
    };

    setActiveTimer(timerObj);
  };

  const pauseGlobalTimer = () => {
    setActiveTimer((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        isRunning: false,
        targetEndTime: null
      };
    });
  };

  const resumeGlobalTimer = () => {
    setActiveTimer((prev) => {
      if (!prev) return null;
      const now = Date.now();
      return {
        ...prev,
        isRunning: true,
        targetEndTime: now + prev.secondsLeft * 1000
      };
    });
  };

  const resetGlobalTimer = (newDurationMinutes?: number) => {
    setActiveTimer((prev) => {
      if (!prev) return null;
      const mins = newDurationMinutes || prev.initialDurationMinutes;
      const secs = mins * 60;
      return {
        ...prev,
        totalSeconds: secs,
        secondsLeft: secs,
        initialDurationMinutes: mins,
        isRunning: false,
        targetEndTime: null
      };
    });
  };

  const setTimerMinimized = (minimized: boolean) => {
    setActiveTimer((prev) => (prev ? { ...prev, isMinimized: minimized } : null));
  };

  const stopAndLogTimer = () => {
    const current = activeTimer;
    if (!current) return;

    const elapsedSeconds = current.totalSeconds - current.secondsLeft;
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    addStudyLog({
      subject: current.subject || 'General Study',
      durationMinutes: elapsedMinutes,
      topic: `Focus Session: ${current.taskTitle}`,
      source: 'timer'
    });

    setActiveTimer(null);
    showSuccess(`Logged +${elapsedMinutes}m study session.`);
  };

  const cancelGlobalTimer = () => {
    setActiveTimer(null);
  };

  const addSlot = async (slotData: Omit<TimetableSlot, 'id'>) => {
    if (!currentUser) return;
    const newSlot: TimetableSlot = { ...slotData, id: `slot-${Date.now()}` };
    const updatedSlots = [...slots, newSlot];
    setSlots(updatedSlots);

    if (!currentUser.isDemo) {
      await syncSlotInsert(currentUser.id, newSlot);
    }

    const nextClassISO = getNextSlotDateISO(newSlot.dayOfWeek, newSlot.startTime);
    await scheduleClassNotifications(currentUser.id, newSlot, nextClassISO, notificationSettings);
    showSuccess(`Timetable slot for ${newSlot.subject} saved and synced.`);
  };

  const updateSlot = async (updatedSlot: TimetableSlot) => {
    if (!currentUser) return;
    const updatedSlots = slots.map((s) => (s.id === updatedSlot.id ? updatedSlot : s));
    setSlots(updatedSlots);

    if (!currentUser.isDemo) {
      await syncSlotUpdate(currentUser.id, updatedSlot);
    }

    const nextClassISO = getNextSlotDateISO(updatedSlot.dayOfWeek, updatedSlot.startTime);
    await scheduleClassNotifications(currentUser.id, updatedSlot, nextClassISO, notificationSettings);
    showSuccess(`Updated ${updatedSlot.subject} class schedule.`);
  };

  const deleteSlot = async (id: string) => {
    if (!currentUser) return;
    setSlots((prev) => prev.filter((s) => s.id !== id));
    if (!currentUser.isDemo) {
      await syncSlotDelete(currentUser.id, id);
    }
    await cancelItemNotifications(currentUser.id, id);
    showSuccess('Timetable slot removed.');
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

    if (!currentUser.isDemo) {
      await syncTaskInsert(currentUser.id, newTask);
    }

    if (newTask.hasDeadline && newTask.dueDate) {
      await scheduleTaskNotifications(currentUser.id, newTask, notificationSettings);
    }
    showSuccess(`Activity "${newTask.title}" saved & synced.`);
  };

  const updateTaskProgress = async (taskId: string, percentage: number) => {
    if (!currentUser) return;

    let updatedTaskObj: Task | null = null;

    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        if (t.id === taskId) {
          const isComplete = percentage >= 100;
          const updatedStatus = isComplete
            ? 'completed'
            : calculateTaskStatus(t.dueDate, t.estimatedHours, percentage, settings.personalVelocityMultiplier, t.hasDeadline ?? true);

          const updatedTask: Task = {
            ...t,
            completionPercentage: percentage,
            status: updatedStatus,
            completedAt: isComplete ? new Date().toISOString() : t.completedAt
          };

          updatedTaskObj = updatedTask;

          if (isComplete) {
            setCompletedTaskForCelebration(updatedTask);
            cancelItemNotifications(currentUser.id, taskId);

            setDebt((d) => {
              const newDebt = {
                ...d,
                streakDays: d.streakDays + 1,
                compoundingScore: Math.max(0, d.compoundingScore - 5)
              };
              if (!currentUser.isDemo) {
                syncDebtUpsert(currentUser.id, newDebt);
              }
              return newDebt;
            });
          }

          return updatedTask;
        }
        return t;
      })
    );

    if (updatedTaskObj && !currentUser.isDemo) {
      await syncTaskUpdate(currentUser.id, updatedTaskObj);
    }
  };

  const completeTask = async (taskId: string) => {
    await updateTaskProgress(taskId, 100);
  };

  const renegotiateTask = async (taskId: string, newDueDate: string, _reason: string) => {
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

    if (updatedTaskObj && !currentUser.isDemo) {
      await syncTaskUpdate(currentUser.id, updatedTaskObj);
      await scheduleTaskNotifications(currentUser.id, updatedTaskObj, notificationSettings);
    }

    setDebt((d) => {
      const newDebt = {
        ...d,
        totalHoursBehind: d.totalHoursBehind + 0.5,
        compoundingScore: Math.min(100, d.compoundingScore + 8)
      };
      if (!currentUser.isDemo) {
        syncDebtUpsert(currentUser.id, newDebt);
      }
      return newDebt;
    });

    showSuccess('Task schedule renegotiated & synced to database.');
  };

  const deleteTask = async (id: string) => {
    if (!currentUser) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (!currentUser.isDemo) {
      await syncTaskDelete(currentUser.id, id);
    }
    await cancelItemNotifications(currentUser.id, id);
    showSuccess('Task removed.');
  };

  const logEvidence = async (entryData: Omit<EvidenceEntry, 'id' | 'dateLogged'>) => {
    if (!currentUser) return;
    const newEntry: EvidenceEntry = {
      ...entryData,
      id: `ev-${Date.now()}`,
      dateLogged: new Date().toISOString()
    };
    setEvidenceEntries((prev) => [newEntry, ...prev]);
    if (!currentUser.isDemo) {
      await syncEvidenceInsert(currentUser.id, newEntry);
    }
    showSuccess('Outcome logged in Evidence Case File & synced!');
  };

  const addStudyLog = async (logData: Omit<StudyLog, 'id' | 'loggedAt'>) => {
    if (!currentUser) return;
    const newLog: StudyLog = {
      ...logData,
      id: `study-${Date.now()}`,
      loggedAt: new Date().toISOString()
    };
    setStudyLogs((prev) => [newLog, ...prev]);
    if (!currentUser.isDemo) {
      await syncStudyLogInsert(currentUser.id, newLog);
    }
  };

  const deleteStudyLog = async (id: string) => {
    if (!currentUser) return;
    setStudyLogs((prev) => prev.filter((l) => l.id !== id));
    if (!currentUser.isDemo) {
      await syncStudyLogDelete(currentUser.id, id);
    }
    showSuccess('Study entry removed.');
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!currentUser) return;
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (!currentUser.isDemo) {
      await syncUserSettings(currentUser.id, updated);
    }
    showSuccess('Settings updated and synced.');
  };

  const updateNotificationSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!currentUser) return;
    const updated = { ...notificationSettings, ...newSettings };
    setNotificationSettings(updated);
    if (!currentUser.isDemo) {
      await syncNotificationSettings(currentUser.id, updated);
    }
    showSuccess('Notification preferences saved.');
  };

  const loadPersonaData = (personaId: string) => {
    const bundle = PERSONAS_MAP[personaId] || defaultPersona;
    setCurrentPersonaId(bundle.id);
    setSlots(bundle.slots);
    setTasks(bundle.tasks);
    setEvidenceEntries(bundle.evidenceEntries);
    setStudyLogs([]);
    setDebt(bundle.debt);
    setSettings(bundle.settings);
    showSuccess(`Loaded template data: ${bundle.name}`);
  };

  const resetAllData = () => {
    setSlots([]);
    setTasks([]);
    setEvidenceEntries([]);
    setStudyLogs([]);
    setDebt(emptyDebt);
    setActiveTimer(null);
    showSuccess('All data reset for active account.');
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
    activeTimer,
    startGlobalTimer,
    pauseGlobalTimer,
    resumeGlobalTimer,
    resetGlobalTimer,
    setTimerMinimized,
    stopAndLogTimer,
    cancelGlobalTimer,
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