import { supabase } from '@/integrations/supabase/client';
import { 
  TimetableSlot, 
  Task, 
  EvidenceEntry, 
  StudyLog, 
  ProcrastinationDebt, 
  UserSettings, 
  NotificationSettings,
  TaskStatus,
  TaskType,
  TaskCategory
} from '@/types/ripple';
import { safeGetStorage, safeSetStorage } from '@/utils/storageUtils';

export interface UserFullData {
  slots: TimetableSlot[];
  tasks: Task[];
  evidenceEntries: EvidenceEntry[];
  studyLogs: StudyLog[];
  debt: ProcrastinationDebt;
  settings: UserSettings;
  notificationSettings: NotificationSettings;
}

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

const defaultSettings: UserSettings = {
  intensityMode: 'standard',
  isMinorProfile: false,
  weeklyDigestOnly: false,
  personalVelocityMultiplier: 1.0
};

const defaultNotifSettings: NotificationSettings = {
  taskRemindersEnabled: true,
  classRemindersEnabled: true,
  defaultTaskReminders: ['15m', 'exact'],
  defaultClassReminders: ['15m']
};

/**
 * Fetch all user records from Supabase directly.
 * Also merges with local cached records safely if any unsynced offline records exist.
 */
export async function loadUserCloudData(userId: string): Promise<UserFullData> {
  const localSlots = safeGetStorage<TimetableSlot[]>(`ripple_slots_${userId}`, []);
  const localTasks = safeGetStorage<Task[]>(`ripple_tasks_${userId}`, []);
  const localEvidence = safeGetStorage<EvidenceEntry[]>(`ripple_evidence_${userId}`, []);
  const localStudy = safeGetStorage<StudyLog[]>(`ripple_study_${userId}`, []);
  const localDebt = safeGetStorage<ProcrastinationDebt>(`ripple_debt_${userId}`, defaultDebt);
  const localSettings = safeGetStorage<UserSettings>(`ripple_settings_${userId}`, defaultSettings);
  const localNotifSettings = safeGetStorage<NotificationSettings>(`ripple_notif_settings_${userId}`, defaultNotifSettings);

  try {
    // 1. Fetch Slots
    const { data: dbSlots, error: slotsErr } = await supabase
      .from('timetable_slots')
      .select('*')
      .eq('user_id', userId);

    let slots: TimetableSlot[] = localSlots;
    if (!slotsErr && dbSlots) {
      slots = dbSlots.map((s) => ({
        id: s.id,
        subject: s.subject,
        dayOfWeek: s.day_of_week as any,
        startTime: s.start_time,
        endTime: s.end_time,
        room: s.room || '',
        teacherName: s.teacher_name || '',
        strictnessTag: (s.strictness_tag as any) || 'NOTEBOOK_CHECK',
        stakesTag: (s.stakes_tag as any) || 'HOMEWORK',
        weight: Number(s.weight) || 20,
        reminders: (s.reminders as any) || ['15m'],
        recurrence: (s.recurrence as any) || { type: 'weekly' },
        specificDate: s.specific_date || undefined,
        notes: s.notes || undefined
      }));
      safeSetStorage(`ripple_slots_${userId}`, slots);
    }

    // 2. Fetch Tasks
    const { data: dbTasks, error: tasksErr } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    let tasks: Task[] = localTasks;
    if (!tasksErr && dbTasks) {
      tasks = dbTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description || undefined,
        slotId: t.slot_id || undefined,
        hasDeadline: t.has_deadline ?? true,
        dueDate: t.due_date || undefined,
        estimatedHours: Number(t.estimated_hours) || 1.0,
        completionPercentage: Number(t.completion_percentage) || 0,
        taskType: (t.task_type || t.type || 'problem_set') as TaskType,
        category: (t.category as TaskCategory) || 'academic',
        status: (t.status as TaskStatus) || 'manageable',
        reminders: (t.reminders as any) || ['15m', 'exact'],
        recurrence: (t.recurrence as any) || undefined,
        createdAt: t.created_at || new Date().toISOString(),
        completedAt: t.completed_at || undefined,
        renegotiatedCount: t.renegotiated_count || 0,
        lastRenegotiatedAt: t.last_renegotiated || undefined
      }));
      safeSetStorage(`ripple_tasks_${userId}`, tasks);
    }

    // 3. Fetch Evidence Entries
    const { data: dbEvidence, error: evErr } = await supabase
      .from('evidence_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    let evidenceEntries: EvidenceEntry[] = localEvidence;
    if (!evErr && dbEvidence) {
      evidenceEntries = dbEvidence.map((e) => ({
        id: e.id,
        taskId: e.task_id,
        taskTitle: e.task_title,
        subject: e.subject,
        teacherName: e.teacher_name,
        predictedScenario: e.predicted_scenario || '',
        actualOutcome: e.actual_outcome || '',
        wasOnTime: Boolean(e.was_on_time),
        accuracyRating: e.accuracy_rating || 5,
        dateLogged: e.date_logged || e.created_at || new Date().toISOString(),
        userNotes: e.user_notes || undefined
      }));
      safeSetStorage(`ripple_evidence_${userId}`, evidenceEntries);
    }

    // 4. Fetch Study Logs
    const { data: dbStudy, error: studyErr } = await supabase
      .from('study_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false });

    let studyLogs: StudyLog[] = localStudy;
    if (!studyErr && dbStudy) {
      studyLogs = dbStudy.map((l) => ({
        id: l.id,
        subject: l.subject,
        durationMinutes: l.duration_minutes,
        topic: l.topic || undefined,
        loggedAt: l.logged_at || l.created_at || new Date().toISOString(),
        source: (l.source as any) || 'manual'
      }));
      safeSetStorage(`ripple_study_${userId}`, studyLogs);
    }

    // 5. Fetch Debt
    const { data: dbDebt, error: debtErr } = await supabase
      .from('procrastination_debt')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    let debt: ProcrastinationDebt = localDebt;
    if (!debtErr && dbDebt) {
      debt = {
        totalHoursBehind: Number(dbDebt.total_hours_behind) || 0,
        missedDeadlinesCount: Number(dbDebt.missed_deadlines_count) || 0,
        streakDays: Number(dbDebt.streak_days) || 0,
        compoundingScore: Number(dbDebt.compounding_score) || 0,
        weeklyDebtTrend: (dbDebt.weekly_debt_trend as any) || defaultDebt.weeklyDebtTrend
      };
      safeSetStorage(`ripple_debt_${userId}`, debt);
    }

    // 6. Fetch User Settings
    const { data: dbSettings, error: setErr } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    let settings: UserSettings = localSettings;
    if (!setErr && dbSettings) {
      settings = {
        intensityMode: (dbSettings.intensity_mode as any) || 'standard',
        isMinorProfile: Boolean(dbSettings.is_minor_profile),
        weeklyDigestOnly: Boolean(dbSettings.weekly_digest_only),
        personalVelocityMultiplier: Number(dbSettings.personal_velocity_multiplier) || 1.0
      };
      safeSetStorage(`ripple_settings_${userId}`, settings);
    }

    // 7. Fetch Notification Settings
    const { data: dbNotif, error: notifErr } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    let notificationSettings: NotificationSettings = localNotifSettings;
    if (!notifErr && dbNotif) {
      notificationSettings = {
        taskRemindersEnabled: dbNotif.task_reminders_enabled ?? true,
        classRemindersEnabled: dbNotif.class_reminders_enabled ?? true,
        defaultTaskReminders: (dbNotif.default_task_reminders as any) || ['15m', 'exact'],
        defaultClassReminders: (dbNotif.default_class_reminders as any) || ['15m']
      };
      safeSetStorage(`ripple_notif_settings_${userId}`, notificationSettings);
    }

    return {
      slots,
      tasks,
      evidenceEntries,
      studyLogs,
      debt,
      settings,
      notificationSettings
    };
  } catch (err) {
    console.warn('[databaseSyncService] Network/auth warning, using resilient local storage:', err);
    return {
      slots: localSlots,
      tasks: localTasks,
      evidenceEntries: localEvidence,
      studyLogs: localStudy,
      debt: localDebt,
      settings: localSettings,
      notificationSettings: localNotifSettings
    };
  }
}

