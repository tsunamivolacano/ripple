import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  TimetableSlot, 
  Task, 
  EvidenceEntry, 
  ProcrastinationDebt, 
  UserSettings,
  StrictnessTag,
  StakesTag,
  TaskType,
  TaskCategory,
  TaskStatus
} from '@/types/ripple';
import { calculateTaskStatus } from '@/utils/timeUtils';
import { showSuccess, showError } from '@/utils/toast';
import { PERSONAS_MAP } from '@/data/ripplePersonaData';
import { supabase } from '@/integrations/supabase/client';

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
  debt: ProcrastinationDebt;
  settings: UserSettings;
  currentPersonaId: string;
  activeTaskForPrediction: Task | null;
  activeFocusTask: Task | null;
  completedTaskForCelebration: Task | null;
  isLoadingData: boolean;

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

  // Settings
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  
  // Persona actions
  loadPersonaData: (personaId: string) => void;
  resetAllData: () => void;
}

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

// Storage Helper
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

function purgeAllStorageData() {
  try {
    const localKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ripple_')) {
        localKeysToRemove.push(key);
      }
    }
    localKeysToRemove.forEach((k) => localStorage.removeItem(k));

    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('ripple_')) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch (err) {
    console.error('Error purging local storage keys:', err);
  }
}

