import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
import { calculateDebt } from '@/utils/debtUtils';
import { showSuccess, showError } from '@/utils/toast';
import { fetchUserDataByEmail, seedDemoDataForUser } from '@/services/rippleService';

const LOCAL_STORAGE_EMAIL_KEY = 'ripple_user_email';

interface RippleContextType {
  profile: UserProfile | null;
  loading: boolean;
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
  
  // Custom Email Auth actions
  loginWithEmail: (email: string) => Promise<boolean>;
  registerUser: (name: string, email: string, role: 'student' | 'corporate' | 'other') => Promise<boolean>;
  signOut: () => void;

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
}

const defaultSettings: UserSettings = {
  intensityMode: 'standard',
  isMinorProfile: false,
  weeklyDigestOnly: false,
  personalVelocityMultiplier: 1.0
};

const RippleContext = createContext<RippleContextType | undefined>(undefined);

export const RippleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntry[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  const [activeTaskForPrediction, setActiveTaskForPrediction] = useState<Task | null>(null);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [completedTaskForCelebration, setCompletedTaskForCelebration] = useState<Task | null>(null);

  // Compute Procrastination Debt dynamically
  const computedDebt = useMemo(() => calculateDebt(tasks, evidenceEntries), [tasks, evidenceEntries]);

  // Restore session from localStorage on initial load
  useEffect(() => {
    const savedEmail = localStorage.getItem(LOCAL_STORAGE_EMAIL_KEY);
    if (savedEmail) {
      loadUserData(savedEmail);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserData = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetchUserDataByEmail(email);
      if (res) {
        setProfile(res.profile);
        setSettings(res.settings);
        setSlots(res.slots);
        setTasks(res.tasks);
        setEvidenceEntries(res.evidenceEntries);
        localStorage.setItem(LOCAL_STORAGE_EMAIL_KEY, res.profile.email);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_EMAIL_KEY);
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string): Promise<boolean> => {
    const cleanEmail = email.toLowerCase().trim();
    setLoading(true);

    // Check if email exists in database
    const { data: prof, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    let demoKey: 'riya' | 'aman' | 'kabir' | null = null;
    if (cleanEmail.includes('riya')) demoKey = 'riya';
    else if (cleanEmail.includes('aman')) demoKey = 'aman';
    else if (cleanEmail.includes('kabir')) demoKey = 'kabir';

    if (!prof && !demoKey) {
      setLoading(false);
      showError('Account not found.');
      return false;
    }

    await loadUserData(cleanEmail);
    showSuccess('Logged in successfully!');
    return true;
  };

  const registerUser = async (name: string, email: string, role: 'student' | 'corporate' | 'other'): Promise<boolean> => {
    const cleanEmail = email.toLowerCase().trim();
    setLoading(true);

    // 1. Check if email already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      setLoading(false);
      showError('Email already registered.');
      return false;
    }

    // 2. Create new profile record
    const newUserId = crypto.randomUUID();
    const defaultIntensity = role === 'corporate' ? 'standard' : role === 'student' ? 'doomsday' : 'coach';

    const { error: profErr } = await supabase.from('profiles').insert({
      id: newUserId,
      email: cleanEmail,
      name,
      role
    });

    if (profErr) {
      setLoading(false);
      showError(`Failed to create account: ${profErr.message}`);
      return false;
    }

    // 3. Create default user settings
    await supabase.from('user_settings').insert({
      user_id: newUserId,
      intensity_mode: defaultIntensity,
      is_minor_profile: role === 'student',
      weekly_digest_only: false,
      personal_velocity_multiplier: 1.0
    });

    // 4. Load created user session
    await loadUserData(cleanEmail);
    showSuccess('Account created successfully!');
    return true;
  };

  const signOut = () => {
    localStorage.removeItem(LOCAL_STORAGE_EMAIL_KEY);
    setProfile(null);
    setSlots([]);
    setTasks([]);
    setEvidenceEntries([]);
    showSuccess('Logged out safely.');
  };

  // Timer ticker to keep task statuses fresh
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

  // Slots CRUD
  const addSlot = async (slotData: Omit<TimetableSlot, 'id'>) => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('timetable_slots')
      .insert({
        user_id: profile.id,
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
      const newSlot: TimetableSlot = { id: data.id, userId: profile.id, ...slotData };
      setSlots((prev) => [...prev, newSlot]);
      showSuccess(`Timetable slot for ${newSlot.subject} created.`);
    }
  };

  const updateSlot = async (updatedSlot: TimetableSlot) => {
    if (!profile) return;
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
      .eq('id', updatedSlot.id);

    if (error) {
      showError(error.message);
      return;
    }

    setSlots((prev) => prev.map((s) => (s.id === updatedSlot.id ? updatedSlot : s)));
    showSuccess(`Updated ${updatedSlot.subject} slot.`);
  };

  const deleteSlot = async (id: string) => {
    if (!profile) return;
    const { error } = await supabase.from('timetable_slots').delete().eq('id', id);
    if (error) {
      showError(error.message);
      return;
    }
    setSlots((prev) => prev.filter((s) => s.id !== id));
    showSuccess('Timetable slot removed.');
  };

  // Tasks CRUD
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    if (!profile) return;

    const computedStatus = calculateTaskStatus(
      taskData.dueDate,
      taskData.estimatedHours,
      taskData.completionPercentage,
      settings.personalVelocityMultiplier
    );

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: profile.id,
        title: taskData.title,
        description: taskData.description,
        slot_id: taskData.slotId || null,
        due_date: taskData.dueDate,
        estimated_hours: taskData.estimatedHours,
        completion_percentage: taskData.completionPercentage,
        task_type: taskData.taskType,
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
        userId: profile.id,
        createdAt: data.created_at,
        status: computedStatus
      };
      setTasks((prev) => [newTask, ...prev]);
      showSuccess(`Task "${newTask.title}" added to War Room.`);
    }
  };

  const updateTaskProgress = async (taskId: string, percentage: number) => {
    if (!profile) return;
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const isComplete = percentage >= 100;
    const updatedStatus = isComplete
      ? 'completed'
      : calculateTaskStatus(targetTask.dueDate, targetTask.estimatedHours, percentage, settings.personalVelocityMultiplier);

    const completedAtISO = isComplete ? new Date().toISOString() : targetTask.completedAt;

    const { error } = await supabase
      .from('tasks')
      .update({
        completion_percentage: percentage,
        status: updatedStatus,
        completed_at: completedAtISO
      })
      .eq('id', taskId);

    if (error) {
      showError(error.message);
      return;
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedTask = {
            ...t,
            completionPercentage: percentage,
            status: updatedStatus,
            completedAt: completedAtISO
          };
          if (isComplete) {
            setCompletedTaskForCelebration(updatedTask);
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
    if (!profile) return;
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const newCount = (targetTask.renegotiatedCount || 0) + 1;
    const nowISO = new Date().toISOString();
    const newStatus = calculateTaskStatus(newDueDate, targetTask.estimatedHours, targetTask.completionPercentage, settings.personalVelocityMultiplier);

    const { error } = await supabase
      .from('tasks')
      .update({
        due_date: newDueDate,
        renegotiated_count: newCount,
        last_renegotiated_at: nowISO,
        status: newStatus === 'too_late' ? 'tight' : newStatus
      })
      .eq('id', taskId);

    if (error) {
      showError(error.message);
      return;
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            dueDate: newDueDate,
            renegotiatedCount: newCount,
            lastRenegotiatedAt: nowISO,
            status: newStatus === 'too_late' ? 'tight' : newStatus
          };
        }
        return t;
      })
    );

    showSuccess('Task schedule renegotiated. Doomsday Clock reset.');
  };

  const deleteTask = async (id: string) => {
    if (!profile) return;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      showError(error.message);
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showSuccess('Task removed.');
  };

  // Evidence Log
  const logEvidence = async (entryData: Omit<EvidenceEntry, 'id' | 'dateLogged'>) => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('evidence_log')
      .insert({
        user_id: profile.id,
        task_id: entryData.taskId || null,
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
      showError(error.message);
      return;
    }

    if (data) {
      const newEntry: EvidenceEntry = {
        ...entryData,
        id: data.id,
        userId: profile.id,
        dateLogged: data.date_logged
      };
      setEvidenceEntries((prev) => [newEntry, ...prev]);
      showSuccess('Outcome logged in Evidence Case File!');
    }
  };

  // Settings
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    if (profile) {
      await supabase.from('user_settings').upsert({
        user_id: profile.id,
        intensity_mode: updated.intensityMode,
        is_minor_profile: updated.isMinorProfile,
        weekly_digest_only: updated.weeklyDigestOnly,
        personal_velocity_multiplier: updated.personalVelocityMultiplier
      });
    }
    showSuccess('Settings updated.');
  };

  return (
    <RippleContext.Provider
      value={{
        profile,
        loading,
        slots,
        tasks,
        evidenceEntries,
        debt: computedDebt,
        settings,
        activeTaskForPrediction,
        activeFocusTask,
        completedTaskForCelebration,
        setActiveTaskForPrediction,
        setActiveFocusTask,
        setCompletedTaskForCelebration,
        loginWithEmail,
        registerUser,
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
        signOut
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