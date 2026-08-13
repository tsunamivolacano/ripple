import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export type ActivityEventType = 
  | 'user_registered'
  | 'user_login'
  | 'user_logout'
  | 'password_reset_requested'
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_reopened'
  | 'task_deleted'
  | 'calendar_event_created'
  | 'calendar_event_updated'
  | 'calendar_event_deleted'
  | 'ai_prompt_submitted'
  | 'ai_response_received'
  | 'ai_request_failed'
  | 'page_opened'
  | 'important_setting_changed'
  | 'error'
  | 'warning';

export interface ActivityLogEntry {
  userId: string;
  eventType: ActivityEventType;
  eventName: string;
  message?: string;
  source?: string;
  route?: string;
  requestId?: string;
  sessionId?: string;
  taskId?: string;
  metadata?: Record<string, any>;
  prompt?: string;
  response?: string;
  model?: string;
  provider?: string;
  statusCode?: number;
  durationMs?: number;
  errorMessage?: string;
}

// Local storage key for offline logging
const LOCAL_LOG_QUEUE_KEY = 'ripple_activity_log_queue';

/**
 * Logs a user activity to Supabase with localStorage fallback
 */
export async function logUserActivity(entry: ActivityLogEntry): Promise<void> {
  const { 
    userId, 
    eventType, 
    eventName, 
    message, 
    source, 
    route, 
    requestId, 
    sessionId, 
    taskId, 
    metadata, 
    prompt, 
    response, 
    model, 
    provider, 
    statusCode, 
    durationMs, 
    errorMessage 
  } = entry;
  
  // Create the log entry object
  const logEntry = {
    user_id: userId,
    timestamp: new Date().toISOString(),
    event_type: eventType,
    event_name: eventName,
    message: message || null,
    source: source || 'ripple_app',
    route: route || null,
    request_id: requestId || null,
    session_id: sessionId || null,
    task_id: taskId || null,
    metadata: metadata || null,
    prompt: prompt || null,
    response: response || null,
    model: model || null,
    provider: provider || null,
    status_code: statusCode || null,
    duration_ms: durationMs || null,
    error_message: errorMessage || null,
    created_at: new Date().toISOString()
  };

  try {
    // Try to log to Supabase
    const { error } = await supabase
      .from('user_logs')
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
      .from('user_logs')
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
  userRegistered: (userId: string, email: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      eventType: 'user_registered',
      eventName: 'User Registered',
      message: `New user registered: ${email}`,
      metadata: details
    }),

  userLogin: (userId: string, email: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      eventType: 'user_login',
      eventName: 'User Login',
      message: `User logged in: ${email}`,
      metadata: details
    }),

  userLogout: (userId: string, email: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      eventType: 'user_logout',
      eventName: 'User Logout',
      message: `User logged out: ${email}`,
      metadata: details
    }),

  passwordResetRequested: (userId: string, email: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      eventType: 'password_reset_requested',
      eventName: 'Password Reset Requested',
      message: `Password reset requested for: ${email}`,
      metadata: details
    }),

  taskCreated: (userId: string, taskId: string, title: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      eventType: 'task_created',
      eventName: 'Task Created',
      message: `Task created: "${title}"`,
      taskId,
      metadata: details
    }),

  taskUpdated: (userId: string, taskId: string, title: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      eventType: 'task_updated',
      eventName: 'Task Updated',
      message: `Task updated: "${title}"`,
      taskId,
      metadata: details
    }),

  taskCompleted: (userId: string, taskId: string, title: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      eventType: 'task_completed',
      eventName: 'Task Completed',
      message: `Task completed: "${title}"`,
      taskId,
      metadata: details
    }),

  taskReopened: (userId: string, taskId: string, title: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      eventType: 'task_reopened',
      eventName: 'Task Reopened',
      message: `Task reopened: "${title}"`,
      taskId,
      metadata: details
    }),

  taskDeleted: (userId: string, taskId: string, title: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      eventType: 'task_deleted',
      eventName: 'Task Deleted',
      message: `Task deleted: "${title}"`,
      taskId,
      metadata: details
    }),

  calendarEventCreated: (userId: string, eventId: string, title: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      eventType: 'calendar_event_created',
      eventName: 'Calendar Event Created',
      message: `Calendar event created: "${title}"`,
      metadata: { eventId, ...details }
    }),

  calendarEventUpdated: (userId: string, eventId: string, title: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      eventType: 'calendar_event_updated',
      eventName: 'Calendar Event Updated',
      message: `Calendar event updated: "${title}"`,
      metadata: { eventId, ...details }
    }),

  calendarEventDeleted: (userId: string, eventId: string, title: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      eventType: 'calendar_event_deleted',
      eventName: 'Calendar Event Deleted',
      message: `Calendar event deleted: "${title}"`,
      metadata: { eventId, ...details }
    }),

  aiPromptSubmitted: (userId: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      eventType: 'ai_prompt_submitted',
      eventName: 'AI Prompt Submitted',
      message: 'AI prompt submitted',
      metadata: details
    }),

  aiResponseReceived: (userId: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      eventType: 'ai_response_received',
      eventName: 'AI Response Received',
      message: 'AI response received',
      metadata: details
    }),

  aiRequestFailed: (userId: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      eventType: 'ai_request_failed',
      eventName: 'AI Request Failed',
      message: 'AI request failed',
      metadata: details
    }),

  pageOpened: (userId: string, route: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      eventType: 'page_opened',
      eventName: 'Page Opened',
      message: `Opened page: ${route}`,
      route,
      metadata: details
    }),

  settingChanged: (userId: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      eventType: 'important_setting_changed',
      eventName: 'Setting Changed',
      message: 'User settings updated',
      metadata: details
    }),

  error: (userId: string, message: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      eventType: 'error',
      eventName: 'Error',
      message,
      metadata: details
    }),

  warning: (userId: string, message: string, details?: Record<string, any>) =>
    logUserActivity({
      userId,
      eventType: 'warning',
      eventName: 'Warning',
      message,
      metadata: details
    })
};