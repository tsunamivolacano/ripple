import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  TimetableSlot, 
  Task, 
  EvidenceEntry, 
  ProcrastinationDebt, 
  UserSettings 
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
  
  // Auth actions
  loginWithEmail: (email: string, password: string) => Promise<AuthResponse>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResponse>;
  loginDemoAccount: (personaId: string) => void;
  logout: () => void;

  setActiveTaskForPrediction: (task: Task | null) => void;
  setActiveFocusTask: (task: Task | null) => void;
  setCompletedTaskForCelebration: (task: Task | null) => void;
  
  // Slot management
  addSlot: (slot: Omit<TimetableSlot, 'id'>) => void;
  updateSlot: (slot: TimetableSlot) => void;
  deleteSlot: (id: string) => void;

  // Task management
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
  updateTaskProgress: (taskId: string, percentage: number) => void;
  completeTask: (taskId: string) => void;
  renegotiateTask: (taskId: string, newDueDate: string, reason: string) => void;
  deleteTask: (id: string) => void;

  // Evidence log management
  logEvidence: (entry: Omit<EvidenceEntry, 'id' | 'dateLogged'>) => void;

  // Settings
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  
  // Persona actions
  loadPersonaData: (personaId: string) => void;
  resetAllData: () => void;
}

const defaultPersona = PERSONAS_MAP['riya'];

function safeGetLocalStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch (error) {
    return fallback;
  }
}

function safeSetLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error);
  }
}

const RippleContext = createContext<RippleContextType | undefined>(undefined);

