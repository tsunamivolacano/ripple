import { 
  TimetableSlot, 
  Task, 
  EvidenceEntry, 
  StudyLog, 
  UserSettings, 
  NotificationSettings 
} from '@/types/ripple';
import { safeGetStorage, safeSetStorage } from '@/utils/storageUtils';
import { isValidUUID } from '@/utils/uuidUtils';
import { calculateUnifiedDebt } from '@/utils/studyDebtUtils';

import { UserFullData, defaultSettings, defaultNotifSettings } from './sync/syncTypes';
import { fetchUserStudyLogs, syncStudyLogInsert, syncStudyLogDelete } from './sync/syncStudyLogs';
import { fetchUserTasks, syncTaskInsert, syncTaskUpdate, syncTaskDelete } from './sync/syncTasks';
import { fetchUserSlots, syncSlotInsert, syncSlotUpdate, syncSlotDelete } from './sync/syncSlots';
import { fetchUserEvidence, syncEvidenceInsert } from './sync/syncEvidence';
import { 
  fetchUserSettings, 
  fetchNotificationSettings, 
  syncUserSettings, 
  syncNotificationSettings, 
  syncDebtUpsert 
} from './sync/syncSettings';

export type { UserFullData };
export {
  syncStudyLogInsert,
  syncStudyLogDelete,
  syncTaskInsert,
  syncTaskUpdate,
  syncTaskDelete,
  syncSlotInsert,
  syncSlotUpdate,
  syncSlotDelete,
  syncEvidenceInsert,
  syncUserSettings,
  syncNotificationSettings,
  syncDebtUpsert
};

/**
 * Gather any local data stored under current user ID or legacy local storage keys
 * to guarantee that previously created data is never lost.
 */
function gatherLocalUserData(userId: string) {
  const possibleKeys = [
    userId,
    `usr_${userId}`,
    userId.replace(/[^a-zA-Z0-9]/g, '_'),
    'default'
  ];

  let localSlots: TimetableSlot[] = [];
  let localTasks: Task[] = [];
  let localEvidence: EvidenceEntry[] = [];
  let localStudy: StudyLog[] = [];
  let localSettings: UserSettings = defaultSettings;
  let localNotifSettings: NotificationSettings = defaultNotifSettings;

  for (const k of possibleKeys) {
    const s = safeGetStorage<TimetableSlot[]>(`ripple_slots_${k}`, []);
    if (s.length > 0 && localSlots.length === 0) localSlots = s;

    const t = safeGetStorage<Task[]>(`ripple_tasks_${k}`, []);
    if (t.length > 0 && localTasks.length === 0) localTasks = t;

    const e = safeGetStorage<EvidenceEntry[]>(`ripple_evidence_${k}`, []);
    if (e.length > 0 && localEvidence.length === 0) localEvidence = e;

    const st = safeGetStorage<StudyLog[]>(`ripple_study_${k}`, []);
    if (st.length > 0 && localStudy.length === 0) localStudy = st;

    const set = safeGetStorage<UserSettings | null>(`ripple_settings_${k}`, null);
    if (set && localSettings === defaultSettings) localSettings = set;

    const n = safeGetStorage<NotificationSettings | null>(`ripple_notif_settings_${k}`, null);
    if (n && localNotifSettings === defaultNotifSettings) localNotifSettings = n;
  }

  return {
    localSlots,
    localTasks,
    localEvidence,
    localStudy,
    localSettings,
    localNotifSettings
  };
}

/**
 * Load all user records from Supabase directly as the primary single source of truth.
 * Automatically synchronizes any offline/local-pending data up to Supabase to prevent data loss.
 */
export async function loadUserCloudData(userId: string): Promise<UserFullData> {
  const {
    localSlots,
    localTasks,
    localEvidence,
    localStudy,
    localSettings,
    localNotifSettings
  } = gatherLocalUserData(userId);

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
    const [dbStudy, dbTasks, dbSlots, dbEvidence, dbSettings, dbNotif] = await Promise.all([
      fetchUserStudyLogs(userId),
      fetchUserTasks(userId),
      fetchUserSlots(userId),
      fetchUserEvidence(userId),
      fetchUserSettings(userId),
      fetchNotificationSettings(userId)
    ]);

    // 1. Merge and sync unsynced local tasks to Supabase
    const existingDbTaskIds = new Set(dbTasks.map((t) => t.id));
    const unsyncedLocalTasks = localTasks.filter((t) => t.id && !existingDbTaskIds.has(t.id));

    if (unsyncedLocalTasks.length > 0) {
      for (const unTask of unsyncedLocalTasks) {
        await syncTaskInsert(userId, unTask);
        dbTasks.push(unTask);
      }
    }

    // 2. Merge and sync unsynced study logs to Supabase
    const existingDbStudyIds = new Set(dbStudy.map((l) => l.id));
    const unsyncedStudy = localStudy.filter((l) => l.id && !existingDbStudyIds.has(l.id));
    if (unsyncedStudy.length > 0) {
      for (const unLog of unsyncedStudy) {
        await syncStudyLogInsert(userId, unLog);
        dbStudy.push(unLog);
      }
    }

    // 3. Merge and sync unsynced timetable slots to Supabase
    const existingDbSlotIds = new Set(dbSlots.map((s) => s.id));
    const unsyncedSlots = localSlots.filter((s) => s.id && !existingDbSlotIds.has(s.id));
    if (unsyncedSlots.length > 0) {
      for (const unSlot of unsyncedSlots) {
        await syncSlotInsert(userId, unSlot);
        dbSlots.push(unSlot);
      }
    }

    // 4. Merge and sync unsynced evidence entries to Supabase
    const existingDbEvIds = new Set(dbEvidence.map((e) => e.id));
    const unsyncedEv = localEvidence.filter((e) => e.id && !existingDbEvIds.has(e.id));
    if (unsyncedEv.length > 0) {
      for (const unEv of unsyncedEv) {
        await syncEvidenceInsert(userId, unEv);
        dbEvidence.push(unEv);
      }
    }

    const tasks = dbTasks;
    const studyLogs = dbStudy;
    const slots = dbSlots;
    const evidenceEntries = dbEvidence;
    const settings = dbSettings || localSettings;
    const notificationSettings = dbNotif || localNotifSettings;

    // Cache latest authoritative copies locally under canonical user ID
    safeSetStorage(`ripple_study_${userId}`, studyLogs);
    safeSetStorage(`ripple_tasks_${userId}`, tasks);
    safeSetStorage(`ripple_slots_${userId}`, slots);
    safeSetStorage(`ripple_evidence_${userId}`, evidenceEntries);
    safeSetStorage(`ripple_settings_${userId}`, settings);
    safeSetStorage(`ripple_notif_settings_${userId}`, notificationSettings);

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
    console.warn('[databaseSyncService] Fallback to local cache:', err);
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