/**
 * Task Database Operations
 */
export async function syncTaskInsert(userId: string, task: Task): Promise<void> {
  try {
    const payload: any = {
      id: task.id,
      user_id: userId,
      title: task.title,
      description: task.description || null,
      slot_id: task.slotId || null,
      has_deadline: task.hasDeadline ?? true,
      due_date: task.dueDate || null,
      estimated_hours: task.estimatedHours,
      completion_percentage: task.completionPercentage,
      task_type: task.taskType,
      type: task.category || 'academic',
      category: task.category || 'academic',
      status: task.status,
      priority: task.status === 'critical' || task.status === 'too_late' ? 'high' : 'medium',
      reminders: task.reminders || ['15m', 'exact'],
      recurrence: task.recurrence || null,
      created_at: task.createdAt
    };

    await supabase.from('tasks').upsert(payload);
  } catch (e) {
    console.warn('[databaseSyncService] Task insert pending offline sync:', e);
  }
}

export async function syncTaskUpdate(userId: string, task: Task): Promise<void> {
  try {
    const payload: any = {
      title: task.title,
      description: task.description || null,
      slot_id: task.slotId || null,
      has_deadline: task.hasDeadline ?? true,
      due_date: task.dueDate || null,
      estimated_hours: task.estimatedHours,
      completion_percentage: task.completionPercentage,
      task_type: task.taskType,
      type: task.category || 'academic',
      category: task.category || 'academic',
      status: task.status,
      reminders: task.reminders || ['15m', 'exact'],
      recurrence: task.recurrence || null,
      completed_at: task.completedAt || null,
      renegotiated_count: task.renegotiatedCount || 0,
      last_renegotiated: task.lastRenegotiatedAt || null
    };

    await supabase.from('tasks').update(payload).eq('id', task.id).eq('user_id', userId);
  } catch (e) {
    console.warn('[databaseSyncService] Task update pending offline sync:', e);
  }
}

