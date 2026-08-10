import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  TimetableSlot, 
  Task, 
  EvidenceEntry, 
  StudyLog,
  ProcrastinationDebt, 
  UserSettings,
  StrictnessTag,
  StakesTag,
  TaskType,
  TaskCategory,
  TaskStatus,
  NotificationSettings
} from '@/types/ripple';
import { calculateTaskStatus } from '@/utils/timeUtils';
import { showSuccess, showError } from '@/utils/toast';
import { PERSONAS_MAP } from '@/data/ripplePersonaData';
import { supabase } from '@/integrations/supabase/client';
import { 
  registerServiceWorker, 
  scheduleTaskNotifications, 
  scheduleClassNotifications, 
  cancelItemNotifications, 
  getNextSlotDateISO 
} from '@/utils/notificationService';

export interface UserAccount {
  id: string;
  email: string;
  isDemo?: boolean;
  demoPersonaId?: string;
  isLocalSession?: boolean;
}

interface AuthResponse {
  success: boolean;
  error?: string;
}

interface RippleContextType {
  currentUser: UserAccount | null;
  slots: TimetableSlot[];
  tasks: Task[];
  evidenceEntries: EvidenceEntry[];
  studyLogs: StudyLog[];
  debt: ProcrastinationDebt;
  settings: UserSettings;
  notificationSettings: NotificationSettings;
  currentPersonaId: string;
  activeTaskForPrediction: Task | null;
  activeFocusTask: Task | null;
  completedTaskForCelebration: Task | null;
  isLoadingData: boolean;

  // Notification Modal
  isNotificationModalOpen: boolean;
  setNotificationModalOpen: (open: boolean) => void;
  updateNotificationSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;

  // Tutorial State
  isTutorialOpen: boolean;
  currentTutorialStep: number;
  hasCompletedTutorial: boolean;
  startTutorial: () => void;
  replayTutorial: () => void;
  closeTutorial: () => void;
  completeTutorial: () => void;
  setTutorialStep: (step: number) => void;
  
  // Auth actions
  loginWithEmail: (email: string, password: string) => Promise<AuthResponse>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResponse>;
  loginDemoAccount: (personaId: string) => void;
  logout: () => void;

  setActiveTaskForPrediction: (task: Task | null) => void;
  setActiveFocusTask: (task: Task | null) => void;
  setCompletedTaskForCelebration: (task: Task | null) => void;
  
  // Slot management
  addSlot: (slot: Omit<TimetableSlot, 'id'>) => Promise<void>;
  updateSlot: (slot: TimetableSlot) => Promise<void>;
  deleteSlot: (id: string) => Promise<void>;

