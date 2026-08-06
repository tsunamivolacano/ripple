import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  TimetableSlot, 
  Task, 
  EvidenceEntry, 
  ProcrastinationDebt, 
  UserSettings, 
  TaskStatus 
} from '@/types/ripple';
import { calculateTaskStatus } from '@/utils/timeUtils';
import { showSuccess, showError } from '@/utils/toast';
import { ALL_PERSONAS, PERSONAS_MAP, FullPersonaBundle } from '@/data/ripplePersonaData';
import { supabaseApi } from '@/integrations/supabase/client';

export interface UserAccount {
  id: string;
  email: string;
  isDemo?: boolean;
  demoPersonaId?: string;
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
  loginWithEmail: (email: string) => Promise<boolean>;
  signUpWithEmail: (email: string) => Promise<boolean>;
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
    console.error(`Failed to parse ${key} from localStorage:`, error);
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
    safeGetLocalStorage<UserAccount | null>('ripple_auth_user', null)
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

  // Reload account specific data when user changes
  useEffect(() => {
    safeSetLocalStorage('ripple_auth_user', currentUser);

    if (currentUser) {
      const uKey = currentUser.id;
      let initialPersona = defaultPersona;
      if (currentUser.isDemo && currentUser.demoPersonaId) {
        initialPersona = PERSONAS_MAP[currentUser.demoPersonaId] || defaultPersona;
      }

      setSlots(safeGetLocalStorage(`ripple_slots_${uKey}`, initialPersona.slots));
      setTasks(safeGetLocalStorage(`ripple_tasks_${uKey}`, initialPersona.tasks));
      setEvidenceEntries(safeGetLocalStorage(`ripple_evidence_${uKey}`, initialPersona.evidenceEntries));
      setDebt(safeGetLocalStorage(`ripple_debt_${uKey}`, initialPersona.debt));
      setSettings(safeGetLocalStorage(`ripple_settings_${uKey}`, initialPersona.settings));
      setCurrentPersonaId(safeGetLocalStorage(`ripple_persona_id_${uKey}`, initialPersona.id));
    }
  }, [currentUser]);

  // Sync state to account-isolated LocalStorage
  useEffect(() => {
    if (currentUser) {
      safeSetLocalStorage(`ripple_slots_${currentUser.id}`, slots);
    }
  }, [slots, currentUser]);

  useEffect(() => {
    if (currentUser) {
      safeSetLocalStorage(`ripple_tasks_${currentUser.id}`, tasks);
    }
  }, [tasks, currentUser]);

  useEffect(() => {
    if (currentUser) {
      safeSetLocalStorage(`ripple_evidence_${currentUser.id}`, evidenceEntries);
    }
  }, [evidenceEntries, currentUser]);

  useEffect(() => {
    if (currentUser) {
      safeSetLocalStorage(`ripple_debt_${currentUser.id}`, debt);
    }
  }, [debt, currentUser]);

  useEffect(() => {
    if (currentUser) {
      safeSetLocalStorage(`ripple_settings_${currentUser.id}`, settings);
    }
  }, [settings, currentUser]);

  // Dynamic Ticker: refresh task statuses every 30 seconds
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

  // Auth Methods
  const loginWithEmail = async (email: string): Promise<boolean> => {
    const cleanEmail = email.toLowerCase().trim();
    const dbUser = await supabaseApi.getUserByEmail(cleanEmail);

    if (dbUser) {
      const account: UserAccount = {
        id: dbUser.id || `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`,
        email: dbUser.email,
        isDemo: false
      };
      setCurrentUser(account);
      showSuccess(`Welcome back, ${account.email}`);
      return true;
    }

    // Check fallback local accounts created previously
    const localUser = safeGetLocalStorage<UserAccount | null>(`ripple_registered_${cleanEmail}`, null);
    if (localUser) {
      setCurrentUser(localUser);
      showSuccess(`Welcome back, ${localUser.email}`);
      return true;
    }

    return false;
  };

  const signUpWithEmail = async (email: string): Promise<boolean> => {
    const cleanEmail = email.toLowerCase().trim();
    
    // Check if already registered in DB or local
    const existing = await supabaseApi.getUserByEmail(cleanEmail);
    const existingLocal = safeGetLocalStorage<UserAccount | null>(`ripple_registered_${cleanEmail}`, null);

    if (existing || existingLocal) {
      return false; // Email already registered
    }

    // Create user in DB
    const newDbUser = await supabaseApi.createUser(cleanEmail);
    const account: UserAccount = {
      id: newDbUser?.id || `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`,
      email: cleanEmail,
      isDemo: false
    };

    safeSetLocalStorage(`ripple_registered_${cleanEmail}`, account);
    setCurrentUser(account);
    showSuccess(`Account created for ${cleanEmail}!`);
    return true;
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
    showSuccess(`Logged in as Demo Account: ${persona.name}`);
  };

  const logout = () => {
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

    showSuccess('Task schedule renegotiated. Doomsday Clock reset.');
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