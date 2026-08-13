import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safeGetStorage, safeSetStorage, getLocalUserId } from '@/utils/storageUtils';
import { PERSONAS_MAP } from '@/data/ripplePersonaData';
import { showSuccess } from '@/utils/toast';
import { ActivityLogger } from '@/services/activityLogger';

export interface UserAccount {
  id: string;
  email: string;
  isDemo?: boolean;
  demoPersonaId?: string;
  isLocalSession?: boolean;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
}

export function useRippleAuth() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    safeGetStorage<UserAccount | null>('ripple_active_user', null)
  );

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
        
        // Log login activity
        ActivityLogger.userLogin(session.user.id, session.user.email || '', {
          method: 'session_restore'
        });
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
        
        // Log login activity
        ActivityLogger.userLogin(session.user.id, session.user.email || '', {
          method: 'auth_state_change'
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    try {
      const { data } = await supabase.auth.signInWithPassword({
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
        
        // Log login activity
        ActivityLogger.userLogin(data.user.id, cleanEmail, {
          method: 'email_password'
        });
        
        return { success: true };
      }
    } catch (e) {
      console.warn('Auth exception, fallback to local session:', e);
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
    
    // Log login activity for local session
    ActivityLogger.userLogin(localId, cleanEmail, {
      method: 'local_session'
    });
    
    return { success: true };
  };

  const signUpWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    try {
      const { data } = await supabase.auth.signUp({
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
        
        // Log signup activity
        ActivityLogger.userSignup(data.user.id, cleanEmail, {
          method: 'email_password'
        });
        
        return { success: true };
      }
    } catch (e) {
      console.warn('Signup exception, fallback to local session:', e);
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
    
    // Log signup activity for local session
    ActivityLogger.userSignup(localId, cleanEmail, {
      method: 'local_session'
    });
    
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
    setCurrentUser(account);
    safeSetStorage('ripple_active_user', account);
    showSuccess(`Viewing Demo Persona: ${persona.name}`);
    
    // Log login activity for demo account
    ActivityLogger.userLogin(account.id, account.email, {
      method: 'demo_account',
      persona_id: persona.id
    });
  };

  const logout = async () => {
    try {
      if (currentUser && !currentUser.isDemo && !currentUser.isLocalSession) {
        // Log logout activity before signing out
        ActivityLogger.userLogout(currentUser.id, currentUser.email, {
          method: 'supabase_signout'
        });
        
        await supabase.auth.signOut();
      } else if (currentUser) {
        // Log logout for local/demo sessions
        ActivityLogger.userLogout(currentUser.id, currentUser.email, {
          method: currentUser.isDemo ? 'demo_logout' : 'local_logout'
        });
      }
    } catch (e) {
      console.error('Error signing out:', e);
    } finally {
      localStorage.removeItem('ripple_active_user');
      sessionStorage.removeItem('ripple_active_user');
      setCurrentUser(null);
      showSuccess('Signed out successfully.');
    }
  };

  return {
    currentUser,
    loginWithEmail,
    signUpWithEmail,
    loginDemoAccount,
    logout
  };
}
</arg_value></tool_call>Now let me update the data hook to log task and study log activities:

<dyad-write path="src/hooks/useRippleData.ts" description="Updating data hook to log task and study log activities">
import { useState, useEffect } from 'react';
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

    setIsLoadingData(false);
  }, [currentUser?.id]);

  // Sync changes to storage
  useEffect(() => {
    if (currentUser && !currentUser.isDemo) {
      const uKey = currentUser.id;
      safeSetStorage(`ripple_slots_${uKey}`, slots);
      safeSetStorage(`ripple_tasks_${uKey}`, tasks);
      safeSetStorage(`ripple_evidence_${uKey}`, evidenceEntries);
      safeSetStorage(`ripple_study_${uKey}`, studyLogs);
      safeSetStorage(`ripple_debt_${uKey}`, debt);
      safeSetStorage(`ripple_settings_${uKey}`, settings);
      safeSetStorage(`ripple_notif_settings_${uKey}`, notificationSettings);
    }
  }, [currentUser, slots, tasks, evidenceEntries, studyLogs, debt, settings, notificationSettings]);

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

    // Log slot addition
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

    // Log slot update
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
    
    // Log slot deletion
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

    // Log task creation
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

          // Log task update
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
  };

  const completeTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    await updateTaskProgress(taskId, 100);
    
    // Log task completion
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
            lastRenegotiatedAt: new Date().toISOString(),
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
      
      // Log task renegotiation
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
    
    // Log task deletion
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
    
    // Log evidence entry
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
    
    // Log study log addition
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
    
    // Log study log deletion
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
    
    // Log settings update
    ActivityLogger.settingsUpdated(currentUser.id, {
      changed_fields: Object.keys(newSettings),
      new_values: newSettings
    });
    
    showSuccess('Settings updated.');
  };

  const updateNotificationSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!currentUser) return;
    setNotificationSettings((prev) => ({ ...prev, ...newSettings }));
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