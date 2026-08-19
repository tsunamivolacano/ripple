import React, { useState } from 'react';
import { RippleProvider, useRipple } from '@/context/RippleContext';
import { AuthPage } from '@/components/auth/AuthPage';
import { Navbar } from '@/components/header/Navbar';
import { WarRoom } from '@/components/doomsday/WarRoom';
import { StudyTrackerView } from '@/components/study/StudyTrackerView';
import { PredictionView } from '@/components/prediction/PredictionView';
import { FocusModeModal } from '@/components/prediction/FocusModeModal';
import { RenegotiateModal } from '@/components/prediction/RenegotiateModal';
import { PositiveRecapModal } from '@/components/positive/PositiveRecapModal';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { EvidenceLogView } from '@/components/evidence/EvidenceLogView';
import { DebtLedgerView } from '@/components/debt/DebtLedgerView';
import { CalendarView } from '@/components/calendar/CalendarView';
import { NewTaskModal } from '@/components/task/NewTaskModal';
import { NotificationSettingsModal } from '@/components/settings/NotificationSettingsModal';
import { TutorialOverlay } from '@/components/tutorial/TutorialOverlay';
import { RippleAssistantChatbot } from '@/components/chat/RippleAssistantChatbot';
import { FloatingTimerWidget } from '@/components/timer/FloatingTimerWidget';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Task } from '@/types/ripple';
import { Shield, Eye, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RippleAppContent: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    isAdminView,
    setAdminView,
    impersonatedUser,
    startImpersonatingUser,
    exitImpersonatedUser,
    activeTaskForPrediction,
    activeFocusTask,
    completedTaskForCelebration,
    isNotificationModalOpen,
    setNotificationModalOpen,
    setActiveTaskForPrediction,
    setActiveFocusTask,
    setCompletedTaskForCelebration,
    isLoadingData
  } = useRipple();

  const [activeTab, setActiveTab] = useState('warroom');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [renegotiateTask, setRenegotiateTask] = useState<Task | null>(null);

  if (!currentUser) {
    return <AuthPage />;
  }

  // Render Admin Dashboard if Admin View active
  if (isAdmin && isAdminView) {
    return (
      <AdminLayout
        onExitAdmin={() => setAdminView(false)}
        onImpersonateUser={(u) => startImpersonatingUser(u)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white relative">
      {/* Sticky Support Mode / Impersonation Banner */}
      {impersonatedUser && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border-b border-purple-500/50 px-4 py-2 text-white flex items-center justify-between text-xs sticky top-0 z-50 shadow-xl">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-bold text-amber-300">SUPPORT MODE (ADMIN VIEW):</span>
            <span className="text-slate-200">
              Inspecting application as <strong className="text-white font-mono">{impersonatedUser.name} ({impersonatedUser.email})</strong>
            </span>
          </div>

          <Button
            size="sm"
            onClick={exitImpersonatedUser}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-7 px-3 gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            Exit User View
          </Button>
        </div>
      )}

      {/* Top Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-28">
        {isLoadingData ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
            <p className="text-xs font-mono text-slate-400">
              Syncing user data from secure database...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'warroom' && (
              <WarRoom
                onOpenPrediction={(t) => setActiveTaskForPrediction(t)}
                onOpenFocus={(t) => setActiveFocusTask(t)}
                onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
              />
            )}

            {activeTab === 'study' && <StudyTrackerView />}

            {activeTab === 'calendar' && (
              <CalendarView
                onOpenPrediction={(t) => setActiveTaskForPrediction(t)}
                onOpenFocus={(t) => setActiveFocusTask(t)}
                onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
              />
            )}

            {activeTab === 'timetable' && <TimetableGrid />}

            {activeTab === 'evidence' && <EvidenceLogView />}

            {activeTab === 'debt' && <DebtLedgerView />}
          </>
        )}
      </main>

      {/* Floating Minimizable Background Timer Widget */}
      <FloatingTimerWidget />

      {/* Interactive AI Assistant Chatbot */}
      <RippleAssistantChatbot />

      {/* Single Detailed Step-by-Step Tutorial Overlay */}
      <TutorialOverlay onTabChange={(tab) => setActiveTab(tab)} />

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
      />

      {/* Modals & Overlays */}
      <PredictionView
        task={activeTaskForPrediction}
        onClose={() => setActiveTaskForPrediction(null)}
        onOpenFocus={(t) => setActiveFocusTask(t)}
        onOpenRenegotiate={(t) => setRenegotiateTask(t)}
      />

      <FocusModeModal
        task={activeFocusTask}
        onClose={() => setActiveFocusTask(null)}
      />

      <RenegotiateModal
        task={renegotiateTask}
        onClose={() => setRenegotiateTask(null)}
      />

      <PositiveRecapModal
        task={completedTaskForCelebration}
        onClose={() => setCompletedTaskForCelebration(null)}
      />

      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
      />
    </div>
  );
};

export default function Index() {
  return (
    <RippleProvider>
      <RippleAppContent />
    </RippleProvider>
  );
}
</dyad-file>

<dyad-write path="src/utils/notificationService.ts" description="Fix NotificationOptions renotify type error">
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
      const swOptions: any = {
        body: notificationBody,
        icon: '/placeholder.svg',
        badge: '/placeholder.svg',
        tag: uniqueTag,
        renotify: true,
        requireInteraction: false,
        data: { url: window.location.origin }
      };
      await sw.showNotification(notificationTitle, swOptions);
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
</dyad-file>

<dyad-chat-summary>Fix TypeScript compilation errors</dyad-chat-summary>

Fixed the non-existent icon import in `Index.tsx` and resolved the `NotificationOptions` type error in `notificationService.ts`.<dyad-write path="src/services/databaseSyncService.ts" description="Ensure clean exports and full sync service coverage">
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