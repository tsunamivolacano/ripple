import { Task, TimetableSlot, ReminderTiming, ScheduledNotification, NotificationSettings } from '@/types/ripple';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const REMINDER_OFFSET_MS: Record<ReminderTiming, number> = {
  exact: 0,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  overdue: -15 * 60 * 1000 // 15 mins after deadline if overdue
};

export const REMINDER_LABEL_MAP: Record<ReminderTiming, string> = {
  exact: 'At exact deadline / start time',
  '5m': '5 minutes before',
  '15m': '15 minutes before',
  '30m': '30 minutes before',
  '1h': '1 hour before',
  '1d': '1 day before',
  overdue: '15 mins after deadline (Overdue Alert)'
};

let swRegistration: ServiceWorkerRegistration | null = null;

// Register Service Worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported in this browser.');
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    console.log('[RIPPLE SW] Service Worker registered successfully:', reg.scope);
    return reg;
  } catch (err) {
    console.error('[RIPPLE SW] Service Worker registration failed:', err);
    return null;
  }
}

// Check Notification Permission status
export function getNotificationPermissionState(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

// Request Notification Permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    showError('Notifications are not supported by this browser.');
    return false;
  }

  try {
    if (Notification.permission === 'granted') {
      return true;
    }

    const res = await Notification.requestPermission();
    if (res === 'granted') {
      showSuccess('Notifications enabled! You will receive background reminders.');
      await registerServiceWorker();
      return true;
    } else {
      showError('Notification permission was denied. Please allow notifications in browser site settings.');
      return false;
    }
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return false;
  }
}

// Calculate ISO trigger time in UTC based on local target time and offset
export function calculateTriggerTime(eventTimeISO: string, offsetKey: ReminderTiming): string {
  const eventTime = new Date(eventTimeISO).getTime();
  const offsetMs = REMINDER_OFFSET_MS[offsetKey] || 0;
  const triggerMs = eventTime - offsetMs;
  return new Date(triggerMs).toISOString();
}

// Format local human-readable time string from ISO
export function formatLocalTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

// Schedule Task Reminders
export async function scheduleTaskNotifications(
  userId: string,
  task: Task,
  settings: NotificationSettings
): Promise<void> {
  if (!settings.taskRemindersEnabled || !task.dueDate) return;

  const reminders = task.reminders && task.reminders.length > 0
    ? task.reminders
    : settings.defaultTaskReminders;

  // First cancel any existing pending notifications for this task
  await cancelItemNotifications(userId, task.id);

  const nowMs = Date.now();

  for (const reminderOpt of reminders) {
    const triggerISO = calculateTriggerTime(task.dueDate, reminderOpt);
    const triggerMs = new Date(triggerISO).getTime();

    // Only schedule future notifications
    if (triggerMs > nowMs) {
      const labelText = reminderOpt === 'exact'
        ? 'DEADLINE NOW'
        : reminderOpt === 'overdue'
        ? 'TASK OVERDUE'
        : `${reminderOpt} REMINDER`;

      const bodyText = `Task "${task.title}" is due at ${formatLocalTime(task.dueDate)}. Don't let the Doomsday Dial tick out!`;

      // Save to Supabase queue
      await supabase.from('scheduled_notifications').insert({
        user_id: userId,
        item_id: task.id,
        item_type: 'task',
        title: `⏰ RIPPLE Alert [${labelText}]`,
        body: bodyText,
        trigger_time: triggerISO,
        reminder_offset: reminderOpt,
        status: 'pending'
      });
    }
  }

  // Also schedule an overdue alert if task is still pending past deadline
  const overdueISO = calculateTriggerTime(task.dueDate, 'overdue');
  if (new Date(overdueISO).getTime() > nowMs) {
    await supabase.from('scheduled_notifications').insert({
      user_id: userId,
      item_id: task.id,
      item_type: 'overdue',
      title: `🔥 RIPPLE OVERDUE WARNING`,
      body: `Task "${task.title}" has passed its deadline! Inspect consequences in your War Room.`,
      trigger_time: overdueISO,
      reminder_offset: 'overdue',
      status: 'pending'
    });
  }
}

