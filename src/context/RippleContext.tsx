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

const defaultPersona = PERSONAS_MAP['riya'];

// Ephemeral Session Storage Helper for Demo Mode
function safeGetSessionStorage<T>(key: string, fallback: T): T {
  try {
    const saved = sessionStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSetSessionStorage<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key} to sessionStorage:`, error);
  }
}

// Function to thoroughly purge all app storage keys on logout
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

const RippleContext = createContext<RippleContextType | undefined>(undefined);

export const RippleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    safeGetSessionStorage<UserAccount | null>('ripple_demo_auth_user', null)
  );

  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  const [currentPersonaId, setCurrentPersonaId] = useState<string>('riya');
  const [slots, setSlots] = useState<TimetableSlot[]>(defaultPersona.slots);
  const [tasks, setTasks] = useState<Task[]>(defaultPersona.tasks);
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntry[]>(defaultPersona.evidenceEntries);
  const [debt, setDebt] = useState<ProcrastinationDebt>(defaultPersona.debt);
  const [settings, setSettings] = useState<UserSettings>(defaultPersona.settings);

  const [activeTaskForPrediction, setActiveTaskForPrediction] = useState<Task | null>(null);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [completedTaskForCelebration, setCompletedTaskForCelebration] = useState<Task | null>(null);

  // Tutorial State
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState<number>(0);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState<boolean>(false);

  // Load data for real authenticated user from Supabase or demo user from sessionStorage
  const fetchUserDataFromSupabase = async (userId: string) => {
    setIsLoadingData(true);
    try {
      // 1. Fetch Slots
      const { data: dbSlots } = await supabase
        .from('timetable_slots')
        .select('*')
        .eq('user_id', userId);

      if (dbSlots) {
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
      }

      // 2. Fetch Tasks
      const { data: dbTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (dbTasks) {
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
      }

      // 3. Fetch Evidence Entries
      const { data: dbEvidence } = await supabase
        .from('evidence_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date_logged', { ascending: false });

      if (dbEvidence) {
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
      }

      // 4. Fetch User Settings
      const { data: dbSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (dbSettings) {
        setSettings({
          intensityMode: dbSettings.intensity_mode as UserSettings['intensityMode'],
          isMinorProfile: dbSettings.is_minor_profile,
          weeklyDigestOnly: dbSettings.weekly_digest_only,
          personalVelocityMultiplier: Number(dbSettings.personal_velocity_multiplier || 1.0)
        });
        setHasCompletedTutorial(!!dbSettings.has_completed_tutorial);
      }

      // 5. Fetch User Debt
      const { data: dbDebt } = await supabase
        .from('user_debt')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (dbDebt) {
        setDebt({
          totalHoursBehind: Number(dbDebt.total_hours_behind || 0),
          missedDeadlinesCount: Number(dbDebt.missed_deadlines_count || 0),
          streakDays: Number(dbDebt.streak_days || 0),
          compoundingScore: Number(dbDebt.compounding_score || 0),
          weeklyDebtTrend: Array.isArray(dbDebt.weekly_debt_trend) ? dbDebt.weekly_debt_trend : []
        });
      }
    } catch (err) {
      console.error('Error fetching Supabase user data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Monitor Supabase Auth Session State Changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          email: session.user.email || '',
          isDemo: false
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          email: session.user.email || '',
          isDemo: false
        });
      } else if (!currentUser?.isDemo) {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data whenever active user session changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.isDemo && currentUser.demoPersonaId) {
        const persona = PERSONAS_MAP[currentUser.demoPersonaId] || defaultPersona;
        const uKey = currentUser.id;
        setSlots(safeGetSessionStorage(`ripple_slots_${uKey}`, persona.slots));
        setTasks(safeGetSessionStorage(`ripple_tasks_${uKey}`, persona.tasks));
        setEvidenceEntries(safeGetSessionStorage(`ripple_evidence_${uKey}`, persona.evidenceEntries));
        setDebt(safeGetSessionStorage(`ripple_debt_${uKey}`, persona.debt));
        setSettings(safeGetSessionStorage(`ripple_settings_${uKey}`, persona.settings));
        setCurrentPersonaId(persona.id);
        const comp = safeGetSessionStorage(`ripple_tutorial_completed_${uKey}`, false);
        setHasCompletedTutorial(comp);
        if (!comp) {
          setIsTutorialOpen(true);
          setCurrentTutorialStep(0);
        }
      } else {
        fetchUserDataFromSupabase(currentUser.id);
      }
    } else {
      setSlots([]);
      setTasks([]);
      setEvidenceEntries([]);
    }
  }, [currentUser]);

  // Save changes to SessionStorage if Demo Mode
  useEffect(() => {
    if (currentUser?.isDemo) {
      const uKey = currentUser.id;
      safeSetSessionStorage(`ripple_slots_${uKey}`, slots);
      safeSetSessionStorage(`ripple_tasks_${uKey}`, tasks);
      safeSetSessionStorage(`ripple_evidence_${uKey}`, evidenceEntries);
      safeSetSessionStorage(`ripple_debt_${uKey}`, debt);
      safeSetSessionStorage(`ripple_settings_${uKey}`, settings);
      safeSetSessionStorage(`ripple_tutorial_completed_${uKey}`, hasCompletedTutorial);
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
      if (currentUser.isDemo) {
        safeSetSessionStorage(`ripple_tutorial_completed_${currentUser.id}`, true);
      } else {
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

  // Direct Auth Logic: Bypasses email verification requirements completely for all users
  const loginWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const cleanEmail = email.trim();
      
      // Attempt primary sign in with password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (data?.user) {
        setCurrentUser({
          id: data.user.id,
          email: data.user.email || cleanEmail,
          isDemo: false
        });
        showSuccess(`Welcome back!`);
        return { success: true };
      }

      // If sign in fails due to email unconfirmed or rate limit, attempt signUp as fallback to retrieve user record
      if (error) {
        const errMsg = error.message.toLowerCase();
        if (
          errMsg.includes('confirm') ||
          errMsg.includes('verify') ||
          errMsg.includes('email') ||
          errMsg.includes('rate limit') ||
          errMsg.includes('credentials')
        ) {
          const signUpRes = await supabase.auth.signUp({
            email: cleanEmail,
            password: password
          });

          if (signUpRes.data?.user) {
            setCurrentUser({
              id: signUpRes.data.user.id,
              email: signUpRes.data.user.email || cleanEmail,
              isDemo: false
            });
            showSuccess(`Signed in successfully!`);
            return { success: true };
          }
        }
        return { success: false, error: error.message };
      }

      return { success: false, error: 'Invalid email or password.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const cleanEmail = email.trim();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password
      });

      if (data?.user) {
        setCurrentUser({
          id: data.user.id,
          email: data.user.email || cleanEmail,
          isDemo: false
        });
        showSuccess('Account created and signed in!');
        return { success: true };
      }

      if (error) {
        // If user already exists or rate limited, attempt sign-in or fallback user resolution
        const errMsg = error.message.toLowerCase();
        if (errMsg.includes('already') || errMsg.includes('rate limit') || errMsg.includes('registered')) {
          const signInRes = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: password
          });

          if (signInRes.data?.user) {
            setCurrentUser({
              id: signInRes.data.user.id,
              email: signInRes.data.user.email || cleanEmail,
              isDemo: false
            });
            showSuccess('Signed in successfully!');
            return { success: true };
          }
        }
        return { success: false, error: error.message };
      }

      return { success: false, error: 'Registration failed.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
  };

  const loginDemoAccount = (personaId: string) => {
    const persona = PERSONAS_MAP[personaId] || defaultPersona;
    const account: UserAccount = {
      id: `demo_${persona.id}`,
      email: `${persona.id}@demo.ripple`,
      isDemo: true,
      demoPersonaId: persona.id
    };
    safeSetSessionStorage('ripple_demo_auth_user', account);
    setCurrentUser(account);
    showSuccess(`Viewing Demo Persona: ${persona.name}`);
  };

  const logout = async () => {
    try {
      if (!currentUser?.isDemo) {
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
      setActiveTaskForPrediction(null);
      setActiveFocusTask(null);
      setCompletedTaskForCelebration(null);
      showSuccess('Signed out completely.');
    }
  };

  const addSlot = async (slotData: Omit<TimetableSlot, 'id'>) => {
    if (!currentUser) return;

    if (currentUser.isDemo) {
      const newSlot: TimetableSlot = {
        ...slotData,
        id: `slot-${Date.now()}`
      };
      setSlots((prev) => [...prev, newSlot]);
      showSuccess(`Timetable slot for ${newSlot.subject} created.`);
      return;
    }

    const { data, error } = await supabase
      .from('timetable_slots')
      .insert({
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
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to save slot: ${error.message}`);
      return;
    }

    if (data) {
      const newSlot: TimetableSlot = {
        ...slotData,
        id: data.id
      };
      setSlots((prev) => [...prev, newSlot]);
      showSuccess(`Timetable slot for ${newSlot.subject} created.`);
    }
  };

  const updateSlot = async (updatedSlot: TimetableSlot) => {
    if (!currentUser) return;

    setSlots((prev) => prev.map((s) => (s.id === updatedSlot.id ? updatedSlot : s)));

    if (!currentUser.isDemo) {
      const { error } = await supabase
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

      if (error) {
        showError(`Failed to update slot in cloud: ${error.message}`);
      }
    }

    showSuccess(`Updated ${updatedSlot.subject} slot.`);
  };

  const deleteSlot = async (id: string) => {
    if (!currentUser) return;

    setSlots((prev) => prev.filter((s) => s.id !== id));

    if (!currentUser.isDemo) {
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

    if (currentUser.isDemo) {
      const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: computedStatus
      };
      setTasks((prev) => [newTask, ...prev]);
      showSuccess(`Task "${newTask.title}" added to War Room.`);
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
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
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to add task: ${error.message}`);
      return;
    }

    if (data) {
      const newTask: Task = {
        ...taskData,
        id: data.id,
        createdAt: data.created_at,
        status: computedStatus
      };
      setTasks((prev) => [newTask, ...prev]);
      showSuccess(`Task "${newTask.title}" added to War Room.`);
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
              compoundingScore: Math.max(10, d.compoundingScore - 5)
            }));
          }

          return updatedTask;
        }
        return t;
      })
    );

    if (!currentUser.isDemo && updatedTaskRef) {
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

    if (!currentUser.isDemo && updatedTaskObj) {
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

    if (!currentUser.isDemo) {
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

    if (currentUser.isDemo) {
      const newEntry: EvidenceEntry = {
        ...entryData,
        id: `ev-${Date.now()}`,
        dateLogged: new Date().toISOString()
      };
      setEvidenceEntries((prev) => [newEntry, ...prev]);
      showSuccess('Outcome logged in Evidence Case File!');
      return;
    }

    const { data, error } = await supabase
      .from('evidence_entries')
      .insert({
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
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to log evidence: ${error.message}`);
      return;
    }

    if (data) {
      const newEntry: EvidenceEntry = {
        ...entryData,
        id: data.id,
        dateLogged: data.date_logged
      };
      setEvidenceEntries((prev) => [newEntry, ...prev]);
      showSuccess('Outcome logged in Evidence Case File!');
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!currentUser) return;

    const merged = { ...settings, ...newSettings };
    setSettings(merged);

    if (!currentUser.isDemo) {
      await supabase
        .from('user_settings')
        .upsert({
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
    const bundle = PERSONAS_MAP[personaId] || defaultPersona;
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
    setDebt({
      totalHoursBehind: 0,
      missedDeadlinesCount: 0,
      streakDays: 0,
      compoundingScore: 0,
      weeklyDebtTrend: []
    });
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