export async function syncTaskDelete(userId: string, taskId: string): Promise<void> {
  try {
    await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId);
  } catch (e) {
    console.warn('[databaseSyncService] Task delete error:', e);
  }
}

/**
 * Timetable Slot Database Operations
 */
export async function syncSlotInsert(userId: string, slot: TimetableSlot): Promise<void> {
  try {
    const payload: any = {
      id: slot.id,
      user_id: userId,
      subject: slot.subject,
      day_of_week: slot.dayOfWeek,
      start_time: slot.startTime,
      end_time: slot.endTime,
      room: slot.room,
      teacher_name: slot.teacherName,
      strictness_tag: slot.strictnessTag,
      stakes_tag: slot.stakesTag,
      weight: slot.weight,
      reminders: slot.reminders || ['15m'],
      recurrence: slot.recurrence || { type: 'weekly' },
      specific_date: slot.specificDate || null,
      notes: slot.notes || null
    };

    await supabase.from('timetable_slots').upsert(payload);
  } catch (e) {
    console.warn('[databaseSyncService] Slot insert pending offline sync:', e);
  }
}

export async function syncSlotUpdate(userId: string, slot: TimetableSlot): Promise<void> {
  try {
    const payload: any = {
      subject: slot.subject,
      day_of_week: slot.dayOfWeek,
      start_time: slot.startTime,
      end_time: slot.endTime,
      room: slot.room,
      teacher_name: slot.teacherName,
      strictness_tag: slot.strictnessTag,
      stakes_tag: slot.stakesTag,
      weight: slot.weight,
      reminders: slot.reminders || ['15m'],
      recurrence: slot.recurrence || { type: 'weekly' },
      specific_date: slot.specificDate || null,
      notes: slot.notes || null
    };

    await supabase.from('timetable_slots').update(payload).eq('id', slot.id).eq('user_id', userId);
  } catch (e) {
    console.warn('[databaseSyncService] Slot update pending offline sync:', e);
  }
}

