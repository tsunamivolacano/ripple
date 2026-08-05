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
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface RippleContextType {
  user: User | null;
  session: Session | null;
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
  
  // Auth
  logout: () => Promise<void>;
}

const defaultSettings: UserSettings = {
  intensityMode: 'standard',
  isMinorProfile: false,
  weeklyDigestOnly: false,
  personalVelocityMultiplier: 1.15
};

const defaultDebt: ProcrastinationDebt = {
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
  const [loading, setLoading] = useState<boolean>(true);

  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntry[]>([]);
  const [debt, setDebt] = useState<ProcrastinationDebt>(defaultDebt);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  const [activeTaskForPrediction, setActiveTaskForPrediction] = useState<Task | null>(null);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [completedTaskForCelebration, setCompletedTaskForCelebration] = useState<Task | null>(null);

  // Monitor Auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setSlots([]);
        setTasks([]);
        setEvidenceEntries([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch all user data from Supabase
  const fetchUserData = async (userId: string) => {
    setLoading(true);

    try {
      // 1. Timetable Slots
      const { data: slotRows } = await supabase
        .from('timetable_slots')
        .select('*')
        .eq('user_id', userId);

      const formattedSlots: TimetableSlot[] = (slotRows || []).map((s: any) => ({
        id: s.id,
        subject: s.subject,
        dayOfWeek: s.day_of_week,
        startTime: s.start_time,
        endTime: s.end_time,
        room: s.room || '',
        teacherName: s.teacher_name || '',
        strictnessTag: s.strictness_tag || 'NOTEBOOK_CHECK',
        stakesTag: s.stakes_tag || 'HOMEWORK',
        weight: s.weight || 20,
        notes: s.notes || ''
      }));
      setSlots(formattedSlots);

      // 2. Tasks
      const { data: taskRows } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const formattedTasks: Task[] = (taskRows || []).map((t: any) => {
        const computedStatus = calculateTaskStatus(
          t.due_date,
          t.estimated_hours || 1.0,
          t.completion_percentage || 0,
          settings.personalVelocityMultiplier
        );

        return {
          id: t.id,
          title: t.title,
          description: t.description || '',
          slotId: t.slot_id || undefined,
          dueDate: t.due_date,
          estimatedHours: Number(t.estimated_hours) || 1.0,
          completionPercentage: Number(t.completion_percentage) || 0,
          taskType: t.task_type || 'problem_set',
          status: t.status === 'completed' ? 'completed' : computedStatus,
          createdAt: t.created_at,
          completedAt: t.completed_at || undefined,
          renegotiatedCount: t.renegotiated_count || 0
        };
      });
      setTasks(formattedTasks);

      // 3. Evidence Log
      const { data: evRows } = await supabase
        .from('evidence_log')
        .select('*')
        .eq('user_id', userId)
        .order('date_logged', { ascending: false });

      const formattedEvidence: EvidenceEntry[] = (evRows || []).map((e: any) => ({
        id: e.id,
        taskId: e.task_id || e.id,
        taskTitle: e.task_title || '',
        subject: e.subject || '',
        teacherName: e.teacher_name || '',
        predictedScenario: e.predicted_scenario || '',
        actualOutcome: e.actual_outcome || '',
        wasOnTime: e.was_on_time ?? true,
        accuracyRating: e.accuracy_rating || 5,
        dateLogged: e.date_logged || new Date().toISOString(),
        userNotes: e.user_notes || ''
      }));
      setEvidenceEntries(formattedEvidence);

      // 4. Calculate Procrastination Debt
      const missedCount = formattedTasks.filter(t => t.status === 'too_late').length;
      const hoursBehind = formattedTasks.reduce((acc, t) => {
        if (t.status === 'critical' || t.status === 'too_late') {
          return acc + t.estimatedHours * (1 - t.completionPercentage / 100);
        }
        return acc;
      }, 0);

      setDebt({
        totalHoursBehind: Math.round(hoursBehind * 10) / 10,
        missedDeadlinesCount: missedCount,
        streakDays: Math.max(1, 7 - missedCount),
        compoundingScore: Math.min(100, Math.round(missedCount * 25 + hoursBehind * 5)),
        weeklyDebtTrend: [
          { day: 'Mon', debtHours: Math.min(6, hoursBehind * 0.3) },
          { day: 'Tue', debtHours: Math.min(6, hoursBehind * 0.5) },
          { day: 'Wed', debtHours: Math.min(6, hoursBehind * 0.4) },
          { day: 'Thu', debtHours: Math.min(6, hoursBehind * 0.8) },
          { day: 'Fri', debtHours: Math.min(6, hoursBehind) },
          { day: 'Sat', debtHours: Math.min(6, hoursBehind * 0.9) },
          { day: 'Sun', debtHours: Math.min(6, hoursBehind) }
        ]
      });

      // 5. User Settings from Profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        setSettings({
          intensityMode: profile.intensity_mode || 'standard',
          isMinorProfile: profile.role?.includes('Student') || false,
          weeklyDigestOnly: false,
          personalVelocityMultiplier: profile.velocity_multiplier || 1.15
        });
      }
    } catch (err: any) {
      console.error('Error fetching Supabase user data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Ticker: refresh task statuses
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

  const addSlot = async (slotData: Omit<TimetableSlot, 'id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('timetable_slots')
      .insert({
        user_id: user.id,
        subject: slotData.subject,
        day_of_week: slotData.dayOfWeek,
        start_time: slotData.startTime,
        end_time: slotData.endTime,
        room: slotData.room,
        teacher_name: slotData.teacherName,
        strictness_tag: slotData.strictnessTag,
        stakes_tag: slotData.stakesTag,
        weight: slotData.weight,
        notes: slotData.notes || ''
      })
      .select()
      .single();

    if (error) {
      showError(error.message);
      return;
    }

    const newSlot: TimetableSlot = { ...slotData, id: data.id };
    setSlots((prev) => [...prev, newSlot]);
    showSuccess(`Timetable slot for ${newSlot.subject} added.`);
  };

  const updateSlot = async (updatedSlot: TimetableSlot) => {
    if (!user) return;

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
    if (!user) return;

    const { error } = await supabase.from('timetable_slots').delete().eq('id', id);
    if (error) {
      showError(error.message);
      return;
    }

    setSlots((prev) => prev.filter((s) => s.id !== id));
    showSuccess('Timetable slot removed.');
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    if (!user) return;

    const computedStatus = calculateTaskStatus(
      taskData.dueDate,
      taskData.estimatedHours,
      taskData.completionPercentage,
      settings.personalVelocityMultiplier
    );

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: taskData.title,
        description: taskData.description || '',
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
      showError(error.message);
      return;
    }

    const newTask: Task = {
      ...taskData,
      id: data.id,
      createdAt: data.created_at,
      status: computedStatus
    };

    setTasks((prev) => [newTask, ...prev]);
    showSuccess(`Task "${newTask.title}" added to War Room.`);
  };

  const updateTaskProgress = async (taskId: string, percentage: number) => {
    if (!user) return;

    const isComplete = percentage >= 100;
    const taskObj = tasks.find(t => t.id === taskId);
    if (!taskObj) return;

    const updatedStatus = isComplete
      ? 'completed'
      : calculateTaskStatus(taskObj.dueDate, taskObj.estimatedHours, percentage, settings.personalVelocityMultiplier);

    const { error } = await supabase
      .from('tasks')
      .update({
        completion_percentage: percentage,
        status: updatedStatus,
        completed_at: isComplete ? new Date().toISOString() : null
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
            status: updatedStatus as TaskStatus,
            completedAt: isComplete ? new Date().toISOString() : t.completedAt
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
    if (!user) return;

    const taskObj = tasks.find(t => t.id === taskId);
    if (!taskObj) return;

    const newCount = (taskObj.renegotiatedCount || 0) + 1;
    const newStatus = calculateTaskStatus(newDueDate, taskObj.estimatedHours, taskObj.completionPercentage, settings.personalVelocityMultiplier);

    const { error } = await supabase
      .from('tasks')
      .update({
        due_date: newDueDate,
        renegotiated_count: newCount,
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
            status: newStatus === 'too_late' ? 'tight' : newStatus
          };
        }
        return t;
      })
    );

    showSuccess('Task schedule renegotiated. Doomsday Clock reset.');
  };

  const deleteTask = async (id: string) => {
    if (!user) return;

    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      showError(error.message);
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== id));
    showSuccess('Task removed.');
  };

  const logEvidence = async (entryData: Omit<EvidenceEntry, 'id' | 'dateLogged'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('evidence_log')
      .insert({
        user_id: user.id,
        task_title: entryData.taskTitle,
        subject: entryData.subject,
        teacher_name: entryData.teacherName,
        predicted_scenario: entryData.predictedScenario,
        actual_outcome: entryData.actualOutcome,
        was_on_time: entryData.wasOnTime,
        accuracy_rating: entryData.accuracyRating,
        user_notes: entryData.userNotes || ''
      })
      .select()
      .single();

    if (error) {
      showError(error.message);
      return;
    }

    const newEntry: EvidenceEntry = {
      ...entryData,
      id: data.id,
      dateLogged: data.date_logged
    };

    setEvidenceEntries((prev) => [newEntry, ...prev]);
    showSuccess('Outcome logged in Evidence Case File!');
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;

    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    await supabase.from('profiles').upsert({
      id: user.id,
      intensity_mode: updated.intensityMode,
      velocity_multiplier: updated.personalVelocityMultiplier
    });

    showSuccess('Intensity mode updated.');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSlots([]);
    setTasks([]);
    setEvidenceEntries([]);
    showSuccess('Logged out successfully.');
  };

  return (
    <RippleContext.Provider
      value={{
        user,
        session,
        loading,
        slots,
        tasks,
        evidenceEntries,
        debt,
        settings,
        activeTaskForPrediction,
        activeFocusTask,
        completedTaskForCelebration,
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
        logout
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