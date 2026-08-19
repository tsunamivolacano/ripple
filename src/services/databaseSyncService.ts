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
import { isValidUUID, generateUUID } from '@/utils/uuidUtils';
import { calculateUnifiedDebt } from '@/utils/studyDebtUtils';

export interface UserFullData {
  slots: TimetableSlot[];
  tasks: Task[];
  evidenceEntries: EvidenceEntry[];
  studyLogs: StudyLog[];
  debt: ProcrastinationDebt;
  settings: UserSettings;
  notificationSettings: NotificationSettings;
}

const defaultSettings: UserSettings = {
  intensityMode: 'standard',
  isMinorProfile: false,
  weeklyDigestOnly: false,
  personalVelocityMultiplier: 1.0,
  dailyStudyTargetHours: 3.0
};

const defaultNotifSettings: NotificationSettings = {
  taskRemindersEnabled: true,
  classRemindersEnabled: true,
  defaultTaskReminders: ['15m', 'exact'],
  defaultClassReminders: ['15m']
};

/**
 * Load all records from Supabase directly as the primary single source of truth.
 */
export async function loadUserCloudData(userId: string): Promise<UserFullData> {
  const localSlots = safeGetStorage<TimetableSlot[]>(`ripple_slots_${userId}`, []);
  const localTasks = safeGetStorage<Task[]>(`ripple_tasks_${userId}`, []);
  const localEvidence = safeGetStorage<EvidenceEntry[]>(`ripple_evidence_${userId}`, []);
  const localStudy = safeGetStorage<StudyLog[]>(`ripple_study_${userId}`, []);
  const localSettings = safeGetStorage<UserSettings>(`ripple_settings_${userId}`, defaultSettings);
  const localNotifSettings = safeGetStorage<NotificationSettings>(`ripple_notif_settings_${userId}`, defaultNotifSettings);

  if (!isValidUUID(userId)) {
    const targetHours = localSettings.dailyStudyTargetHours || 3.0;
    const debt = calculateUnifiedDebt(localStudy, localTasks, targetHours, 1);
    return {
      slots: localSlots,
      tasks: localTasks,
      evidenceEntries: localEvidence,
      studyLogs: localStudy,
      debt,
      settings: localSettings,
      notificationSettings: localNotifSettings
    };
  }

  try {
    // 1. Fetch Study Logs from Supabase
    let studyLogs: StudyLog[] = [];
    const { data: dbStudy, error: studyErr } = await supabase
      .from('study_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false });

    if (!studyErr && dbStudy) {
      studyLogs = dbStudy.map((l) => ({
        id: l.id,
        subject: l.subject,
        durationMinutes: Number(l.duration_minutes) || 0,
        topic: l.topic || undefined,
        loggedAt: l.logged_at || l.created_at || new Date().toISOString(),
        source: (l.source as any) || 'manual'
      }));
      safeSetStorage(`ripple_study_${userId}`, studyLogs);
    } else {
      if (studyErr) console.warn('[databaseSyncService] Failed to fetch study_logs:', studyErr.message);
      studyLogs = localStudy;
    }

    // 2. Fetch Tasks from Supabase
    let tasks: Task[] = [];
    const { data: dbTasks, error: tasksErr } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

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
    } else {
      if (tasksErr) console.warn('[databaseSyncService] Failed to fetch tasks:', tasksErr.message);
      tasks = localTasks;
    }

    // 3. Fetch Timetable Slots from Supabase
    let slots: TimetableSlot[] = [];
    const { data: dbSlots, error: slotsErr } = await supabase
      .from('timetable_slots')
      .select('*')
      .eq('user_id', userId);

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
    } else {
      if (slotsErr) console.warn('[databaseSyncService] Failed to fetch timetable_slots:', slotsErr.message);
      slots = localSlots;
    }

    // 4. Fetch Evidence Case Files from Supabase
    let evidenceEntries: EvidenceEntry[] = [];
    const { data: dbEvidence, error: evErr } = await supabase
      .from('evidence_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

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
    } else {
      if (evErr) console.warn('[databaseSyncService] Failed to fetch evidence_entries:', evErr.message);
      evidenceEntries = localEvidence;
    }

    // 5. Fetch User Settings
    let settings: UserSettings = localSettings;
    const { data: dbSettings, error: setErr } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!setErr && dbSettings) {
      settings = {
        intensityMode: (dbSettings.intensity_mode as any) || 'standard',
        isMinorProfile: Boolean(dbSettings.is_minor_profile),
        weeklyDigestOnly: Boolean(dbSettings.weekly_digest_only),
        personalVelocityMultiplier: Number(dbSettings.personal_velocity_multiplier) || 1.0,
        dailyStudyTargetHours: 3.0
      };
      safeSetStorage(`ripple_settings_${userId}`, settings);
    }

    // 6. Fetch Notification Settings
    let notificationSettings: NotificationSettings = localNotifSettings;
    const { data: dbNotif, error: notifErr } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!notifErr && dbNotif) {
      notificationSettings = {
        taskRemindersEnabled: dbNotif.task_reminders_enabled ?? true,
        classRemindersEnabled: dbNotif.class_reminders_enabled ?? true,
        defaultTaskReminders: (dbNotif.default_task_reminders as any) || ['15m', 'exact'],
        defaultClassReminders: (dbNotif.default_class_reminders as any) || ['15m']
      };
      safeSetStorage(`ripple_notif_settings_${userId}`, notificationSettings);
    }

    // 7. Calculate real-time persistent debt & shortfall from actual study logs & tasks
    const targetHours = settings.dailyStudyTargetHours || 3.0;
    const debt = calculateUnifiedDebt(studyLogs, tasks, targetHours, 1);
    safeSetStorage(`ripple_debt_${userId}`, debt);

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
    console.warn('[databaseSyncService] Network notice, using local cache backup:', err);
    const targetHours = localSettings.dailyStudyTargetHours || 3.0;
    const debt = calculateUnifiedDebt(localStudy, localTasks, targetHours, 1);

    return {
      slots: localSlots,
      tasks: localTasks,
      evidenceEntries: localEvidence,
      studyLogs: localStudy,
      debt,
      settings: localSettings,
      notificationSettings: localNotifSettings
    };
  }
}

