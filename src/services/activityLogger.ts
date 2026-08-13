import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export type ActivityActionType = 
  | 'TASK_CREATE'
  | 'TASK_UPDATE'
  | 'TASK_DELETE'
  | 'TASK_COMPLETE'
  | 'TASK_RENEGOTIATE'
  | 'STUDY_LOG_ADD'
  | 'STUDY_LOG_DELETE'
  | 'SLOT_ADD'
  | 'SLOT_UPDATE'
  | 'SLOT_DELETE'
  | 'EVIDENCE_LOG'
  | 'USER_LOGIN'
  | 'USER_SIGNUP'
  | 'USER_LOGOUT'
  | 'SETTINGS_UPDATE';

export interface ActivityLogEntry {
  userId: string;
  actionType: ActivityActionType;
  itemType?: string;
  itemId?: string;
  itemTitle?: string;
  details?: Record<string, any>;
}

// Local storage key for offline logging
const LOCAL_LOG_QUEUE_KEY = 'ripple_activity_log_queue';

/**
 * Logs a user activity to Supabase with localStorage fallback
 */
export async function logUserActivity(entry: ActivityLogEntry): Promise<void> {
  const { userId, actionType, itemType, itemId, itemTitle, details } = entry;
  
  // Create the log entry object
  const logEntry = {
    user_id: userId,
    action_type: actionType,
    item_type: itemType || null,
    item_id: itemId || null,
    item_title: itemTitle || null,
    details: details || null,
    created_at: new Date().toISOString()
  };

  try {
    // Try to log to Supabase
    const { error } = await supabase
      .from('user_activity_logs')
      .insert(logEntry);

    if (error) {
      throw error;
    }
    
    // If there are queued local logs, try to sync them
    syncLocalLogQueue();
  } catch (error) {
    console.warn('[activityLogger] Failed to log to Supabase, queuing locally:', error);
    // Queue locally for later sync
    queueLocalLog(logEntry);
  }
}

/**
 * Queues a log entry in localStorage for later sync
 */
function queueLocalLog(logEntry: any): void {
  try {
    const existingQueue = JSON.parse(localStorage.getItem(LOCAL_LOG_QUEUE_KEY) || '[]');
    existingQueue.push(logEntry);
    localStorage.setItem(LOCAL_LOG_QUEUE_KEY, JSON.stringify(existingQueue));
  } catch (e) {
    console.error('[activityLogger] Failed to queue log locally:', e);
  }
}

/**
 * Syncs queued local logs to Supabase
 */
async function syncLocalLogQueue(): Promise<void> {
  try {
    const queue = JSON.parse(localStorage.getItem(LOCAL_LOG_QUEUE_KEY) || '[]');
    if (queue.length === 0) return;

    const { error } = await supabase
      .from('user_activity_logs')
      .insert(queue);

    if (!error) {
      // Clear the queue on successful sync
      localStorage.removeItem(LOCAL_LOG_QUEUE_KEY);
    }
  } catch (e) {
    console.warn('[activityLogger] Failed to sync local log queue:', e);
  }
}

/**
 * Helper functions for common activity types
 */
export const ActivityLogger = {
  taskCreated: (userId: string, taskId: string, title: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      actionType: 'TASK_CREATE',
      itemType: 'task',
      itemId: taskId,
      itemTitle: title,
      details
    }),

  taskUpdated: (userId: string, taskId: string, title: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      actionType: 'TASK_UPDATE',
      itemType: 'task',
      itemId: taskId,
      itemTitle: title,
      details
    }),

  taskDeleted: (userId: string, taskId: string, title: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      actionType: 'TASK_DELETE',
      itemType: 'task',
      itemId: taskId,
      itemTitle: title,
      details
    }),

  taskCompleted: (userId: string, taskId: string, title: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      actionType: 'TASK_COMPLETE',
      itemType: 'task',
      itemId: taskId,
      itemTitle: title,
      details
    }),

  taskRenegotiated: (userId: string, taskId: string, title: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      actionType: 'TASK_RENEGOTIATE',
      itemType: 'task',
      itemId: taskId,
      itemTitle: title,
      details
    }),

  studyLogAdded: (userId: string, logId: string, subject: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      actionType: 'STUDY_LOG_ADD',
      itemType: 'study_log',
      itemId: logId,
      itemTitle: subject,
      details
    }),

  studyLogDeleted: (userId: string, logId: string, subject: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      actionType: 'STUDY_LOG_DELETE',
      itemType: 'study_log',
      itemId: logId,
      itemTitle: subject,
      details
    }),

  slotAdded: (userId: string, slotId: string, subject: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      actionType: 'SLOT_ADD',
      itemType: 'timetable_slot',
      itemId: slotId,
      itemTitle: subject,
      details
    }),

  slotUpdated: (userId: string, slotId: string, subject: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      actionType: 'SLOT_UPDATE',
      itemType: 'timetable_slot',
      itemId: slotId,
      itemTitle: subject,
      details
    }),

  slotDeleted: (userId: string, slotId: string, subject: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      actionType: 'SLOT_DELETE',
      itemType: 'timetable_slot',
      itemId: slotId,
      itemTitle: subject,
      details
    }),

  evidenceLogged: (userId: string, entryId: string, taskTitle: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      actionType: 'EVIDENCE_LOG',
      itemType: 'evidence_entry',
      itemId: entryId,
      itemTitle: taskTitle,
      details
    }),

  userLogin: (userId: string, email: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      actionType: 'USER_LOGIN',
      itemType: 'user',
      itemId: userId,
      itemTitle: email,
      details
    }),

  userSignup: (userId: string, email: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      actionType: 'USER_SIGNUP',
      itemType: 'user',
      itemId: userId,
      itemTitle: email,
      details
    }),

  userLogout: (userId: string, email: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      actionType: 'USER_LOGOUT',
      itemType: 'user',
      itemId: userId,
      itemTitle: email,
      details
    }),

  settingsUpdated: (userId: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      actionType: 'SETTINGS_UPDATE',
      itemType: 'settings',
      details
    })
};