import { useState, useEffect, useCallback, useRef } from "react";
import {
  TimetableSlot,
  Task,
  EvidenceEntry,
  StudyLog,
  ProcrastinationDebt,
  UserSettings,
  NotificationSettings,
  TaskStatus
} from "@/types/ripple";
import { calculateTaskStatus } from "@/utils/timeUtils";
import { safeGetStorage, safeSetStorage } from "@/utils/storageUtils";
import { PERSONAS_MAP } from "@/data/ripplePersonaData";
import { showSuccess } from "@/utils/toast";
import {
  scheduleTaskNotifications,
  scheduleClassNotifications,
  cancelItemNotifications,
  getNextSlotDateISO
} from "@/utils/notificationService";
import { fetchCollection, persistCollection, deleteAllUserData, CollectionKey } from "@/services/rippleDataService";
import { updateUserStatsInRegistry } from "@/services/adminService";
import { UserAccount } from "./useRippleAuth";

const defaultPersona = PERSONAS_MAP["riya"];

const initialStudyLogs: StudyLog[] = [
  {
    id: "st-1",
    subject: "Physics",
    durationMinutes: 90,
    topic: "Wave Optics & Double Slit Interference",
    loggedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    source: "manual"
  },
  {
    id: "st-2",
    subject: "Mathematics",
    durationMinutes: 60,
    topic: "Calculus Definite Integration Problems",
    loggedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    source: "timer"
  }
];

const emptyDebt: ProcrastinationDebt = {
  totalHoursBehind: 0,
  missedDeadlinesCount: 0,
  streakDays: 0,
  compoundingScore: 0,
  weeklyDebtTrend: [
    { day: "Mon", debtHours: 0 },
    { day: "Tue", debtHours: 0 },
    { day: "Wed", debtHours: 0 },
    { day: "Thu", debtHours: 0 },
    { day: "Fri", debtHours: 0 },
    { day: "Sat", debtHours: 0 },
    { day: "Sun", debtHours: 0 }
  ]
};

const emptySettings: UserSettings = {
  intensityMode: "standard",
  isMinorProfile: false,
  weeklyDigestOnly: false,
  personalVelocityMultiplier: 1.0
};

const defaultNotificationSettings: NotificationSettings = {
  taskRemindersEnabled: true,
  classRemindersEnabled: true,
  defaultTaskReminders: ["15m", "exact"],
  defaultClassReminders: ["15m"]
};

const LOCAL_KEYS: Record<CollectionKey, string> = {
  slots: "ripple_slots",
  tasks: "ripple_tasks",
  evidence: "ripple_evidence",
  study: "ripple_study",
  debt: "ripple_debt",
  settings: "ripple_settings",
  notifSettings: "ripple_notif_settings"
};

