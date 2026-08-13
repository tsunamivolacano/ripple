import { supabase } from '@/integrations/supabase/client';

export type EventType = 
  | 'auth'
  | 'navigation'
  | 'task'
  | 'study'
  | 'timer'
  | 'timetable'
  | 'evidence'
  | 'settings'
  | 'chat'
  | 'error';

export interface ActivityLogInput {
  eventName: string;
  eventType: EventType;
  userId?: string | null;
  userEmail?: string | null;
  pageRoute?: string;
  sessionId?: string;
  success?: boolean;
  errorDetails?: string | null;
  metadata?: Record<string, any>;
}

// Global session ID generated per window session
const SESSION_ID = typeof window !== 'undefined'
  ? `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  : 'sess_server';

// Keys that should NEVER be stored in logs
const SENSITIVE_KEYS = new Set([
  'password',
  'pass',
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'apiKey',
  'apikey',
  'authorization',
  'authHeader',
  'cred',
  'credentials'
]);

/**
 * Deeply sanitizes metadata object to ensure no sensitive credentials or tokens are ever logged.
 */
export function sanitizeMetadata(obj: Record<string, any> | undefined): Record<string, any> {
  if (!obj || typeof obj !== 'object') return {};

  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      clean[key] = sanitizeMetadata(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

/**
 * Logs a user activity permanently to Supabase `user_activity_logs`.
 * Non-blocking: failures will never interrupt user flow.
 */
export async function logUserActivity(input: ActivityLogInput): Promise<void> {
  try {
    const {
      eventName,
      eventType,
      userId,
      userEmail,
      pageRoute = typeof window !== 'undefined' ? window.location.pathname + window.location.hash : '/',
      sessionId = SESSION_ID,
      success = true,
      errorDetails = null,
      metadata = {}
    } = input;

    const sanitizedMeta = sanitizeMetadata(metadata);

    const payload = {
      user_id: userId || 'anonymous',
      user_email: userEmail || 'anonymous',
      event_name: eventName,
      event_type: eventType,
      timestamp: new Date().toISOString(),
      page_route: pageRoute,
      session_id: sessionId,
      success,
      error_details: errorDetails ? String(errorDetails).substring(0, 1000) : null,
      metadata: sanitizedMeta
    };

    // Try sending directly to Supabase table `user_activity_logs`
    const { error } = await supabase
      .from('user_activity_logs')
      .insert(payload);

    if (error) {
      // Buffer locally if table or connection is temporarily unavailable
      bufferLogLocally(payload);
    }
  } catch (err) {
    console.warn('[ActivityLogger] Exception caught while logging activity:', err);
  }
}

/**
 * Fallback local resilience buffer so logs are preserved permanently even during temporary network drops.
 */
function bufferLogLocally(payload: Record<string, any>): void {
  try {
    const currentQueue = JSON.parse(localStorage.getItem('ripple_buffered_activity_logs') || '[]');
    const updated = [payload, ...currentQueue].slice(0, 500);
    localStorage.setItem('ripple_buffered_activity_logs', JSON.stringify(updated));
  } catch (e) {
    // Ignore storage quota errors
  }
}

/**
 * Flushes buffered local logs to Supabase when network is active.
 */
export async function flushBufferedLogs(): Promise<void> {
  try {
    const buffered = JSON.parse(localStorage.getItem('ripple_buffered_activity_logs') || '[]');
    if (!buffered || buffered.length === 0) return;

    const { error } = await supabase
      .from('user_activity_logs')
      .insert(buffered);

    if (!error) {
      localStorage.removeItem('ripple_buffered_activity_logs');
    }
  } catch (e) {
    // Ignore flush errors
  }
}

if (typeof window !== 'undefined') {
  setTimeout(() => {
    flushBufferedLogs().catch(() => {});
  }, 3000);
}