// Generate deterministic local ID for email
function getLocalUserId(email: string): string {
  const clean = email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  return `usr_local_${clean}`;
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
  const [debt, setDebt] = useState<ProcrastinationDebt>(emptyDebt);
  const [settings, setSettings] = useState<UserSettings>(emptySettings);

  const [activeTaskForPrediction, setActiveTaskForPrediction] = useState<Task | null>(null);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [completedTaskForCelebration, setCompletedTaskForCelebration] = useState<Task | null>(null);

  // Tutorial State
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState<number>(0);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState<boolean>(false);

  // Load data for user from Supabase
  const fetchUserDataFromSupabase = async (userId: string) => {
    setIsLoadingData(true);
    try {
      // 1. Fetch Slots
      const { data: dbSlots, error: slotsErr } = await supabase
        .from('timetable_slots')
        .select('*')
        .eq('user_id', userId);

      if (!slotsErr && dbSlots && dbSlots.length > 0) {
        setSlots(
          dbSlots.map((s) => ({
            id: s.id,
            subject: s.subject,
            dayOfWeek: s.day_of_week as TimetableSlot['dayOfWeek'],
            startTime: s.start_time,
            endTime: s.end_time,
            room: s.room || '',
            teacherName: s.teacher_name,
            strictnessTag: s.strictness_tag as StrictnessTag,
            stakesTag: s.stakes_tag as StakesTag,
            weight: Number(s.weight || 25),
            notes: s.notes || undefined
          }))
        );
      } else {
        setSlots(safeGetStorage(`ripple_slots_${userId}`, []));
      }

      // 2. Fetch Tasks
      const { data: dbTasks, error: tasksErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!tasksErr && dbTasks && dbTasks.length > 0) {
        setTasks(
          dbTasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description || undefined,
            slotId: t.slot_id || undefined,
            dueDate: t.due_date,
            estimatedHours: Number(t.estimated_hours || 1),
            completionPercentage: Number(t.completion_percentage || 0),
            taskType: t.task_type as TaskType,
            category: (t.category || 'academic') as TaskCategory,
            status: t.status as TaskStatus,
            createdAt: t.created_at,
            completedAt: t.completed_at || undefined,
            renegotiatedCount: t.renegotiated_count || 0,
            lastRenegotiatedAt: t.last_renegotiated_at || undefined
          }))
        );
      } else {
        setTasks(safeGetStorage(`ripple_tasks_${userId}`, []));
      }

      // 3. Fetch Evidence Entries
      const { data: dbEvidence, error: evErr } = await supabase
        .from('evidence_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date_logged', { ascending: false });

      if (!evErr && dbEvidence && dbEvidence.length > 0) {
        setEvidenceEntries(
          dbEvidence.map((e) => ({
            id: e.id,
            taskId: e.task_id || '',
            taskTitle: e.task_title,
            subject: e.subject,
            teacherName: e.teacher_name,
            predictedScenario: e.predicted_scenario,
            actualOutcome: e.actual_outcome,
            wasOnTime: e.was_on_time,
            accuracyRating: e.accuracy_rating,
            dateLogged: e.date_logged,
            userNotes: e.user_notes || undefined
          }))
        );
      } else {
        setEvidenceEntries(safeGetStorage(`ripple_evidence_${userId}`, []));
      }

      // 4. Fetch User Settings
      const { data: dbSettings, error: setErr } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!setErr && dbSettings) {
        setSettings({
          intensityMode: dbSettings.intensity_mode as UserSettings['intensityMode'],
          isMinorProfile: dbSettings.is_minor_profile,
          weeklyDigestOnly: dbSettings.weekly_digest_only,
          personalVelocityMultiplier: Number(dbSettings.personal_velocity_multiplier || 1.0)
        });
        setHasCompletedTutorial(!!dbSettings.has_completed_tutorial);
      } else {
        setSettings(safeGetStorage(`ripple_settings_${userId}`, emptySettings));
      }

      // 5. Fetch User Debt
      const { data: dbDebt, error: debtErr } = await supabase
        .from('user_debt')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!debtErr && dbDebt) {
        setDebt({
          totalHoursBehind: Number(dbDebt.total_hours_behind || 0),
          missedDeadlinesCount: Number(dbDebt.missed_deadlines_count || 0),
          streakDays: Number(dbDebt.streak_days || 0),
          compoundingScore: Number(dbDebt.compounding_score || 0),
          weeklyDebtTrend: Array.isArray(dbDebt.weekly_debt_trend) ? dbDebt.weekly_debt_trend : []
        });
      } else {
        setDebt(safeGetStorage(`ripple_debt_${userId}`, emptyDebt));
      }
    } catch (err) {
      console.warn('Supabase tables not initialized or offline. Falling back to local data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Monitor Supabase Auth Session State Changes
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

  // Fetch data whenever active user session changes
  useEffect(() => {
    if (currentUser) {
      safeSetStorage('ripple_active_user', currentUser);
      const uKey = currentUser.id;

      if (currentUser.isDemo && currentUser.demoPersonaId) {
        const persona = PERSONAS_MAP[currentUser.demoPersonaId] || PERSONAS_MAP['riya'];
        setSlots(safeGetStorage(`ripple_slots_${uKey}`, persona.slots));
        setTasks(safeGetStorage(`ripple_tasks_${uKey}`, persona.tasks));
        setEvidenceEntries(safeGetStorage(`ripple_evidence_${uKey}`, persona.evidenceEntries));
        setDebt(safeGetStorage(`ripple_debt_${uKey}`, persona.debt));
        setSettings(safeGetStorage(`ripple_settings_${uKey}`, persona.settings));
        setCurrentPersonaId(persona.id);
        const comp = safeGetStorage(`ripple_tutorial_completed_${uKey}`, false);
        setHasCompletedTutorial(comp);
      } else if (currentUser.isLocalSession) {
        setSlots(safeGetStorage(`ripple_slots_${uKey}`, []));
        setTasks(safeGetStorage(`ripple_tasks_${uKey}`, []));
        setEvidenceEntries(safeGetStorage(`ripple_evidence_${uKey}`, []));
        setDebt(safeGetStorage(`ripple_debt_${uKey}`, emptyDebt));
        setSettings(safeGetStorage(`ripple_settings_${uKey}`, emptySettings));
        setHasCompletedTutorial(safeGetStorage(`ripple_tutorial_completed_${uKey}`, false));
      } else {
        fetchUserDataFromSupabase(currentUser.id);
      }
    }
  }, [currentUser]);

  // Persist Local/Demo changes to local Storage
  useEffect(() => {
    if (currentUser) {
      const uKey = currentUser.id;
      safeSetStorage(`ripple_slots_${uKey}`, slots);
      safeSetStorage(`ripple_tasks_${uKey}`, tasks);
      safeSetStorage(`ripple_evidence_${uKey}`, evidenceEntries);
      safeSetStorage(`ripple_debt_${uKey}`, debt);
      safeSetStorage(`ripple_settings_${uKey}`, settings);
      safeSetStorage(`ripple_tutorial_completed_${uKey}`, hasCompletedTutorial);
    }
  }, [slots, tasks, evidenceEntries, debt, settings, hasCompletedTutorial, currentUser]);

  // Dynamic status updater ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTasks((prevTasks) =>
        prevTasks.map((t) => {
          if (t.status === 'completed' || t.status === 'renegotiated') return t;
          const newStatus = calculateTaskStatus(t.dueDate, t.estimatedHours, t.completionPercentage, settings.personalVelocityMultiplier);
          return { ...t, status: newStatus };
        })
      );
    }, 30000);
    return () => clearInterval(timer);
  }, [settings.personalVelocityMultiplier]);

  // Tutorial Actions
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
      if (!currentUser.isDemo && !currentUser.isLocalSession) {
        supabase
          .from('user_settings')
          .upsert({ user_id: currentUser.id, has_completed_tutorial: true })
          .then();
      }
    }
    showSuccess('Tutorial completed! You are ready to master RIPPLE.');
  };

  const setTutorialStep = (step: number) => {
    setCurrentTutorialStep(step);
  };

  // Login Handler
  const loginWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
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

      if (error) {
        console.warn('Supabase Auth error/rate-limit. Provisioning local user session:', error.message);
      }
    } catch (e) {
      console.warn('Auth exception, creating local user session:', e);
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
      const { data, error } = await supabase.auth.signUp({
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

      if (error) {
        console.warn('Supabase Signup error/rate-limit. Provisioning local user session:', error.message);
      }
    } catch (e) {
      console.warn('Signup exception, creating local user session:', e);
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
    const persona = PERSONAS_MAP[personaId] || PERSONAS_MAP['riya'];
    const account: UserAccount = {
      id: `demo_${persona.id}`,
      email: `${persona.id}@demo.ripple`,
      isDemo: true,
      demoPersonaId: persona.id
    };
    safeSetStorage('ripple_active_user', account);
    setCurrentUser(account);
    showSuccess(`Viewing Demo Persona: ${persona.name}`);
  };

  const logout = async () => {
    try {
      if (!currentUser?.isDemo && !currentUser?.isLocalSession) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error('Error signing out:', e);
    } finally {
      purgeAllStorageData();
      setCurrentUser(null);
      setSlots([]);
      setTasks([]);
      setEvidenceEntries([]);
      setDebt(emptyDebt);
      setSettings(emptySettings);
      setActiveTaskForPrediction(null);
      setActiveFocusTask(null);
      setCompletedTaskForCelebration(null);
      showSuccess('Signed out completely.');
    }
  };

  const addSlot = async (slotData: Omit<TimetableSlot, 'id'>) => {
    if (!currentUser) return;

    const newSlot: TimetableSlot = {
      ...slotData,
      id: `slot-${Date.now()}`
    };
    setSlots((prev) => [...prev, newSlot]);
    showSuccess(`Timetable slot for ${newSlot.subject} created.`);

    if (!currentUser.isDemo && !currentUser.isLocalSession) {
      await supabase.from('timetable_slots').insert({
        user_id: currentUser.id,
        subject: slotData.subject,
        day_of_week: slotData.dayOfWeek,
        start_time: slotData.startTime,
        end_time: slotData.endTime,
        room: slotData.room,
        teacher_name: slotData.teacherName,
        strictness_tag: slotData.strictnessTag,
        stakes_tag: slotData.stakesTag,
        weight: slotData.weight,
        notes: slotData.notes
      });
    }
  };

  const updateSlot = async (updatedSlot: TimetableSlot) => {
    if (!currentUser) return;

    setSlots((prev) => prev.map((s) => (s.id === updatedSlot.id ? updatedSlot : s)));

    if (!currentUser.isDemo && !currentUser.isLocalSession) {
      await supabase
        .from('timetable_slots')
        .update({
          subject: updatedSlot.subject,
          day_of_week: updatedSlot.dayOfWeek,
          start_time: updatedSlot.startTime,
          end_time: updatedSlot.endTime,
          room: updatedSlot.room,
          teacher_name: updatedSlot.teacherName,
          strictness_tag: updatedSlot.strictnessTag,
          stakes_tag: updatedSlot.stakesTag,
          weight: updatedSlot.weight,
          notes: updatedSlot.notes
        })
        .eq('id', updatedSlot.id)
        .eq('user_id', currentUser.id);
    }

    showSuccess(`Updated ${updatedSlot.subject} slot.`);
  };

  const deleteSlot = async (id: string) => {
    if (!currentUser) return;

    setSlots((prev) => prev.filter((s) => s.id !== id));

    if (!currentUser.isDemo && !currentUser.isLocalSession) {
      await supabase
        .from('timetable_slots')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);
    }

    showSuccess('Timetable slot removed.');
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    if (!currentUser) return;

    const computedStatus = calculateTaskStatus(
      taskData.dueDate,
      taskData.estimatedHours,
      taskData.completionPercentage,
      settings.personalVelocityMultiplier
    );

    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: computedStatus
    };
    setTasks((prev) => [newTask, ...prev]);
    showSuccess(`Task "${newTask.title}" added to War Room.`);

    if (!currentUser.isDemo && !currentUser.isLocalSession) {
      await supabase.from('tasks').insert({
        user_id: currentUser.id,
        title: taskData.title,
        description: taskData.description,
        slot_id: taskData.slotId || null,
        due_date: taskData.dueDate,
        estimated_hours: taskData.estimatedHours,
        completion_percentage: taskData.completionPercentage,
        task_type: taskData.taskType,
        category: taskData.category || 'academic',
        status: computedStatus
      });
    }
  };

  const updateTaskProgress = async (taskId: string, percentage: number) => {
    if (!currentUser) return;

    let updatedTaskRef: Task | null = null;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isComplete = percentage >= 100;
          const updatedStatus = isComplete
            ? 'completed'
            : calculateTaskStatus(t.dueDate, t.estimatedHours, percentage, settings.personalVelocityMultiplier);

          const updatedTask = {
            ...t,
            completionPercentage: percentage,
            status: updatedStatus,
            completedAt: isComplete ? new Date().toISOString() : t.completedAt
          };

          updatedTaskRef = updatedTask;

          if (isComplete) {
            setCompletedTaskForCelebration(updatedTask);
            setDebt((d) => ({
              ...d,
              streakDays: d.streakDays + 1,
              compoundingScore: Math.max(0, d.compoundingScore - 5)
            }));
          }

          return updatedTask;
        }
        return t;
      })
    );

    if (!currentUser.isDemo && !currentUser.isLocalSession && updatedTaskRef) {
      const taskObj: Task = updatedTaskRef;
      await supabase
        .from('tasks')
        .update({
          completion_percentage: taskObj.completionPercentage,
          status: taskObj.status,
          completed_at: taskObj.completedAt || null
        })
        .eq('id', taskId)
        .eq('user_id', currentUser.id);
    }
  };

  const completeTask = async (taskId: string) => {
    await updateTaskProgress(taskId, 100);
  };

  const renegotiateTask = async (taskId: string, newDueDate: string, reason: string) => {
    if (!currentUser) return;

    let updatedTaskObj: Task | null = null;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const count = (t.renegotiatedCount || 0) + 1;
          const newStatus = calculateTaskStatus(newDueDate, t.estimatedHours, t.completionPercentage, settings.personalVelocityMultiplier);
          const obj: Task = {
            ...t,
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

    setDebt((prev) => ({
      ...prev,
      totalHoursBehind: prev.totalHoursBehind + 0.5,
      compoundingScore: Math.min(100, prev.compoundingScore + 8)
    }));

    if (!currentUser.isDemo && !currentUser.isLocalSession && updatedTaskObj) {
      const taskToSync: Task = updatedTaskObj;
      await supabase
        .from('tasks')
        .update({
          due_date: newDueDate,
          renegotiated_count: taskToSync.renegotiatedCount,
          last_renegotiated_at: taskToSync.lastRenegotiatedAt,
          status: taskToSync.status
        })
        .eq('id', taskId)
        .eq('user_id', currentUser.id);
    }

    showSuccess('Task schedule renegotiated.');
  };

  const deleteTask = async (id: string) => {
    if (!currentUser) return;

    setTasks((prev) => prev.filter((t) => t.id !== id));

    if (!currentUser.isDemo && !currentUser.isLocalSession) {
      await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);
    }

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
    showSuccess('Outcome logged in Evidence Case File!');

    if (!currentUser.isDemo && !currentUser.isLocalSession) {
      await supabase.from('evidence_entries').insert({
        user_id: currentUser.id,
        task_id: entryData.taskId,
        task_title: entryData.taskTitle,
        subject: entryData.subject,
        teacher_name: entryData.teacherName,
        predicted_scenario: entryData.predictedScenario,
        actual_outcome: entryData.actualOutcome,
        was_on_time: entryData.wasOnTime,
        accuracy_rating: entryData.accuracyRating,
        user_notes: entryData.userNotes
      });
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!currentUser) return;

    const merged = { ...settings, ...newSettings };
    setSettings(merged);

    if (!currentUser.isDemo && !currentUser.isLocalSession) {
      await supabase.from('user_settings').upsert({
        user_id: currentUser.id,
        intensity_mode: merged.intensityMode,
        is_minor_profile: merged.isMinorProfile,
        weekly_digest_only: merged.weeklyDigestOnly,
        personal_velocity_multiplier: merged.personalVelocityMultiplier
      });
    }

    showSuccess('Settings updated.');
  };

  const loadPersonaData = (personaId: string) => {
    const bundle = PERSONAS_MAP[personaId] || PERSONAS_MAP['riya'];
    setCurrentPersonaId(bundle.id);
    setSlots(bundle.slots);
    setTasks(bundle.tasks);
    setEvidenceEntries(bundle.evidenceEntries);
    setDebt(bundle.debt);
    setSettings(bundle.settings);
    showSuccess(`Loaded template data: ${bundle.name}`);
  };

  const resetAllData = () => {
    setSlots([]);
    setTasks([]);
    setEvidenceEntries([]);
    setDebt(emptyDebt);
    showSuccess('All data reset.');
  };

  return (
    <RippleContext.Provider
      value={{
        currentUser,
        slots,
        tasks,
        evidenceEntries,
        debt,
        settings,
        currentPersonaId,
        activeTaskForPrediction,
        activeFocusTask,
        completedTaskForCelebration,
        isLoadingData,
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