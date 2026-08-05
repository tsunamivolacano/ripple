import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { 
  TimetableSlot, 
  Task, 
  EvidenceEntry, 
  ProcrastinationDebt, 
  UserSettings, 
  UserProfile 
} from '@/types/ripple';
import { calculateTaskStatus } from '@/utils/timeUtils';
import { showSuccess, showError } from '@/utils/toast';
import { ALL_PERSONAS, PERSONAS_MAP } from '@/data/ripplePersonaData';
import { 
  fetchProfile, 
  fetchUserSlots, 
  saveUserSlot, 
  deleteUserSlot, 
  fetchUserTasks, 
  saveUserTask, 
  deleteUserTask, 
  fetchUserEvidence, 
  saveUserEvidence, 
  fetchUserDebt, 
  saveUserDebt 
} from '@/integrations/supabase/db';

interface RippleContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoadingAuth: boolean;
  slots: TimetableSlot[];
  tasks: Task[];
  evidenceEntries: EvidenceEntry[];
  debt: ProcrastinationDebt;
  settings: UserSettings;
  currentPersonaId: string;
  activeTaskForPrediction: Task | null;
  activeFocusTask: Task | null;
  completedTaskForCelebration: Task | null;
  setActiveTaskForPrediction: (task: Task | null) => void;
  setActiveFocusTask: (task: Task | null) => void;
  setCompletedTaskForCelebration: (task: Task | null) => void;
  
  // Auth actions
  logout: () => Promise<void>;

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
  loadSampleData: () => void;
  resetAllData: () => void;
}

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

const RippleContext = createContext<RippleContextType | undefined>(undefined);

export const RippleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [currentPersonaId, setCurrentPersonaId] = useState<string>('riya');
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntry[]>([]);
  const [debt, setDebt] = useState<ProcrastinationDebt>(emptyDebt);
  const [settings, setSettings] = useState<UserSettings>(defaultPersona.settings);

  const [activeTaskForPrediction, setActiveTaskForPrediction] = useState<Task | null>(null);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [completedTaskForCelebration, setCompletedTaskForCelebration] = useState<Task | null>(null);

  // Monitor Supabase Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserDataFromSupabase(session.user.id);
      } else {
        // Fall back to local default demo profile for non-authenticated preview
        setSlots(defaultPersona.slots);
        setTasks(defaultPersona.tasks);
        setEvidenceEntries(defaultPersona.evidenceEntries);
        setDebt(defaultPersona.debt);
        setIsLoadingAuth(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserDataFromSupabase(session.user.id);
      } else {
        setProfile(null);
        setSlots(defaultPersona.slots);
        setTasks(defaultPersona.tasks);
        setEvidenceEntries(defaultPersona.evidenceEntries);
        setDebt(defaultPersona.debt);
      }
      setIsLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load User Data from Supabase
  const loadUserDataFromSupabase = async (userId: string) => {
    setIsLoadingAuth(true);
    try {
      const userProfile = await fetchProfile(userId);
      setProfile(userProfile);

      if (userProfile?.intensityMode) {
        setSettings((prev) => ({ ...prev, intensityMode: userProfile.intensityMode }));
      }

      const dbSlots = await fetchUserSlots(userId);
      const dbTasks = await fetchUserTasks(userId);
      const dbEvidence = await fetchUserEvidence(userId);
      const dbDebt = await fetchUserDebt(userId);

      setSlots(dbSlots);
      setTasks(dbTasks);
      setEvidenceEntries(dbEvidence);
      setDebt(dbDebt || emptyDebt);
    } catch (err) {
      console.error("Error loading user data from Supabase:", err);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Dynamic Status Ticker
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

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    showSuccess("Logged out successfully.");
  };

  const addSlot = (slotData: Omit<TimetableSlot, 'id'>) => {
    const newSlot: TimetableSlot = {
      ...slotData,
      id: `slot-${Date.now()}`,
      userId: user?.id
    };
    setSlots((prev) => [...prev, newSlot]);
    showSuccess(`Timetable slot for ${newSlot.subject} created.`);

    if (user?.id) {
      saveUserSlot(user.id, newSlot);
    }
  };

  const updateSlot = (updatedSlot: TimetableSlot) => {
    setSlots((prev) => prev.map((s) => (s.id === updatedSlot.id ? updatedSlot : s)));
    showSuccess(`Updated ${updatedSlot.subject} slot.`);

    if (user?.id) {
      saveUserSlot(user.id, updatedSlot);
    }
  };

  const deleteSlot = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    showSuccess('Timetable slot removed.');

    if (user?.id) {
      deleteUserSlot(user.id, id);
    }
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
      userId: user?.id,
      createdAt: new Date().toISOString(),
      status: computedStatus
    };

    setTasks((prev) => [newTask, ...prev]);
    showSuccess(`Task "${newTask.title}" added to War Room.`);

    if (user?.id) {
      saveUserTask(user.id, newTask);
    }
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
            const updatedDebt = {
              ...debt,
              streakDays: debt.streakDays + 1,
              compoundingScore: Math.max(10, debt.compoundingScore - 5)
            };
            setDebt(updatedDebt);
            if (user?.id) {
              saveUserDebt(user.id, updatedDebt);
            }
          }

          if (user?.id) {
            saveUserTask(user.id, updatedTask);
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
    let updatedTaskObj: Task | null = null;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const count = (t.renegotiatedCount || 0) + 1;
          const newStatus = calculateTaskStatus(newDueDate, t.estimatedHours, t.completionPercentage, settings.personalVelocityMultiplier);
          const updated = {
            ...t,
            dueDate: newDueDate,
            renegotiatedCount: count,
            lastRenegotiatedAt: new Date().toISOString(),
            status: newStatus === 'too_late' ? 'tight' : newStatus
          };
          updatedTaskObj = updated;
          return updated;
        }
        return t;
      })
    );

    if (updatedTaskObj && user?.id) {
      saveUserTask(user.id, updatedTaskObj);
    }

    const newDebt = {
      ...debt,
      totalHoursBehind: debt.totalHoursBehind + 0.5,
      compoundingScore: Math.min(100, debt.compoundingScore + 8)
    };
    setDebt(newDebt);
    if (user?.id) {
      saveUserDebt(user.id, newDebt);
    }

    showSuccess('Task schedule renegotiated. Doomsday Clock reset.');
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showSuccess('Task removed.');

    if (user?.id) {
      deleteUserTask(user.id, id);
    }
  };

  const logEvidence = (entryData: Omit<EvidenceEntry, 'id' | 'dateLogged'>) => {
    const newEntry: EvidenceEntry = {
      ...entryData,
      id: `ev-${Date.now()}`,
      userId: user?.id,
      dateLogged: new Date().toISOString()
    };
    setEvidenceEntries((prev) => [newEntry, ...prev]);
    showSuccess('Outcome logged in Evidence Case File!');

    if (user?.id) {
      saveUserEvidence(user.id, newEntry);
    }
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
    showSuccess(`Loaded demo profile: ${bundle.name} (${bundle.role})`);
  };

  const loadSampleData = () => {
    loadPersonaData('riya');
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
        user,
        session,
        profile,
        isLoadingAuth,
        slots,
        tasks,
        evidenceEntries,
        debt,
        settings,
        currentPersonaId,
        activeTaskForPrediction,
        activeFocusTask,
        completedTaskForCelebration,
        setActiveTaskForPrediction,
        setActiveFocusTask,
        setCompletedTaskForCelebration,
        logout,
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
        loadSampleData,
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