export async function syncSlotDelete(userId: string, slotId: string): Promise<void> {
  try {
    await supabase.from('timetable_slots').delete().eq('id', slotId).eq('user_id', userId);
  } catch (e) {
    console.warn('[databaseSyncService] Slot delete error:', e);
  }
}

/**
 * Study Log Database Operations
 */
export async function syncStudyLogInsert(userId: string, log: StudyLog): Promise<void> {
  try {
    const payload: any = {
      id: log.id,
      user_id: userId,
      subject: log.subject,
      duration_minutes: log.durationMinutes,
      topic: log.topic || null,
      logged_at: log.loggedAt,
      source: log.source || 'manual'
    };

    await supabase.from('study_logs').upsert(payload);
  } catch (e) {
    console.warn('[databaseSyncService] Study log insert error:', e);
  }
}

export async function syncStudyLogDelete(userId: string, logId: string): Promise<void> {
  try {
    await supabase.from('study_logs').delete().eq('id', logId).eq('user_id', userId);
  } catch (e) {
    console.warn('[databaseSyncService] Study log delete error:', e);
  }
}

/**
 * Evidence Entry Database Operations
 */
export async function syncEvidenceInsert(userId: string, entry: EvidenceEntry): Promise<void> {
  try {
    const payload: any = {
      id: entry.id,
      user_id: userId,
      task_id: entry.taskId,
      task_title: entry.taskTitle,
      subject: entry.subject,
      teacher_name: entry.teacherName,
      predicted_scenario: entry.predictedScenario || null,
      actual_outcome: entry.actualOutcome || null,
      was_on_time: entry.wasOnTime,
      accuracy_rating: entry.accuracyRating,
      date_logged: entry.dateLogged,
      user_notes: entry.userNotes || null
    };

    await supabase.from('evidence_entries').upsert(payload);
  } catch (e) {
    console.warn('[databaseSyncService] Evidence insert error:', e);
  }
}

/**
 * Debt & Settings Operations
 */
export async function syncDebtUpsert(userId: string, debt: ProcrastinationDebt): Promise<void> {
  try {
    const payload: any = {
      user_id: userId,
      total_hours_behind: debt.totalHoursBehind,
      missed_deadlines_count: debt.missedDeadlinesCount,
      streak_days: debt.streakDays,
      compounding_score: debt.compoundingScore,
      weekly_debt_trend: debt.weeklyDebtTrend
    };

    const { data: existing } = await supabase
      .from('procrastination_debt')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing?.id) {
      await supabase.from('procrastination_debt').update(payload).eq('user_id', userId);
    } else {
      await supabase.from('procrastination_debt').insert(payload);
    }
  } catch (e) {
    console.warn('[databaseSyncService] Debt upsert error:', e);
  }
}

export async function syncUserSettings(userId: string, settings: UserSettings): Promise<void> {
  try {
    const payload: any = {
      user_id: userId,
      intensity_mode: settings.intensityMode,
      is_minor_profile: settings.isMinorProfile,
      weekly_digest_only: settings.weeklyDigestOnly,
      personal_velocity_multiplier: settings.personalVelocityMultiplier
    };

    await supabase.from('user_settings').upsert(payload);
  } catch (e) {
    console.warn('[databaseSyncService] User settings upsert error:', e);
  }
}

export async function syncNotificationSettings(userId: string, settings: NotificationSettings): Promise<void> {
  try {
    const payload: any = {
      user_id: userId,
      task_reminders_enabled: settings.taskRemindersEnabled,
      class_reminders_enabled: settings.classRemindersEnabled,
      default_task_reminders: settings.defaultTaskReminders,
      default_class_reminders: settings.defaultClassReminders
    };

    await supabase.from('notification_settings').upsert(payload);
  } catch (e) {
    console.warn('[databaseSyncService] Notification settings upsert error:', e);
  }
}