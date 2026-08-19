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
    const [dbStudy, dbTasks, dbSlots, dbEvidence, dbSettings, dbNotif] = await Promise.all([
      fetchUserStudyLogs(userId),
      fetchUserTasks(userId),
      fetchUserSlots(userId),
      fetchUserEvidence(userId),
      fetchUserSettings(userId),
      fetchNotificationSettings(userId)
    ]);

    const studyLogs = dbStudy.length > 0 ? dbStudy : localStudy;
    const tasks = dbTasks.length > 0 ? dbTasks : localTasks;
    const slots = dbSlots.length > 0 ? dbSlots : localSlots;
    const evidenceEntries = dbEvidence.length > 0 ? dbEvidence : localEvidence;
    const settings = dbSettings || localSettings;
    const notificationSettings = dbNotif || localNotifSettings;

    // Cache latest fetched copies
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