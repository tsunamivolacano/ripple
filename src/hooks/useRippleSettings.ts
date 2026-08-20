import { useState, useCallback } from 'react';
import { UserSettings, NotificationSettings } from '@/types/ripple';
import { syncUserSettings, syncNotificationSettings } from '@/services/databaseSyncService';
import { showSuccess } from '@/utils/toast';
import { UserAccount } from './useRippleAuth';

const emptySettings: UserSettings = {
  intensityMode: 'standard',
  isMinorProfile: false,
  weeklyDigestOnly: false,
  personalVelocityMultiplier: 1.0,
  dailyStudyTargetHours: 3.0
};

const defaultNotificationSettings: NotificationSettings = {
  taskRemindersEnabled: true,
  classRemindersEnabled: true,
  defaultTaskReminders: ['15m', 'exact'],
  defaultClassReminders: ['15m']
};

export function useRippleSettings(currentUser: UserAccount | null) {
  const [settings, setSettings] = useState<UserSettings>(emptySettings);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [isNotificationModalOpen, setNotificationModalOpen] = useState<boolean>(false);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!currentUser) return;
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (!currentUser.isDemo) {
      await syncUserSettings(currentUser.id, updated);
    }
    showSuccess('Settings updated and synced.');
  }, [currentUser, settings]);

  const updateNotificationSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    if (!currentUser) return;
    const updated = { ...notificationSettings, ...newSettings };
    setNotificationSettings(updated);
    if (!currentUser.isDemo) {
      await syncNotificationSettings(currentUser.id, updated);
    }
    showSuccess('Notification preferences saved.');
  }, [currentUser, notificationSettings]);

  return {
    settings,
    setSettings,
    notificationSettings,
    setNotificationSettings,
    isNotificationModalOpen,
    setNotificationModalOpen,
    updateSettings,
    updateNotificationSettings
  };
}