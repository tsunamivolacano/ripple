import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  TimetableSlot, 
  Task, 
  EvidenceEntry, 
  StudyLog,
  ProcrastinationDebt, 
  UserSettings,
  NotificationSettings
} from '@/types/ripple';
import { calculateTaskStatus } from '@/utils/timeUtils';
import { safeGetStorage, safeSetStorage } from '@/utils/storageUtils';
import { PERSONAS_MAP } from '@/data/ripplePersonaData';
import { showSuccess } from '@/utils/toast';
import { 
  scheduleTaskNotifications, 
  scheduleClassNotifications, 
  cancelItemNotifications, 
  getNextSlotDateISO 
} from '@/utils/notificationService';
import { UserAccount } from './useRippleAuth';
import { ActivityLogger } from '@/services/activityLogger';

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

export function useRippleData(currentUser: UserAccount | null) {
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [currentPersonaId, setCurrentPersonaId] = useState<string>('riya');
  
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntry[]>([]);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [debt, setDebt] = useState<ProcrastinationDebt>(emptyDebt);
  const [settings, setSettings] = useState<UserSettings>(emptySettings);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);

  const [activeTaskForPrediction, setActiveTaskForPrediction] = useState<Task | null>(null);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [completedTaskForCelebration, setCompletedTaskForCelebration] = useState<Task | null>(null);
  const [isNotificationModalOpen, setNotificationModalOpen] = useState<boolean>(false);

  // Load account data when currentUser changes
  useEffect(() => {
    if (!currentUser) {
      setSlots([]);
      setTasks([]);
      setEvidenceEntries([]);
      setStudyLogs([]);
      setDebt(emptyDebt);
      setSettings(emptySettings);
      return;
    }

    setIsLoadingData(true);
    const uKey = currentUser.id;

    if (currentUser.isDemo && currentUser.demoPersonaId) {
      const persona = PERSONAS_MAP[currentUser.demoPersonaId] || defaultPersona;
      setSlots(persona.slots);
      setTasks(persona.tasks);
      setEvidenceEntries(persona.evidenceEntries);
      setStudyLogs(initialStudyLogs);
      setDebt(persona.debt);
      setSettings(persona.settings);
      setNotificationSettings(defaultNotificationSettings);
      setCurrentPersonaId(persona.id);
      setIsLoadingData(false);
      return;
    }

    // Load data from Supabase
    loadUserDataFromSupabase(uKey);
  }, [currentUser?.id]);

  const loadUserDataFromSupabase = async (userId: string) => {
    try {
      // Load slots (timetable)
      const { data: slotsData } = await supabase
        .from('timetable_slots')
        .select('*')
        .eq('user_id', userId);
      
      // Load tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      // Load evidence entries
      const { data: evidenceData } = await supabase
        .from('evidence_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date_logged', { ascending: false });
      
      // Load study logs
      const { data: studyData } = await supabase
        .from('study_logs')
        .select('*')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false });
      
      // Load debt
      const { data: debtData } = await supabase
        .from('procrastination_debt')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // Load settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // Load notification settings
      const { data: notifSettingsData } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Set data (fallback to localStorage if Supabase fails)
      setSlots(slotsData || []);
      setTasks(tasksData || []);
      setEvidenceEntries(evidenceData || []);
      setStudyLogs(studyData || initialStudyLogs);
      setDebt(debtData || emptyDebt);
      setSettings(settingsData || emptySettings);
      setNotificationSettings(notifSettingsData || defaultNotificationSettings);
    } catch (e) {
      console.warn('[useRippleData] Failed to load from Supabase, falling back to localStorage:', e);
      // Fallback to localStorage
      const uKey = currentUser?.id;
      if (uKey) {
        const localSlots = safeGetStorage<TimetableSlot[] | null>(`ripple_slots_${uKey}`, null);
        const localTasks = safeGetStorage<Task[] | null>(`ripple_tasks_${uKey}`, null);
        const localEvidence = safeGetStorage<EvidenceEntry[] | null>(`ripple_evidence_${uKey}`, null);
        const localStudy = safeGetStorage<StudyLog[] | null>(`ripple_study_${uKey}`, null);
        const localDebt = safeGetStorage<ProcrastinationDebt | null>(`ripple_debt_${uKey}`, null);
        const localSettings = safeGetStorage<UserSettings | null>(`ripple_settings_${uKey}`, null);
        const localNotifSettings = safeGetStorage<NotificationSettings | null>(`ripple_notif_settings_${uKey}`, null);

        setSlots(localSlots !== null ? localSlots : []);
        setTasks(localTasks !== null ? localTasks : []);
        setEvidenceEntries(localEvidence !== null ? localEvidence : []);
        setStudyLogs(localStudy !== null ? localStudy : initialStudyLogs);
        setDebt(localDebt !== null ? localDebt : emptyDebt);
        setSettings(localSettings !== null ? localSettings : emptySettings);
        setNotificationSettings(localNotifSettings !== null ? localNotifSettings : defaultNotificationSettings);
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  // Dynamic task status ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTasks((prevTasks) =>
        prevTasks.map((t) => {
          if (t.status === 'completed' || t.status === 'renegotiated') return t;
          const newStatus = calculateTaskStatus(t.dueDate, t.estimatedHours, t.completionPercentage, settings.personalVelocityMultiplier, t.hasDeadline ?? true);
          return { ...t, status: newStatus };
        })
      );
    }, 30000);
    return () => clearInterval(timer);
  }, [settings.personalVelocityMultiplier]);

  const addSlot = async (slotData: Omit<TimetableSlot, 'id'>) => {
    if (!currentUser) return;
    const newSlot: TimetableSlot = { ...slotData, id: `slot-${Date.now()}` };
    const updatedSlots = [...slots, newSlot];
    setSlots(updatedSlots);

    // Save to Supabase
    try {
      await supabase
        .from('timetable_slots')
        .insert({
          id: newSlot.id,
          user_id: currentUser.id,
          subject: newSlot.subject,
          day_of_week: newSlot.dayOfWeek,
          start_time: newSlot.startTime,
          end_time: newSlot.endTime,
          room: newSlot.room,
          teacher_name: newSlot.teacherName,
          strictness_tag: newSlot.strictnessTag,
          stakes_tag: newSlot.stakesTag,
          weight: newSlot.weight,
          reminders: newSlot.reminders,
          recurrence: newSlot.recurrence,
          specific_date: newSlot.specificDate,
          notes: newSlot.notes
        });
    } catch (e) {
      console.warn('[useRippleData] Failed to save slot to Supabase:', e);
    }

    ActivityLogger.slotAdded(currentUser.id, newSlot.id, newSlot.subject, {
      teacher: newSlot.teacherName,
      time: `${newSlot.startTime} - ${newSlot.endTime}`,
      day: newSlot.dayOfWeek
    });

    const nextClassISO = getNextSlotDateISO(newSlot.dayOfWeek, newSlot.startTime);
    await scheduleClassNotifications(currentUser.id, newSlot, nextClassISO, notificationSettings);
    showSuccess(`Timetable slot for ${newSlot.subject} created with reminders.`);
  };

  const updateSlot = async (updatedSlot: TimetableSlot) => {
    if (!currentUser) return;
    const updatedSlots = slots.map((s) => (s.id === updatedSlot.id ? updatedSlot : s));
    setSlots(updatedSlots);

    // Save to Supabase
    try {
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
          reminders: updatedSlot.reminders,
          recurrence: updatedSlot.recurrence,
          specific_date: updatedSlot.specificDate,
          notes: updatedSlot.notes
        })
        .eq('id', updatedSlot.id)
        .eq('user_id', currentUser.id);
    } catch (e) {
      console.warn('[useRippleData] Failed to update slot in Supabase:', e);
    }

    ActivityLogger.slotUpdated(currentUser.id, updatedSlot.id, updatedSlot.subject, {
      teacher: updatedSlot.teacherName,
      time: `${updatedSlot.startTime} - ${updatedSlot.endTime}`,
      day: updatedSlot.dayOfWeek
    });

    const nextClassISO = getNextSlotDateISO(updatedSlot.dayOfWeek, updatedSlot.startTime);
    await scheduleClassNotifications(currentUser.id, updatedSlot, nextClassISO, notificationSettings);
    showSuccess(`Updated ${updatedSlot.subject} class schedule.`);
  };

  const deleteSlot = async (id: string) => {
    if (!currentUser) return;
    const deletedSlot = slots.find(s => s.id === id);
    setSlots((prev) => prev.filter((s) => s.id !== id));
    await cancelItemNotifications(currentUser.id, id);
    
    // Delete from Supabase
    try {
      await supabase
        .from('timetable_slots')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);
    } catch (e) {
      console.warn('[useRippleData] Failed to delete slot from Supabase:', e);
    }
    
    if (deletedSlot) {
      ActivityLogger.slotDeleted(currentUser.id, id, deletedSlot.subject, {
        teacher: deletedSlot.teacherName,
        time: `${deletedSlot.startTime} - ${deletedSlot.endTime}`,
        day: deletedSlot.dayOfWeek
      });
    }
    
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

    setTasks((prev) => [newTask, ...prev]);

    // Save to Supabase
    try {
      await supabase
        .from('tasks')
        .insert({
          id: newTask.id,
          user_id: currentUser.id,
          title: newTask.title,
          description: newTask.description,
          type: newTask.category || 'academic',
          status: newTask.status,
          priority: 'medium',
          due_date: newTask.dueDate,
          estimated_hours: newTask.estimatedHours,
          completion_percentage: newTask.completionPercentage,
          category: newTask.category || 'academic',
          has_deadline: newTask.hasDeadline ?? true,
          renegotiated_count: 0
        });
    } catch (e) {
      console.warn('[useRippleData] Failed to save task to Supabase:', e);
    }

    ActivityLogger.taskCreated(currentUser.id, newTask.id, newTask.title, {
      has_deadline: newTask.hasDeadline,
      estimated_hours: newTask.estimatedHours,
      due_date: newTask.dueDate,
      task_type: newTask.taskType,
      category: newTask.category
    });

    if (newTask.hasDeadline && newTask.dueDate) {
      await scheduleTaskNotifications(currentUser.id, newTask, notificationSettings);
    }
    showSuccess(`Activity "${newTask.title}" added successfully.`);
  };

  const updateTaskProgress = async (taskId: string, percentage: number) => {
    if (!currentUser) return;

    setTasks((prevTasks) =>
      prevTasks.map((t) => {
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

          ActivityLogger.taskUpdated(currentUser.id, taskId, t.title, {
            completion_percentage: percentage,
            previous_status: t.status,
            new_status: updatedStatus
          });

          if (isComplete) {
            setCompletedTaskForCelebration(updatedTask);
            cancelItemNotifications(currentUser.id, taskId);

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

    // Save to Supabase
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const isComplete = percentage >= 100;
        const updatedStatus = isComplete
          ? 'completed'
          : calculateTaskStatus(task.dueDate, task.estimatedHours, percentage, settings.personalVelocityMultiplier, task.hasDeadline ?? true);

        await supabase
          .from('tasks')
          .update({
            completion_percentage: percentage,
            status: updatedStatus,
            completed_at: isComplete ? new Date().toISOString() : null
          })
          .eq('id', taskId)
          .eq('user_id', currentUser.id);
      }
    } catch (e) {
      console.warn('[useRippleData] Failed to update task in Supabase:', e);
    }
  };

  const completeTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    await updateTaskProgress(taskId, 100);
    
    ActivityLogger.taskCompleted(currentUser.id, taskId, task.title, {
      completion_time: new Date().toISOString()
    });
  };

  const renegotiateTask = async (taskId: string, newDueDate: string, reason: string) => {
    if (!currentUser) return;

    let updatedTaskObj: Task | null = null;

    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        if (t.id === taskId) {
          const count = (t.renegotiatedCount || 0) + 1;
          const newStatus = calculateTaskStatus(newDueDate, t.estimatedHours, t.completionPercentage, settings.personalVelocityMultiplier, true);
          const obj: Task = {
            ...t,
            hasDeadline: true,
            dueDate: newDueDate,
            renegotiatedCount: count,
            lastRenegotiated: new Date().toISOString(),
            status: newStatus === 'too_late' ? 'tight' : newStatus
          };
          updatedTaskObj = obj;
          return obj;
        }
        return t;
      })
    );

    if (updatedTaskObj) {
      await scheduleTaskNotifications(currentUser.id, updatedTaskObj, notificationSettings);
      
      // Save to Supabase
      try {
        await supabase
          .from('tasks')
          .update({
            has_deadline: true,
            due_date: newDueDate,
            renegotiated_count: updatedTaskObj.renegotiatedCount,
            last_renegotiated: updatedTaskObj.lastRenegotiated,
            status: updatedTaskObj.status
          })
          .eq('id', taskId)
          .eq('user_id', currentUser.id);
      } catch (e) {
        console.warn('[useRippleData] Failed to renegotiate task in Supabase:', e);
      }
      
      ActivityLogger.taskRenegotiated(currentUser.id, taskId, updatedTaskObj.title, {
        reason,
        new_due_date: newDueDate,
        previous_due_date: updatedTaskObj.dueDate
      });
    }

    setDebt((d) => ({
      ...d,
      totalHoursBehind: d.totalHoursBehind + 0.5,
      compoundingScore: Math.min(100, d.compoundingScore + 8)
    }));

    showSuccess('Task schedule renegotiated & notifications updated.');
  };

  const deleteTask = async (id: string) => {
    if (!currentUser) return;
    const deletedTask = tasks.find(t => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await cancelItemNotifications(currentUser.id, id);
    
    // Delete from Supabase
    try {
      await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);
    } catch (e) {
      console.warn('[useRippleData] Failed to delete task from Supabase:', e);
    }
    
    if (deletedTask) {
      ActivityLogger.taskDeleted(currentUser.id, id, deletedTask.title, {
        was_completed: deletedTask.status === 'completed',
        completion_percentage: deletedTask.completionPercentage
      });
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
    
    // Save to Supabase
    try {
      await supabase
        .from('evidence_entries')
        .insert({
          id: newEntry.id,
          user_id: currentUser.id,
          task_id: newEntry.taskId,
          task_title: newEntry.taskTitle,
          subject: newEntry.subject,
          teacher_name: newEntry.teacherName,
          predicted_scenario: newEntry.predictedScenario,
          actual_outcome: newEntry.actualOutcome,
          was_on_time: newEntry.wasOnTime,
          accuracy_rating: newEntry.accuracyRating,
          date_logged: newEntry.dateLogged,
          user_notes: newEntry.userNotes
        });
    } catch (e) {
      console.warn('[useRippleData] Failed to save evidence to Supabase:', e);
    }
    
    ActivityLogger.evidenceLogged(currentUser.id, newEntry.id, newEntry.taskTitle, {
      was_on_time: newEntry.wasOnTime,
      accuracy_rating: newEntry.accuracyRating,
      subject: newEntry.subject,
      teacher: newEntry.teacherName
    });
    
    showSuccess('Outcome logged in Evidence Case File!');
  };

  const addStudyLog = async (logData: Omit<StudyLog, 'id' | 'loggedAt'>) => {
    if (!currentUser) return;
    const newLog: StudyLog = {
      ...logData,
      id: `study-${Date.now()}`,
      loggedAt: new Date().toISOString()
    };
    setStudyLogs((prev) => [newLog, ...prev]);
    
    // Save to Supabase
    try {
      await supabase
        .from('study_logs')
        .insert({
          id: newLog.id,
          user_id: currentUser.id,
          subject: newLog.subject,
          duration_minutes: newLog.durationMinutes,
          topic: newLog.topic,
          logged_at: newLog.loggedAt,
          source: newLog.source
        });
    } catch (e) {
      console.warn('[useRippleData] Failed to save study log to Supabase:', e);
    }
    
    ActivityLogger.studyLogAdded(currentUser.id, newLog.id, newLog.subject, {
      duration_minutes: newLog.durationMinutes,
      topic: newLog.topic,
      source: newLog.source
    });
    
    showSuccess(`Logged ${newLog.durationMinutes} minutes of study for ${newLog.subject}!`);
  };

  const deleteStudyLog = async (id: string) => {
    if (!currentUser) return;
    const deletedLog = studyLogs.find(l => l.id === id);
    setStudyLogs((prev) => prev.filter((l) => l.id !== id));
    
    // Delete from Supabase
    try {
      await supabase
        .from('study_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);
    } catch (e) {
      console.warn('[useRippleData] Failed to delete study log from Supabase:', e);
    }
    
    if (deletedLog) {
      ActivityLogger.studyLogDeleted(currentUser.id, id, deletedLog.subject, {
        duration_minutes: deletedLog.durationMinutes,
        topic: deletedLog.topic,
        source: deletedLog.source
      });
    }
    
    showSuccess('Study entry removed.');
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!currentUser) return;
    setSettings((prev) => ({ ...prev, ...newSettings }));
    
    // Save to Supabase
    try {
      await supabase
        .from('user_settings')
        .upsert({
          user_id: currentUser.id,
          ...newSettings
        });
    } catch (e) {
      console.warn('[useRippleData] Failed to save settings to Supabase:', e);
    }
    
    ActivityLogger.settingsUpdated(currentUser.id, {
      changed_fields: Object.keys(newSettings),
      new_values: newSettings
    });
    
    showSuccess('Settings updated.');
  };

  const updateNotificationSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!currentUser) return;
    setNotificationSettings((prev) => ({ ...prev, ...newSettings }));
    
    // Save to Supabase
    try {
      await supabase
        .from('notification_settings')
        .upsert({
          user_id: currentUser.id,
          ...newSettings
        });
    } catch (e) {
      console.warn('[useRippleData] Failed to save notification settings to Supabase:', e);
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
    showSuccess('All data reset for active account.');
  };

  return {
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
    updateNotificationSettings,
    loadPersonaData,
    resetAllData
  };
}