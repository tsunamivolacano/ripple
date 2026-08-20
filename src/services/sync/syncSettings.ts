import { supabase } from '@/integrations/supabase/client';
import { UserSettings, NotificationSettings, ProcrastinationDebt } from '@/types/ripple';
import { isValidUUID } from '@/utils/uuidUtils';
import { defaultSettings, defaultNotifSettings } from './syncTypes';

export async function fetchUserSettings(userId: string): Promise<UserSettings> {
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
}

export async function fetchNotificationSettings(userId: string): Promise<NotificationSettings> {
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
    console.warn('[syncSettings] User settings upsert notice:', e);
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
    console.warn('[syncSettings] Notification settings notice:', e);
  }
}

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
    console.warn('[syncSettings] Debt upsert notice:', e);
  }
}