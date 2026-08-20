import { supabase } from '@/integrations/supabase/client';
import { UserSettings, NotificationSettings, ProcrastinationDebt } from '@/types/ripple';
import { isValidUUID } from '@/utils/uuidUtils';
import { defaultSettings, defaultNotifSettings } from './syncTypes';

export async function fetchUserSettings(userId: string): Promise<UserSettings> {
  if (!isValidUUID(userId)) return defaultSettings;

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return defaultSettings;
    }

    return {
      intensityMode: (data.intensity_mode as any) || 'standard',
      isMinorProfile: Boolean(data.is_minor_profile),
      weeklyDigestOnly: Boolean(data.weekly_digest_only),
      personalVelocityMultiplier: Number(data.personal_velocity_multiplier) || 1.0,
      dailyStudyTargetHours: 3.0
    };
  } catch (e) {
    console.error('[syncSettings] Exception fetching user settings:', e);
    return defaultSettings;
  }
}

export async function fetchNotificationSettings(userId: string): Promise<NotificationSettings> {
  if (!isValidUUID(userId)) return defaultNotifSettings;

  try {
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return defaultNotifSettings;
    }

    return {
      taskRemindersEnabled: data.task_reminders_enabled ?? true,
      classRemindersEnabled: data.class_reminders_enabled ?? true,
      defaultTaskReminders: (data.default_task_reminders as any) || ['15m', 'exact'],
      defaultClassReminders: (data.default_class_reminders as any) || ['15m']
    };
  } catch (e) {
    console.error('[syncSettings] Exception fetching notification settings:', e);
    return defaultNotifSettings;
  }
}

export async function syncUserSettings(userId: string, settings: UserSettings): Promise<boolean> {
  if (!isValidUUID(userId)) return false;

  try {
    const payload = {
      user_id: userId,
      intensity_mode: settings.intensityMode || 'standard',
      is_minor_profile: Boolean(settings.isMinorProfile),
      weekly_digest_only: Boolean(settings.weeklyDigestOnly),
      personal_velocity_multiplier: settings.personalVelocityMultiplier || 1.0,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' });
    if (error) {
      console.error('[syncSettings] Error upserting user settings:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[syncSettings] User settings upsert exception:', e);
    return false;
  }
}

export async function syncNotificationSettings(userId: string, settings: NotificationSettings): Promise<boolean> {
  if (!isValidUUID(userId)) return false;

  try {
    const payload = {
      user_id: userId,
      task_reminders_enabled: settings.taskRemindersEnabled ?? true,
      class_reminders_enabled: settings.classRemindersEnabled ?? true,
      default_task_reminders: settings.defaultTaskReminders || ['15m', 'exact'],
      default_class_reminders: settings.defaultClassReminders || ['15m'],
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('notification_settings').upsert(payload, { onConflict: 'user_id' });
    if (error) {
      console.error('[syncSettings] Error upserting notification settings:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[syncSettings] Notification settings upsert exception:', e);
    return false;
  }
}

export async function syncDebtUpsert(userId: string, debt: ProcrastinationDebt): Promise<boolean> {
  if (!isValidUUID(userId)) return false;

  try {
    const payload = {
      user_id: userId,
      total_hours_behind: debt.totalHoursBehind || 0,
      missed_deadlines_count: debt.missedDeadlinesCount || 0,
      streak_days: debt.streakDays || 0,
      compounding_score: debt.compoundingScore || 0,
      weekly_debt_trend: debt.weeklyDebtTrend || [],
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('procrastination_debt')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      console.error('[syncSettings] Error syncing debt to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[syncSettings] Debt upsert exception:', e);
    return false;
  }
}