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
 * Load all user records from Supabase directly as the primary single source of truth.
 * Automatically synchronizes any offline/local-pending data up to Supabase to prevent data loss.
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
    const [dbStudy, dbTasks, dbSlots, dbEvidence, dbSettings, dbNotif] = await Promise.all([
      fetchUserStudyLogs(userId),
      fetchUserTasks(userId),
      fetchUserSlots(userId),
      fetchUserEvidence(userId),
      fetchUserSettings(userId),
      fetchNotificationSettings(userId)
    ]);

    // Check if there are local tasks that never synced to DB (e.g. created during network glitch)
    const existingDbTaskIds = new Set(dbTasks.map((t) => t.id));
    const unsyncedLocalTasks = localTasks.filter((t) => t.id && !existingDbTaskIds.has(t.id));

    if (unsyncedLocalTasks.length > 0) {
      for (const unTask of unsyncedLocalTasks) {
        await syncTaskInsert(userId, unTask);
        dbTasks.push(unTask);
      }
    }

    // Check if there are local study logs that never synced
    const existingDbStudyIds = new Set(dbStudy.map((l) => l.id));
    const unsyncedStudy = localStudy.filter((l) => l.id && !existingDbStudyIds.has(l.id));
    if (unsyncedStudy.length > 0) {
      for (const unLog of unsyncedStudy) {
        await syncStudyLogInsert(userId, unLog);
        dbStudy.push(unLog);
      }
    }

    // Check if there are local timetable slots that never synced
    const existingDbSlotIds = new Set(dbSlots.map((s) => s.id));
    const unsyncedSlots = localSlots.filter((s) => s.id && !existingDbSlotIds.has(s.id));
    if (unsyncedSlots.length > 0) {
      for (const unSlot of unsyncedSlots) {
        await syncSlotInsert(userId, unSlot);
        dbSlots.push(unSlot);
      }
    }

    // Check if there are local evidence entries that never synced
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

    // Cache latest authoritative copies
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