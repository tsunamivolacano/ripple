import React, { createContext, useContext, useState, useEffect } from 'react';
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
import { User } from '@supabase/supabase-js';

interface RippleContextType {
  user: User | null;
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
  signOut: () => Promise<void>;
}

const defaultSettings: UserSettings = {
  intensityMode: 'standard',
  isMinorProfile: false,
  weeklyDigestOnly: false,
  personalVelocityMultiplier: 1.0
};

const RippleContext = createContext<RippleContextType | undefined>(undefined);

export const RippleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntry[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  const [activeTaskForPrediction, setActiveTaskForPrediction] = useState<Task | null>(null);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [completedTaskForCelebration, setCompletedTaskForCelebration] = useState<Task | null>(null);

  // Compute Procrastination Debt dynamically from tasks and evidence
  const computedDebt: ProcrastinationDebt = React.useMemo(() => {
    const activeTasks = tasks.filter((t) => t.status !== 'completed');
    const missed = activeTasks.filter((t) => t.status === 'too_late').length;
    
    // Total hours behind
    const totalHoursBehind = Number(
      activeTasks
        .filter((t) => t.status === 'critical' || t.status === 'too_late')
        .reduce((sum, t) => sum + t.estimatedHours * (1 - t.completionPercentage / 100), 0)
        .toFixed(1)
    );

    // Compounding score 0-100
    const compoundingScore = Math.min(
      100,
      Math.round(missed * 25 + totalHoursBehind * 8 + activeTasks.length * 4)
    );

    const completedOnTime = evidenceEntries.filter((e) => e.wasOnTime).length;

    return {
      totalHoursBehind,
      missedDeadlinesCount: missed,
      streakDays: completedOnTime,
      compoundingScore,
      weeklyDebtTrend: [
        { day: 'Mon', debtHours: Math.max(0.5, totalHoursBehind * 0.3) },
        { day: 'Tue', debtHours: Math.max(0.8, totalHoursBehind * 0.5) },
        { day: 'Wed', debtHours: Math.max(0.4, totalHoursBehind * 0.4) },
        { day: 'Thu', debtHours: Math.max(1.2, totalHoursBehind * 0.7) },
        { day: 'Fri', debtHours: Math.max(1.5, totalHoursBehind * 0.9) },
        { day: 'Sat', debtHours: Math.max(1.0, totalHoursBehind * 0.8) },
        { day: 'Sun', debtHours: totalHoursBehind }
      ]
    };
  }, [tasks, evidenceEntries]);

  // Load user session & data on auth state change
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setSlots([]);
        setTasks([]);
        setEvidenceEntries([]);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    setLoading(true);

    try {
      // 1. Fetch Profile
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (profData) {
        setProfile({
          id: profData.id,
          name: profData.name || 'User',
          role: profData.role || 'student'
        });
      }

      // 2. Fetch User Settings
      const { data: setData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (setData) {
        setSettings({
          intensityMode: setData.intensity_mode || 'standard',
          isMinorProfile: setData.is_minor_profile || false,
          weeklyDigestOnly: setData.weekly_digest_only || false,
          personalVelocityMultiplier: Number(setData.personal_velocity_multiplier) || 1.0
        });
      }

      // 3. Fetch Timetable Slots
      const { data: slotsData } = await supabase
        .from('timetable_slots')
        .select('*')
        .eq('user_id', userId);

      if (slotsData) {
        setSlots(
          slotsData.map((s) => ({
            id: s.id,
            userId: s.user_id,
            subject: s.subject,
            dayOfWeek: s.day_of_week,
            startTime: s.start_time,
            endTime: s.end_time,
            room: s.room || '',
            teacherName: s.teacher_name,
            strictnessTag: s.strictness_tag,
            stakesTag: s.stakes_tag,
            weight: Number(s.weight),
            notes: s.notes
          }))
        );
      } else {
        setSlots([]);
      }

      // 4. Fetch Tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId);

      if (tasksData) {
        setTasks(
          tasksData.map((t) => {
            const computedStatus = calculateTaskStatus(
              t.due_date,
              Number(t.estimated_hours),
              Number(t.completion_percentage),
              setData?.personal_velocity_multiplier || 1.0
            );
            return {
              id: t.id,
              userId: t.user_id,
              title: t.title,
              description: t.description,
              slotId: t.slot_id,
              dueDate: t.due_date,
              estimatedHours: Number(t.estimated_hours),
              completionPercentage: Number(t.completion_percentage),
              taskType: t.task_type,
              status: t.status === 'completed' ? 'completed' : computedStatus,
              createdAt: t.created_at,
              completedAt: t.completed_at,
              renegotiatedCount: Number(t.renegotiated_count || 0),
              lastRenegotiatedAt: t.last_renegotiated_at
            };
          })
        );
      } else {
        setTasks([]);
      }

      // 5. Fetch Evidence Log
      const { data: evData } = await supabase
        .from('evidence_log')
        .select('*')
        .eq('user_id', userId);

      if (evData) {
        setEvidenceEntries(
          evData.map((e) => ({
            id: e.id,
            userId: e.user_id,
            taskId: e.task_id,
            taskTitle: e.task_title,
            subject: e.subject,
            teacherName: e.teacher_name,
            predictedScenario: e.predicted_scenario,
            actualOutcome: e.actual_outcome,
            wasOnTime: e.was_on_time,
            accuracyRating: Number(e.accuracy_rating),
            dateLogged: e.date_logged,
            userNotes: e.user_notes
          }))
        );
      } else {
        setEvidenceEntries([]);
      }
    } catch (err) {
      console.error('Error fetching Supabase user data:', err);
    } finally {
      setLoading(false);
    }
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

  // Mutations
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
        id: data.id,
        userId: user.id,
        ...slotData
      };
      setSlots((prev) => [...prev, newSlot]);
      showSuccess(`Timetable slot for ${newSlot.subject} created.`);
    }
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
        userId: user.id,
        createdAt: data.created_at,
        status: computedStatus
      };

      setTasks((prev) => [newTask, ...prev]);
      showSuccess(`Task "${newTask.title}" added to War Room.`);
    }
  };

  const updateTaskProgress = async (taskId: string, percentage: number) => {
    if (!user) return;
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
    if (!user) return;
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
        userId: user.id,
        dateLogged: data.date_logged
      };
      setEvidenceEntries((prev) => [newEntry, ...prev]);
      showSuccess('Outcome logged in Evidence Case File!');
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    if (user) {
      await supabase.from('user_settings').upsert({
        user_id: user.id,
        intensity_mode: updated.intensityMode,
        is_minor_profile: updated.isMinorProfile,
        weekly_digest_only: updated.weeklyDigestOnly,
        personal_velocity_multiplier: updated.personalVelocityMultiplier
      });
    }
    showSuccess('Settings updated.');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSlots([]);
    setTasks([]);
    setEvidenceEntries([]);
    showSuccess('Logged out safely.');
  };

  return (
    <RippleContext.Provider
      value={{
        user,
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