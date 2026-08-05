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
import { PERSONAS_MAP } from '@/data/ripplePersonaData';
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
  activeTaskForPrediction: Task | null;
  activeFocusTask: Task | null;
  completedTaskForCelebration: Task | null;
  setActiveTaskForPrediction: (task: Task | null) => void;
  setActiveFocusTask: (task: Task | null) => void;
  setCompletedTaskForCelebration: (task: Task | null) => void;
  logout: () => Promise<void>;
  addSlot: (slot: Omit<TimetableSlot, 'id'>) => void;
  updateSlot: (slot: TimetableSlot) => void;
  deleteSlot: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
  updateTaskProgress: (taskId: string, percentage: number) => void;
  completeTask: (taskId: string) => void;
  renegotiateTask: (taskId: string, newDueDate: string, reason: string) => void;
  deleteTask: (id: string) => void;
  logEvidence: (entry: Omit<EvidenceEntry, 'id' | 'dateLogged'>) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
}

const emptyDebt: ProcrastinationDebt = {
  totalHoursBehind: 0,
  missedDeadlinesCount: 0,
  streakDays: 0,
  compoundingScore: 0,
  weeklyDebtTrend: [
    { day: 'Mon', debtHours: 0 }, { day: 'Tue', debtHours: 0 }, { day: 'Wed', debtHours: 0 },
    { day: 'Thu', debtHours: 0 }, { day: 'Fri', debtHours: 0 }, { day: 'Sat', debtHours: 0 },
    { day: 'Sun', debtHours: 0 }
  ]
};

const RippleContext = createContext<RippleContextType | undefined>(undefined);

export const RippleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntry[]>([]);
  const [debt, setDebt] = useState<ProcrastinationDebt>(emptyDebt);
  const [settings, setSettings] = useState<UserSettings>({
    intensityMode: 'coach',
    isMinorProfile: false,
    weeklyDigestOnly: false,
    personalVelocityMultiplier: 1.0
  });

  const [activeTaskForPrediction, setActiveTaskForPrediction] = useState<Task | null>(null);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [completedTaskForCelebration, setCompletedTaskForCelebration] = useState<Task | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserDataFromSupabase(session.user.id);
      } else {
        setIsLoadingAuth(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserDataFromSupabase(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setSlots([]);
        setTasks([]);
        setEvidenceEntries([]);
        setDebt(emptyDebt);
      }
      setIsLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserDataFromSupabase = async (userId: string) => {
    setIsLoadingAuth(true);
    try {
      const userProfile = await fetchProfile(userId);
      setProfile(userProfile);

      if (userProfile?.intensityMode) {
        setSettings((prev) => ({ ...prev, intensityMode: userProfile.intensityMode }));
      }

      const [dbSlots, dbTasks, dbEvidence, dbDebt] = await Promise.all([
        fetchUserSlots(userId),
        fetchUserTasks(userId),
        fetchUserEvidence(userId),
        fetchUserDebt(userId)
      ]);

      setSlots(dbSlots);
      setTasks(dbTasks);
      setEvidenceEntries(dbEvidence);
      setDebt(dbDebt || emptyDebt);
    } catch (err) {
      console.error("Supabase load error:", err);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    showSuccess("Logged out successfully.");
  };

  const addSlot = async (slotData: Omit<TimetableSlot, 'id'>) => {
    const newSlot: TimetableSlot = { ...slotData, id: `slot-${Date.now()}` };
    setSlots((prev) => [...prev, newSlot]);
    if (user?.id) await saveUserSlot(user.id, newSlot);
    showSuccess(`Slot for ${newSlot.subject} saved.`);
  };

  const updateSlot = async (updatedSlot: TimetableSlot) => {
    setSlots((prev) => prev.map((s) => (s.id === updatedSlot.id ? updatedSlot : s)));
    if (user?.id) await saveUserSlot(user.id, updatedSlot);
  };

  const deleteSlot = async (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    if (user?.id) await deleteUserSlot(user.id, id);
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: calculateTaskStatus(taskData.dueDate, taskData.estimatedHours, taskData.completionPercentage, settings.personalVelocityMultiplier)
    };
    setTasks((prev) => [newTask, ...prev]);
    if (user?.id) await saveUserTask(user.id, newTask);
    showSuccess(`Task "${newTask.title}" created.`);
  };

  const updateTaskProgress = async (taskId: string, percentage: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isComplete = percentage >= 100;
          const updated = {
            ...t,
            completionPercentage: percentage,
            status: isComplete ? 'completed' : calculateTaskStatus(t.dueDate, t.estimatedHours, percentage, settings.personalVelocityMultiplier),
            completedAt: isComplete ? new Date().toISOString() : t.completedAt
          };
          if (isComplete) setCompletedTaskForCelebration(updated);
          if (user?.id) saveUserTask(user.id, updated);
          return updated;
        }
        return t;
      })
    );
  };

  const completeTask = (taskId: string) => updateTaskProgress(taskId, 100);

  const renegotiateTask = async (taskId: string, newDueDate: string, reason: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = {
            ...t,
            dueDate: newDueDate,
            renegotiatedCount: (t.renegotiatedCount || 0) + 1,
            lastRenegotiatedAt: new Date().toISOString()
          };
          if (user?.id) saveUserTask(user.id, updated);
          return updated;
        }
        return t;
      })
    );
    showSuccess('Task schedule renegotiated.');
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (user?.id) await deleteUserTask(user.id, id);
  };

  const logEvidence = async (entryData: Omit<EvidenceEntry, 'id' | 'dateLogged'>) => {
    const newEntry: EvidenceEntry = { ...entryData, id: `ev-${Date.now()}`, dateLogged: new Date().toISOString() };
    setEvidenceEntries((prev) => [newEntry, ...prev]);
    if (user?.id) await saveUserEvidence(user.id, newEntry);
    showSuccess('Outcome logged.');
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <RippleContext.Provider
      value={{
        user, session, profile, isLoadingAuth, slots, tasks, evidenceEntries, debt, settings,
        activeTaskForPrediction, activeFocusTask, completedTaskForCelebration,
        setActiveTaskForPrediction, setActiveFocusTask, setCompletedTaskForCelebration,
        logout, addSlot, updateSlot, deleteSlot, addTask, updateTaskProgress,
        completeTask, renegotiateTask, deleteTask, logEvidence, updateSettings
      }}
    >
      {children}
    </RippleContext.Provider>
  );
};

export const useRipple = () => {
  const context = useContext(RippleContext);
  if (!context) throw new Error('useRipple must be used within a RippleProvider');
  return context;
};