/**
 * Study Log Database Operations (Guaranteed Supabase UUID Insert)
 */
export async function syncStudyLogInsert(userId: string, log: StudyLog): Promise<string | null> {
  if (!isValidUUID(userId)) return null;

  try {
    const validId = isValidUUID(log.id) ? log.id : generateUUID();

    const payload = {
      id: validId,
      user_id: userId,
      subject: log.subject,
      duration_minutes: Math.max(1, Math.round(log.durationMinutes)),
      topic: log.topic || null,
      logged_at: log.loggedAt || new Date().toISOString(),
      source: log.source || 'manual'
    };

    const { data, error } = await supabase.from('study_logs').insert(payload).select('id').single();
    if (error) {
      console.error('[databaseSyncService] Error inserting study log into Supabase:', error.message, error.details);
      return null;
    }
    return data?.id || validId;
  } catch (e) {
    console.error('[databaseSyncService] Study log insert exception:', e);
    return null;
  }
}

export async function syncStudyLogDelete(userId: string, logId: string): Promise<void> {
  if (!isValidUUID(userId) || !isValidUUID(logId)) return;

  try {
    const { error } = await supabase.from('study_logs').delete().eq('id', logId).eq('user_id', userId);
    if (error) {
      console.error('[databaseSyncService] Error deleting study log:', error.message);
    }
  } catch (e) {
    console.error('[databaseSyncService] Study log delete exception:', e);
  }
}

/**
 * Task Database Operations
 */
export async function syncTaskInsert(userId: string, task: Task): Promise<void> {
  if (!isValidUUID(userId)) return;

  try {
    const validId = isValidUUID(task.id) ? task.id : generateUUID();

    const payload = {
      id: validId,
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
      created_at: task.createdAt || new Date().toISOString()
    };

    const { error } = await supabase.from('tasks').upsert(payload);
    if (error) {
      console.error('[databaseSyncService] Error upserting task:', error.message);
    }
  } catch (e) {
    console.warn('[databaseSyncService] Task insert notice:', e);
  }
}

export async function syncTaskUpdate(userId: string, task: Task): Promise<void> {
  if (!isValidUUID(userId)) return;

  try {
    const payload = {
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

    const { error } = await supabase.from('tasks').update(payload).eq('id', task.id).eq('user_id', userId);
    if (error) {
      console.error('[databaseSyncService] Error updating task:', error.message);
    }
  } catch (e) {
    console.warn('[databaseSyncService] Task update notice:', e);
  }
}

export async function syncTaskDelete(userId: string, taskId: string): Promise<void> {
  if (!isValidUUID(userId)) return;

  try {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId);
    if (error) {
      console.error('[databaseSyncService] Error deleting task:', error.message);
    }
  } catch (e) {
    console.warn('[databaseSyncService] Task delete notice:', e);
  }
}

/**
 * Timetable Slot Database Operations
 */