export const RippleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    safeGetLocalStorage<UserAccount | null>('ripple_demo_auth_user', null)
  );

  const userKey = currentUser ? currentUser.id : 'anonymous';

  const [currentPersonaId, setCurrentPersonaId] = useState<string>(() =>
    safeGetLocalStorage(`ripple_persona_id_${userKey}`, currentUser?.demoPersonaId || 'riya')
  );

  const [slots, setSlots] = useState<TimetableSlot[]>(() => 
    safeGetLocalStorage(`ripple_slots_${userKey}`, defaultPersona.slots)
  );

  const [tasks, setTasks] = useState<Task[]>(() => 
    safeGetLocalStorage(`ripple_tasks_${userKey}`, defaultPersona.tasks)
  );

  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntry[]>(() => 
    safeGetLocalStorage(`ripple_evidence_${userKey}`, defaultPersona.evidenceEntries)
  );

  const [debt, setDebt] = useState<ProcrastinationDebt>(() => 
    safeGetLocalStorage(`ripple_debt_${userKey}`, defaultPersona.debt)
  );

  const [settings, setSettings] = useState<UserSettings>(() => 
    safeGetLocalStorage(`ripple_settings_${userKey}`, defaultPersona.settings)
  );

  const [activeTaskForPrediction, setActiveTaskForPrediction] = useState<Task | null>(null);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [completedTaskForCelebration, setCompletedTaskForCelebration] = useState<Task | null>(null);

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

  // Fetch or load user data upon account change
  useEffect(() => {
    if (currentUser) {
      const uKey = currentUser.id;

      if (currentUser.isDemo && currentUser.demoPersonaId) {
        const persona = PERSONAS_MAP[currentUser.demoPersonaId] || defaultPersona;
        setSlots(safeGetLocalStorage(`ripple_slots_${uKey}`, persona.slots));
        setTasks(safeGetLocalStorage(`ripple_tasks_${uKey}`, persona.tasks));
        setEvidenceEntries(safeGetLocalStorage(`ripple_evidence_${uKey}`, persona.evidenceEntries));
        setDebt(safeGetLocalStorage(`ripple_debt_${uKey}`, persona.debt));
        setSettings(safeGetLocalStorage(`ripple_settings_${uKey}`, persona.settings));
        setCurrentPersonaId(persona.id);
      } else {
        // Authenticated real user - load user specific isolated storage / cloud session state
        setSlots(safeGetLocalStorage(`ripple_slots_${uKey}`, []));
        setTasks(safeGetLocalStorage(`ripple_tasks_${uKey}`, []));
        setEvidenceEntries(safeGetLocalStorage(`ripple_evidence_${uKey}`, []));
        setDebt(safeGetLocalStorage(`ripple_debt_${uKey}`, {
          totalHoursBehind: 0,
          missedDeadlinesCount: 0,
          streakDays: 0,
          compoundingScore: 0,
          weeklyDebtTrend: []
        }));
        setSettings(safeGetLocalStorage(`ripple_settings_${uKey}`, defaultPersona.settings));
      }
    }
  }, [currentUser]);

  // Persist state safely to isolated storage space for current user session
  useEffect(() => {
    if (currentUser) {
      safeSetLocalStorage(`ripple_slots_${currentUser.id}`, slots);
      safeSetLocalStorage(`ripple_tasks_${currentUser.id}`, tasks);
      safeSetLocalStorage(`ripple_evidence_${currentUser.id}`, evidenceEntries);
      safeSetLocalStorage(`ripple_debt_${currentUser.id}`, debt);
      safeSetLocalStorage(`ripple_settings_${currentUser.id}`, settings);
    }
  }, [slots, tasks, evidenceEntries, debt, settings, currentUser]);

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

  // Auth Methods using Supabase Auth
  const loginWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setCurrentUser({
          id: data.user.id,
          email: data.user.email || email,
          isDemo: false
        });
        showSuccess(`Welcome back!`);
        return { success: true };
      }

      return { success: false, error: 'User not found.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setCurrentUser({
          id: data.user.id,
          email: data.user.email || email,
          isDemo: false
        });
        showSuccess('Account registered successfully!');
        return { success: true };
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
    safeSetLocalStorage('ripple_demo_auth_user', account);
    setCurrentUser(account);
    showSuccess(`Viewing Demo Persona: ${persona.name}`);
  };

  const logout = async () => {
    if (currentUser?.isDemo) {
      safeSetLocalStorage('ripple_demo_auth_user', null);
    } else {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    showSuccess('Signed out.');
  };

  const addSlot = (slotData: Omit<TimetableSlot, 'id'>) => {
    const newSlot: TimetableSlot = {
      ...slotData,
      id: `slot-${Date.now()}`
    };
    setSlots((prev) => [...prev, newSlot]);
    showSuccess(`Timetable slot for ${newSlot.subject} created.`);
  };

  const updateSlot = (updatedSlot: TimetableSlot) => {
    setSlots((prev) => prev.map((s) => (s.id === updatedSlot.id ? updatedSlot : s)));
    showSuccess(`Updated ${updatedSlot.subject} slot.`);
  };

  const deleteSlot = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    showSuccess('Timetable slot removed.');
  };

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
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
  };

  const updateTaskProgress = (taskId: string, percentage: number) => {
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
  };

  const completeTask = (taskId: string) => {
    updateTaskProgress(taskId, 100);
  };

  const renegotiateTask = (taskId: string, newDueDate: string, reason: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const count = (t.renegotiatedCount || 0) + 1;
          const newStatus = calculateTaskStatus(newDueDate, t.estimatedHours, t.completionPercentage, settings.personalVelocityMultiplier);
          return {
            ...t,
            dueDate: newDueDate,
            renegotiatedCount: count,
            lastRenegotiatedAt: new Date().toISOString(),
            status: newStatus === 'too_late' ? 'tight' : newStatus
          };
        }
        return t;
      })
    );

    setDebt((prev) => ({
      ...prev,
      totalHoursBehind: prev.totalHoursBehind + 0.5,
      compoundingScore: Math.min(100, prev.compoundingScore + 8)
    }));

    showSuccess('Task schedule renegotiated.');
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showSuccess('Task removed.');
  };

  const logEvidence = (entryData: Omit<EvidenceEntry, 'id' | 'dateLogged'>) => {
    const newEntry: EvidenceEntry = {
      ...entryData,
      id: `ev-${Date.now()}`,
      dateLogged: new Date().toISOString()
    };
    setEvidenceEntries((prev) => [newEntry, ...prev]);
    showSuccess('Outcome logged in Evidence Case File!');
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
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