export function useRippleData(currentUser: UserAccount | null) {
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [currentPersonaId, setCurrentPersonaId] = useState<string>("");

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

  const tasksRef = useRef<Task[]>([]);
  const studyRef = useRef<StudyLog[]>([]);
  const slotsRef = useRef<TimetableSlot[]>([]);
  const debtRef = useRef<ProcrastinationDebt>(debt);
  tasksRef.current = tasks;
  studyRef.current = studyLogs;
  slotsRef.current = slots;
  debtRef.current = debt;

  const localRead = (kind: CollectionKey) => {
    if (!currentUser) return null;
    return safeGetStorage(`${LOCAL_KEYS[kind]}_${currentUser.id}`, null);
  };

  const localWrite = useCallback(
    (kind: CollectionKey, value: unknown) => {
      if (!currentUser || currentUser.isDemo) return;
      safeSetStorage(`${LOCAL_KEYS[kind]}_${currentUser.id}`, value);
    },
    [currentUser]
  );

  const persist = useCallback(
    async (kind: CollectionKey, value: any) => {
      if (!currentUser || currentUser.isDemo) return;
      await persistCollection(currentUser.id, kind, value);
      localWrite(kind, value);

      if (kind === "tasks" || kind === "study" || kind === "slots" || kind === "debt") {
        const studyMinutes = studyRef.current.reduce((acc, l) => acc + l.durationMinutes, 0);
        updateUserStatsInRegistry(currentUser.email, {
          tasksCreated: tasksRef.current.length,
          tasksCompleted: tasksRef.current.filter(
            (t) => t.status === "completed" || t.completionPercentage >= 100
          ).length,
          studyHours: (studyMinutes / 60).toFixed(1),
          timerSessions: studyRef.current.filter((l) => l.source === "timer").length,
          calendarEvents: slotsRef.current.length + tasksRef.current.filter((t) => t.dueDate).length
        });
      }
    },
    [currentUser, localWrite]
  );

  useEffect(() => {
    if (!currentUser) {
      setSlots([]);
      setTasks([]);
      setEvidenceEntries([]);
      setStudyLogs([]);
      setDebt(emptyDebt);
      setSettings(emptySettings);
      setNotificationSettings(defaultNotificationSettings);
      setCurrentPersonaId("");
      return;
    }

    setIsLoadingData(true);

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

    (async () => {
      const uid = currentUser.id;
      const kinds: CollectionKey[] = ["slots", "tasks", "evidence", "study", "debt", "settings", "notifSettings"];
      const results = await Promise.all(kinds.map((k) => fetchCollection(uid, k)));

      const [dbSlots, dbTasks, dbEvidence, dbStudy, dbDebt, dbSettings, dbNotif] = results;

      setSlots(dbSlots ?? localRead("slots") ?? []);
      setTasks(dbTasks ?? localRead("tasks") ?? []);
      setEvidenceEntries(dbEvidence ?? localRead("evidence") ?? []);
      setStudyLogs(dbStudy ?? localRead("study") ?? initialStudyLogs);
      setDebt(dbDebt ?? localRead("debt") ?? emptyDebt);
      setSettings(dbSettings ?? localRead("settings") ?? emptySettings);
      setNotificationSettings(dbNotif ?? localRead("notifSettings") ?? defaultNotificationSettings);
      setCurrentPersonaId("");
      setIsLoadingData(false);
    })();
  }, [currentUser?.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTasks((prevTasks) =>
        prevTasks.map((t) => {
          if (t.status === "completed" || t.status === "renegotiated") return t;
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

  const addSlot = async (slotData: Omit<TimetableSlot, "id">) => {
    if (!currentUser) return;
    const newSlot: TimetableSlot = { ...slotData, id: `slot-${Date.now()}` };
    const updatedSlots = [...slots, newSlot];
    setSlots(updatedSlots);
    await persist("slots", updatedSlots);

    const nextClassISO = getNextSlotDateISO(newSlot.dayOfWeek, newSlot.startTime);
    await scheduleClassNotifications(currentUser.id, newSlot, nextClassISO, notificationSettings);
    showSuccess(`Timetable slot for ${newSlot.subject} created with reminders.`);
  };

  const updateSlot = async (updatedSlot: TimetableSlot) => {
    if (!currentUser) return;
    const updatedSlots = slots.map((s) => (s.id === updatedSlot.id ? updatedSlot : s));
    setSlots(updatedSlots);
    await persist("slots", updatedSlots);

    const nextClassISO = getNextSlotDateISO(updatedSlot.dayOfWeek, updatedSlot.startTime);
    await scheduleClassNotifications(currentUser.id, updatedSlot, nextClassISO, notificationSettings);
    showSuccess(`Updated ${updatedSlot.subject} class schedule.`);
  };

  const deleteSlot = async (id: string) => {
    if (!currentUser) return;
    const updated = slots.filter((s) => s.id !== id);
    setSlots(updated);
    await persist("slots", updated);
    await cancelItemNotifications(currentUser.id, id);
    showSuccess("Timetable slot removed.");
  };

  const addTask = async (taskData: Omit<Task, "id" | "createdAt" | "status">) => {
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

    const next = [newTask, ...tasks];
    setTasks(next);
    await persist("tasks", next);

    if (newTask.hasDeadline && newTask.dueDate) {
      await scheduleTaskNotifications(currentUser.id, newTask, notificationSettings);
    }
    showSuccess(`Activity "${newTask.title}" added successfully.`);
  };

  const updateTaskProgress = async (taskId: string, percentage: number) => {
    if (!currentUser) return;

    let completedTask: Task | null = null;
    const next = tasks.map((t) => {
      if (t.id === taskId) {
        const isComplete = percentage >= 100;
        const updatedTask: Task = {
          ...t,
          completionPercentage: percentage,
          status: isComplete
            ? "completed"
            : calculateTaskStatus(
                t.dueDate,
                t.estimatedHours,
                percentage,
                settings.personalVelocityMultiplier,
                t.hasDeadline ?? true
              ),
          completedAt: isComplete ? new Date().toISOString() : t.completedAt
        };
        if (isComplete) completedTask = updatedTask;
        return updatedTask;
      }
      return t;
    });

    setTasks(next);
    await persist("tasks", next);

    if (completedTask) {
      setCompletedTaskForCelebration(completedTask);
      await cancelItemNotifications(currentUser.id, taskId);
      const nextDebt: ProcrastinationDebt = {
        ...debt,
        streakDays: debt.streakDays + 1,
        compoundingScore: Math.max(0, debt.compoundingScore - 5)
      };
      setDebt(nextDebt);
      await persist("debt", nextDebt);
    }
  };

  const completeTask = async (taskId: string) => {
    await updateTaskProgress(taskId, 100);
  };

  const renegotiateTask = async (taskId: string, newDueDate: string, _reason: string) => {
    if (!currentUser) return;

    let updatedTaskObj: Task | null = null;
    const next = tasks.map((t) => {
      if (t.id === taskId) {
        const count = (t.renegotiatedCount || 0) + 1;
        const newStatus = calculateTaskStatus(
          newDueDate,
          t.estimatedHours,
          t.completionPercentage,
          settings.personalVelocityMultiplier,
          true
        );
        const updated: Task = {
          ...t,
          hasDeadline: true,
          dueDate: newDueDate,
          renegotiatedCount: count,
          lastRenegotiatedAt: new Date().toISOString(),
          status: newStatus === "too_late" ? "tight" : newStatus
        };
        updatedTaskObj = updated;
        return updated;
      }
      return t;
    });

    setTasks(next);
    await persist("tasks", next);

    if (updatedTaskObj) {
      await scheduleTaskNotifications(currentUser.id, updatedTaskObj, notificationSettings);
    }

    const nextDebt: ProcrastinationDebt = {
      ...debt,
      totalHoursBehind: debt.totalHoursBehind + 0.5,
      compoundingScore: Math.min(100, debt.compoundingScore + 8)
    };
    setDebt(nextDebt);
    await persist("debt", nextDebt);

    showSuccess("Task schedule renegotiated & notifications updated.");
  };

  const deleteTask = async (id: string) => {
    if (!currentUser) return;
    const next = tasks.filter((t) => t.id !== id);
    setTasks(next);
    await persist("tasks", next);
    await cancelItemNotifications(currentUser.id, id);
    showSuccess("Task removed.");
  };

  const logEvidence = async (entryData: Omit<EvidenceEntry, "id" | "dateLogged">) => {
    if (!currentUser) return;
    const newEntry: EvidenceEntry = {
      ...entryData,
      id: `ev-${Date.now()}`,
      dateLogged: new Date().toISOString()
    };
    const next = [newEntry, ...evidenceEntries];
    setEvidenceEntries(next);
    await persist("evidence", next);
    showSuccess("Outcome logged in Evidence Case File!");
  };

  const addStudyLog = async (logData: Omit<StudyLog, "id" | "loggedAt">) => {
    if (!currentUser) return;
    const newLog: StudyLog = {
      ...logData,
      id: `study-${Date.now()}`,
      loggedAt: new Date().toISOString()
    };
    const next = [newLog, ...studyLogs];
    setStudyLogs(next);
    await persist("study", next);
    showSuccess(`Logged ${newLog.durationMinutes} minutes of study for ${newLog.subject}!`);
  };

  const deleteStudyLog = async (id: string) => {
    if (!currentUser) return;
    const next = studyLogs.filter((l) => l.id !== id);
    setStudyLogs(next);
    await persist("study", next);
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!currentUser) return;
    const next = { ...settings, ...newSettings };
    setSettings(next);
    await persist("settings", next);
    showSuccess("Settings updated.");
  };

  const updateNotificationSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!currentUser) return;
    const next = { ...notificationSettings, ...newSettings };
    setNotificationSettings(next);
    await persist("notifSettings", next);
    showSuccess("Notification preferences saved.");
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
  };

  const resetAllData = async () => {
    if (!currentUser) return;
    setSlots([]);
    setTasks([]);
    setEvidenceEntries([]);
    setStudyLogs([]);
    setDebt(emptyDebt);
    setSettings(emptySettings);
    setNotificationSettings(defaultNotificationSettings);

    if (!currentUser.isDemo) {
      await deleteAllUserData(currentUser.id);
      (Object.keys(LOCAL_KEYS) as CollectionKey[]).forEach((k) => {
        localStorage.removeItem(`${LOCAL_KEYS[k]}_${currentUser.id}`);
      });
    }
    showSuccess("All data reset for active account.");
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