export async function syncSlotInsert(userId: string, slot: TimetableSlot): Promise<void> {
  if (!isValidUUID(userId)) return;

  try {
    const payload = {
      id: slot.id,
      user_id: userId,
      subject: slot.subject,
      day_of_week: slot.dayOfWeek,
      start_time: slot.startTime,
      end_time: slot.endTime,
      room: slot.room || '',
      teacher_name: slot.teacherName || '',
      strictness_tag: slot.strictnessTag,
      stakes_tag: slot.stakesTag,
      weight: slot.weight,
      reminders: slot.reminders || ['15m'],
      recurrence: slot.recurrence || { type: 'weekly' },
      specific_date: slot.specificDate || null,
      notes: slot.notes || null
    };

    const { error } = await supabase.from('timetable_slots').upsert(payload);
    if (error) {
      console.error('[databaseSyncService] Error upserting slot:', error.message);
    }
  } catch (e) {
    console.warn('[databaseSyncService] Slot insert notice:', e);
  }
}

export async function syncSlotUpdate(userId: string, slot: TimetableSlot): Promise<void> {
  if (!isValidUUID(userId)) return;

  try {
    const payload = {
      subject: slot.subject,
      day_of_week: slot.dayOfWeek,
      start_time: slot.startTime,
      end_time: slot.endTime,
      room: slot.room || '',
      teacher_name: slot.teacherName || '',
      strictness_tag: slot.strictnessTag,
      stakes_tag: slot.stakesTag,
      weight: slot.weight,
      reminders: slot.reminders || ['15m'],
      recurrence: slot.recurrence || { type: 'weekly' },
      specific_date: slot.specificDate || null,
      notes: slot.notes || null
    };

    const { error } = await supabase.from('timetable_slots').update(payload).eq('id', slot.id).eq('user_id', userId);
    if (error) {
      console.error('[databaseSyncService] Error updating slot:', error.message);
    }
  } catch (e) {
    console.warn('[databaseSyncService] Slot update notice:', e);
  }
}

export async function syncSlotDelete(userId: string, slotId: string): Promise<void> {
  if (!isValidUUID(userId)) return;

  try {
    const { error } = await supabase.from('timetable_slots').delete().eq('id', slotId).eq('user_id', userId);
    if (error) {
      console.error('[databaseSyncService] Error deleting slot:', error.message);
    }
  } catch (e) {
    console.warn('[databaseSyncService] Slot delete notice:', e);
  }
}

/**
 * Evidence Case File Database Operations (Guaranteed Supabase UUID Insert)
 */
export async function syncEvidenceInsert(userId: string, entry: EvidenceEntry): Promise<string | null> {
  if (!isValidUUID(userId)) return null;

  try {
    const validId = isValidUUID(entry.id) ? entry.id : generateUUID();

    const payload = {
      id: validId,
      user_id: userId,
      task_id: entry.taskId,
      task_title: entry.taskTitle,
      subject: entry.subject,
      teacher_name: entry.teacherName,
      predicted_scenario: entry.predictedScenario || null,
      actual_outcome: entry.actualOutcome || null,
      was_on_time: entry.wasOnTime,
      accuracy_rating: entry.accuracyRating,
      date_logged: entry.dateLogged || new Date().toISOString(),
      user_notes: entry.userNotes || null
    };

    const { data, error } = await supabase.from('evidence_entries').insert(payload).select('id').single();
    if (error) {
      console.error('[databaseSyncService] Error inserting evidence entry:', error.message);
      return null;
    }
    return data?.id || validId;
  } catch (e) {
    console.error('[databaseSyncService] Evidence insert exception:', e);
    return null;
  }
}

/**
 * Debt & User Settings Operations
 */
export async function syncDebtUpsert(userId: string, debt: ProcrastinationDebt): Promise<void> {
  if (!isValidUUID(userId)) return;

  try {
    const payload = {
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
    console.warn('[databaseSyncService] Debt upsert notice:', e);
  }
}

export async function syncUserSettings(userId: string, settings: UserSettings): Promise<void> {
  if (!isValidUUID(userId)) return;

  try {
    const payload = {
      user_id: userId,
      intensity_mode: settings.intensityMode,
      is_minor_profile: settings.isMinorProfile,
      weekly_digest_only: settings.weeklyDigestOnly,
      personal_velocity_multiplier: settings.personalVelocityMultiplier
    };

    await supabase.from('user_settings').upsert(payload);
  } catch (e) {
    console.warn('[databaseSyncService] User settings upsert notice:', e);
  }
}

export async function syncNotificationSettings(userId: string, settings: NotificationSettings): Promise<void> {
  if (!isValidUUID(userId)) return;

  try {
    const payload = {
      user_id: userId,
      task_reminders_enabled: settings.taskRemindersEnabled,
      class_reminders_enabled: settings.classRemindersEnabled,
      default_task_reminders: settings.defaultTaskReminders,
      default_class_reminders: settings.defaultClassReminders
    };

    await supabase.from('notification_settings').upsert(payload);
  } catch (e) {
    console.warn('[databaseSyncService] Notification settings notice:', e);
  }
}