  // Task management
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateTaskProgress: (taskId: string, percentage: number) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  renegotiateTask: (taskId: string, newDueDate: string, reason: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Evidence log management
  logEvidence: (entry: Omit<EvidenceEntry, 'id' | 'dateLogged'>) => Promise<void>;

  // Study Tracker management
  addStudyLog: (log: Omit<StudyLog, 'id' | 'loggedAt'>) => Promise<void>;
  deleteStudyLog: (id: string) => Promise<void>;

  // Settings
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  
  // Persona actions
  loadPersonaData: (personaId: string) => void;
  resetAllData: () => void;
}

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

function safeGetStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key) || sessionStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSetStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key} to storage:`, error);
  }
}

function getLocalUserId(email: string): string {
  const clean = email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  return `usr_${clean}`;
}

const RippleContext = createContext<RippleContextType | undefined>(undefined);

export const RippleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    safeGetStorage<UserAccount | null>('ripple_active_user', null)
  );

  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  const [currentPersonaId, setCurrentPersonaId] = useState<string>('riya');
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntry[]>([]);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [debt, setDebt] = useState<ProcrastinationDebt>(emptyDebt);
  const [settings, setSettings] = useState<UserSettings>(emptySettings);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);

  const [isNotificationModalOpen, setNotificationModalOpen] = useState<boolean>(false);

  const [activeTaskForPrediction, setActiveTaskForPrediction] = useState<Task | null>(null);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [completedTaskForCelebration, setCompletedTaskForCelebration] = useState<Task | null>(null);

  // Tutorial State
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState<number>(0);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState<boolean>(false);

  // Register SW on load
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Load account data from local storage or Supabase
  const loadAccountData = async (user: UserAccount) => {
    setIsLoadingData(true);
    const uKey = user.id;

    if (user.isDemo && user.demoPersonaId) {
      const persona = PERSONAS_MAP[user.demoPersonaId] || defaultPersona;
      setSlots(persona.slots);
      setTasks(persona.tasks);
      setEvidenceEntries(persona.evidenceEntries);
      setStudyLogs(initialStudyLogs);
      setDebt(persona.debt);
      setSettings(persona.settings);
      setNotificationSettings(defaultNotificationSettings);
      setCurrentPersonaId(persona.id);
      setHasCompletedTutorial(safeGetStorage(`ripple_tutorial_completed_${uKey}`, false));
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

    if (localSlots !== null) setSlots(localSlots);
    else setSlots([]);

    if (localTasks !== null) setTasks(localTasks);
    else setTasks([]);

    if (localEvidence !== null) setEvidenceEntries(localEvidence);
    else setEvidenceEntries([]);

    if (localStudy !== null) setStudyLogs(localStudy);
    else setStudyLogs(initialStudyLogs);

    if (localDebt !== null) setDebt(localDebt);
    else setDebt(emptyDebt);

    if (localSettings !== null) setSettings(localSettings);
    else setSettings(emptySettings);

    if (localNotifSettings !== null) setNotificationSettings(localNotifSettings);
    else setNotificationSettings(defaultNotificationSettings);

    setHasCompletedTutorial(safeGetStorage(`ripple_tutorial_completed_${uKey}`, false));

    setIsLoadingData(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !currentUser?.isLocalSession) {
        const acc: UserAccount = {
          id: session.user.id,
          email: session.user.email || '',
          isDemo: false
        };
        setCurrentUser(acc);
        safeSetStorage('ripple_active_user', acc);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !currentUser?.isLocalSession) {
        const acc: UserAccount = {
          id: session.user.id,
          email: session.user.email || '',
          isDemo: false
        };
        setCurrentUser(acc);
        safeSetStorage('ripple_active_user', acc);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      safeSetStorage('ripple_active_user', currentUser);
      loadAccountData(currentUser);
    }
  }, [currentUser?.id]);

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
      safeSetStorage(`ripple_tutorial_completed_${uKey}`, hasCompletedTutorial);
    }
  }, [slots, tasks, evidenceEntries, studyLogs, debt, settings, notificationSettings, hasCompletedTutorial]);

  // Dynamic status updater ticker
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

  const startTutorial = () => {
    setCurrentTutorialStep(0);
    setIsTutorialOpen(true);
  };

  const replayTutorial = () => {
    setCurrentTutorialStep(0);
    setIsTutorialOpen(true);
  };

  const closeTutorial = () => {
    setIsTutorialOpen(false);
  };

  const completeTutorial = () => {
    setHasCompletedTutorial(true);
    setIsTutorialOpen(false);
    if (currentUser) {
      safeSetStorage(`ripple_tutorial_completed_${currentUser.id}`, true);
    }
    showSuccess('Tutorial completed!');
  };

  const setTutorialStep = (step: number) => {
    setCurrentTutorialStep(step);
  };

  const loginWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    try {
      const { data } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (data?.user) {
        const acc: UserAccount = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          isDemo: false
        };
        setCurrentUser(acc);
        safeSetStorage('ripple_active_user', acc);
        showSuccess(`Signed in as ${cleanEmail}`);
        return { success: true };
      }
    } catch (e) {
      console.warn('Auth exception, fallback to local session:', e);
    }

    const localId = getLocalUserId(cleanEmail);
    const localAcc: UserAccount = {
      id: localId,
      email: cleanEmail,
      isDemo: false,
      isLocalSession: true
    };
    setCurrentUser(localAcc);
    safeSetStorage('ripple_active_user', localAcc);
    showSuccess(`Signed in as ${cleanEmail}`);
    return { success: true };
  };

  const signUpWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    try {
      const { data } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password
      });

      if (data?.user) {
        const acc: UserAccount = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          isDemo: false
        };
        setCurrentUser(acc);
        safeSetStorage('ripple_active_user', acc);
        showSuccess(`Account created & signed in!`);
        return { success: true };
      }
    } catch (e) {
      console.warn('Signup exception, fallback to local session:', e);
    }

    const localId = getLocalUserId(cleanEmail);
    const localAcc: UserAccount = {
      id: localId,
      email: cleanEmail,
      isDemo: false,
      isLocalSession: true
    };
    setCurrentUser(localAcc);
    safeSetStorage('ripple_active_user', localAcc);
    showSuccess(`Account created & signed in!`);
    return { success: true };
  };

  const loginDemoAccount = (personaId: string) => {
    const persona = PERSONAS_MAP[personaId] || defaultPersona;
    const account: UserAccount = {
      id: `demo_${persona.id}`,
      email: `${persona.id}@demo.ripple`,
      isDemo: true,
      demoPersonaId: persona.id
    };
    setCurrentUser(account);
    safeSetStorage('ripple_active_user', account);
    showSuccess(`Viewing Demo Persona: ${persona.name}`);
  };

  const logout = async () => {
    try {
      if (currentUser && !currentUser.isDemo && !currentUser.isLocalSession) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error('Error signing out:', e);
    } finally {
      localStorage.removeItem('ripple_active_user');
      sessionStorage.removeItem('ripple_active_user');
      setCurrentUser(null);
      setSlots([]);
      setTasks([]);
      setEvidenceEntries([]);
      setStudyLogs([]);
      setDebt(emptyDebt);
      setSettings(emptySettings);
      setActiveTaskForPrediction(null);
      setActiveFocusTask(null);
      setCompletedTaskForCelebration(null);
      showSuccess('Signed out successfully.');
    }
  };

  const addSlot = async (slotData: Omit<TimetableSlot, 'id'>) => {
    if (!currentUser) return;

    const newSlot: TimetableSlot = {
      ...slotData,
      id: `slot-${Date.now()}`
    };
    const updatedSlots = [...slots, newSlot];
    setSlots(updatedSlots);
    if (!currentUser.isDemo) {
      safeSetStorage(`ripple_slots_${currentUser.id}`, updatedSlots);
    }

    const nextClassISO = getNextSlotDateISO(newSlot.dayOfWeek, newSlot.startTime);
    await scheduleClassNotifications(currentUser.id, newSlot, nextClassISO, notificationSettings);

    showSuccess(`Timetable slot for ${newSlot.subject} created with reminders.`);
  };

  const updateSlot = async (updatedSlot: TimetableSlot) => {
    if (!currentUser) return;

    const updatedSlots = slots.map((s) => (s.id === updatedSlot.id ? updatedSlot : s));
    setSlots(updatedSlots);
    if (!currentUser.isDemo) {
      safeSetStorage(`ripple_slots_${currentUser.id}`, updatedSlots);
    }

    const nextClassISO = getNextSlotDateISO(updatedSlot.dayOfWeek, updatedSlot.startTime);
    await scheduleClassNotifications(currentUser.id, updatedSlot, nextClassISO, notificationSettings);

    showSuccess(`Updated ${updatedSlot.subject} class schedule.`);
  };

  const deleteSlot = async (id: string) => {
    if (!currentUser) return;

    const updatedSlots = slots.filter((s) => s.id !== id);
    setSlots(updatedSlots);
    if (!currentUser.isDemo) {
      safeSetStorage(`ripple_slots_${currentUser.id}`, updatedSlots);
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

    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    if (!currentUser.isDemo) {
      safeSetStorage(`ripple_tasks_${currentUser.id}`, updatedTasks);
    }

    if (newTask.hasDeadline && newTask.dueDate) {
      await scheduleTaskNotifications(currentUser.id, newTask, notificationSettings);
    }

    showSuccess(`Activity "${newTask.title}" added successfully.`);
  };

  const updateTaskProgress = async (taskId: string, percentage: number) => {
    if (!currentUser) return;

    let updatedTaskRef: Task | null = null;

    const updatedTasks = tasks.map((t) => {
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

        updatedTaskRef = updatedTask;

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
              safeSetStorage(`ripple_debt_${currentUser.id}`, newDebt);
            }
            return newDebt;
          });
        }

        return updatedTask;
      }
      return t;
    });

    setTasks(updatedTasks);
    if (!currentUser.isDemo) {
      safeSetStorage(`ripple_tasks_${currentUser.id}`, updatedTasks);
    }
  };

  const completeTask = async (taskId: string) => {
    await updateTaskProgress(taskId, 100);
  };

  const renegotiateTask = async (taskId: string, newDueDate: string, reason: string) => {
    if (!currentUser) return;

    let updatedTaskObj: Task | null = null;

    const updatedTasks = tasks.map((t) => {
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
    });

    setTasks(updatedTasks);
    if (!currentUser.isDemo) {
      safeSetStorage(`ripple_tasks_${currentUser.id}`, updatedTasks);
    }

    if (updatedTaskObj) {
      await scheduleTaskNotifications(currentUser.id, updatedTaskObj, notificationSettings);
    }

    const updatedDebt = {
      ...debt,
      totalHoursBehind: debt.totalHoursBehind + 0.5,
      compoundingScore: Math.min(100, debt.compoundingScore + 8)
    };
    setDebt(updatedDebt);
    if (!currentUser.isDemo) {
      safeSetStorage(`ripple_debt_${currentUser.id}`, updatedDebt);
    }

    showSuccess('Task schedule renegotiated & notifications updated.');
  };

  const deleteTask = async (id: string) => {
    if (!currentUser) return;

    const updatedTasks = tasks.filter((t) => t.id !== id);
    setTasks(updatedTasks);
    if (!currentUser.isDemo) {
      safeSetStorage(`ripple_tasks_${currentUser.id}`, updatedTasks);
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
    const updatedEvidence = [newEntry, ...evidenceEntries];
    setEvidenceEntries(updatedEvidence);
    if (!currentUser.isDemo) {
      safeSetStorage(`ripple_evidence_${currentUser.id}`, updatedEvidence);
    }
    showSuccess('Outcome logged in Evidence Case File!');
  };

  const addStudyLog = async (logData: Omit<StudyLog, 'id' | 'loggedAt'>) => {
    if (!currentUser) return;

    const newLog: StudyLog = {
      ...logData,
      id: `study-${Date.now()}`,
      loggedAt: new Date().toISOString()
    };
    const updatedLogs = [newLog, ...studyLogs];
    setStudyLogs(updatedLogs);
    if (!currentUser.isDemo) {
      safeSetStorage(`ripple_study_${currentUser.id}`, updatedLogs);
    }
    showSuccess(`Logged ${newLog.durationMinutes} minutes of study for ${newLog.subject}!`);
  };

  const deleteStudyLog = async (id: string) => {
    if (!currentUser) return;

    const updatedLogs = studyLogs.filter((l) => l.id !== id);
    setStudyLogs(updatedLogs);
    if (!currentUser.isDemo) {
      safeSetStorage(`ripple_study_${currentUser.id}`, updatedLogs);
    }
    showSuccess('Study entry removed.');
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!currentUser) return;

    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    if (!currentUser.isDemo) {
      safeSetStorage(`ripple_settings_${currentUser.id}`, merged);
    }

    showSuccess('Settings updated.');
  };

  const updateNotificationSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!currentUser) return;

    const merged = { ...notificationSettings, ...newSettings };
    setNotificationSettings(merged);
    if (!currentUser.isDemo) {
      safeSetStorage(`ripple_notif_settings_${currentUser.id}`, merged);
    }

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
  };

  const resetAllData = () => {
    setSlots([]);
    setTasks([]);
    setEvidenceEntries([]);
    setStudyLogs([]);
    setDebt(emptyDebt);
    if (currentUser && !currentUser.isDemo) {
      safeSetStorage(`ripple_slots_${currentUser.id}`, []);
      safeSetStorage(`ripple_tasks_${currentUser.id}`, []);
      safeSetStorage(`ripple_evidence_${currentUser.id}`, []);
      safeSetStorage(`ripple_study_${currentUser.id}`, []);
      safeSetStorage(`ripple_debt_${currentUser.id}`, emptyDebt);
    }
    showSuccess('All data reset for active account.');
  };

  return (
    <RippleContext.Provider
      value={{
        currentUser,
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
        updateNotificationSettings,
        isTutorialOpen,
        currentTutorialStep,
        hasCompletedTutorial,
        startTutorial,
        replayTutorial,
        closeTutorial,
        completeTutorial,
        setTutorialStep,
        loginWithEmail,
        signUpWithEmail,
        loginDemoAccount,
        logout,
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
        loadPersonaData,
        resetAllData
      }}
    >
      {children}
    </RippleContext.Provider>
  );
};

export const useRipple = () => {
  const context = useContext(RippleContext);
  if (!context) {
    throw new Error('useRipple must be used within a RippleProvider');
  }
  return context;
};