// Schedule Class Session Reminders
export async function scheduleClassNotifications(
  userId: string,
  slot: TimetableSlot,
  nextClassISO: string,
  settings: NotificationSettings
): Promise<void> {
  if (!settings.classRemindersEnabled) return;

  const reminders = slot.reminders && slot.reminders.length > 0
    ? slot.reminders
    : settings.defaultClassReminders;

  await cancelItemNotifications(userId, slot.id);

  const nowMs = Date.now();

  for (const reminderOpt of reminders) {
    const triggerISO = calculateTriggerTime(nextClassISO, reminderOpt);
    const triggerMs = new Date(triggerISO).getTime();

    if (triggerMs > nowMs) {
      const bodyText = `${slot.subject} with ${slot.teacherName} starts at ${slot.startTime} (${slot.room}). Teacher tag: ${slot.strictnessTag.replace('_', ' ')}.`;

      await supabase.from('scheduled_notifications').insert({
        user_id: userId,
        item_id: slot.id,
        item_type: 'class',
        title: `🎓 RIPPLE Class Alert: ${slot.subject}`,
        body: bodyText,
        trigger_time: triggerISO,
        reminder_offset: reminderOpt,
        status: 'pending'
      });
    }
  }
}

// Cancel Pending Notifications for an item (e.g. on task complete, renegotiate, or delete)
export async function cancelItemNotifications(userId: string, itemId: string): Promise<void> {
  try {
    await supabase
      .from('scheduled_notifications')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .eq('status', 'pending');
  } catch (err) {
    console.warn('Error cancelling notifications:', err);
  }
}

// Test Notification Trigger - Works every time it is clicked with unique identifiers and renotify enabled
export async function sendTestNotification(): Promise<boolean> {
  let isPermitted = Notification.permission === 'granted';

  if (!isPermitted) {
    isPermitted = await requestNotificationPermission();
    if (!isPermitted) {
      showError('Please enable notification permission to send alerts.');
      return false;
    }
  }

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const uniqueTag = `ripple-test-${Date.now()}`;
  const notificationTitle = '🚀 RIPPLE Background Notification Test';
  const notificationBody = `[${timestamp}] Test notification fired successfully! Background alerts are active and running in sync with your timezone.`;

  try {
    // If Service Worker is ready, use it for rich push capability
    let sw = swRegistration;
    if (!sw && 'serviceWorker' in navigator) {
      try {
        sw = await navigator.serviceWorker.getRegistration();
      } catch {}
    }

    if (sw && typeof sw.showNotification === 'function') {
      const extendedOptions: NotificationOptions & { renotify?: boolean; requireInteraction?: boolean } = {
        body: notificationBody,
        icon: '/placeholder.svg',
        badge: '/placeholder.svg',
        tag: uniqueTag,
        renotify: true,
        requireInteraction: false,
        data: { url: window.location.origin }
      };
      await sw.showNotification(notificationTitle, extendedOptions);
    } else {
      new Notification(notificationTitle, {
        body: notificationBody,
        icon: '/placeholder.svg',
        tag: uniqueTag
      });
    }

    showSuccess(`Notification dispatched at ${timestamp}!`);
    return true;
  } catch (err) {
    console.warn('Direct notification failed, fallbacking to standard notification:', err);
    try {
      new Notification(notificationTitle, {
        body: notificationBody,
        icon: '/placeholder.svg',
        tag: uniqueTag
      });
      showSuccess(`Notification dispatched at ${timestamp}!`);
      return true;
    } catch (fallbackErr) {
      showError('Failed to display system notification. Ensure notifications are not blocked in your OS.');
      return false;
    }
  }
}

// Helper to calculate the next calendar occurrence ISO date for a weekly slot
export function getNextSlotDateISO(dayOfWeekStr: string, timeStr: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDayIndex = days.indexOf(dayOfWeekStr);
  if (targetDayIndex === -1) return new Date().toISOString();

  const now = new Date();
  const currentDayIndex = now.getDay();
  
  let daysUntil = targetDayIndex - currentDayIndex;
  if (daysUntil < 0) {
    daysUntil += 7;
  }

  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysUntil);

  const [hours, minutes] = timeStr.split(':').map(Number);
  targetDate.setHours(hours || 9, minutes || 0, 0, 0);

  // If time has already passed today, push to next week
  if (targetDate.getTime() <= now.getTime()) {
    targetDate.setDate(targetDate.getDate() + 7);
  }

  return targetDate.toISOString();
}