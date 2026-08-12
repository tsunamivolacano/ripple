import React, { useState } from 'react';
import { useRipple } from '@/context/RippleContext';
import { ReminderTiming } from '@/types/ripple';
import { REMINDER_LABEL_MAP, requestNotificationPermission, sendTestNotification, getNotificationPermissionState } from '@/utils/notificationService';
import { Bell, ShieldCheck, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_REMINDER_OPTIONS: ReminderTiming[] = ['exact', '5m', '15m', '30m', '1h', '1d'];

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { notificationSettings, updateNotificationSettings } = useRipple();
  const [permissionState, setPermissionState] = useState<NotificationPermission>(getNotificationPermissionState());

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionState(getNotificationPermissionState());
  };

  const handleToggleTaskReminderOption = (option: ReminderTiming) => {
    const current = notificationSettings.defaultTaskReminders || ['15m', 'exact'];
    const updated = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];

    updateNotificationSettings({ defaultTaskReminders: updated });
  };

  const handleToggleClassReminderOption = (option: ReminderTiming) => {
    const current = notificationSettings.defaultClassReminders || ['15m'];
    const updated = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];

    updateNotificationSettings({ defaultClassReminders: updated });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-lg rounded-2xl p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-white">
                Background & Push Notification Settings
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Reminders arrive even when the website or app is completely closed.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 my-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Browser Notification Permission
            </span>

            {permissionState === 'granted' ? (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                Permission Granted
              </Badge>
            ) : permissionState === 'denied' ? (
              <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40">
                Permission Blocked
              </Badge>
            ) : (
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">
                Action Required
              </Badge>
            )}
          </div>

          {permissionState !== 'granted' ? (
            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-slate-400">
                Allow browser notifications so alerts arrive when the tab is closed.
              </p>
              <Button
                size="sm"
                onClick={handleRequestPermission}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-8 px-3"
              >
                Enable Notifications
              </Button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">
              Background Service Worker is active and synced with your local timezone offset ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
            </p>
          )}
        </div>

        <div className="space-y-4 my-2 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-200">Task & Activity Reminders</h4>
                <p className="text-[11px] text-slate-400">Send alerts before deadlines and if tasks remain incomplete.</p>
              </div>
              <Switch
                checked={notificationSettings.taskRemindersEnabled}
                onCheckedChange={(val) => updateNotificationSettings({ taskRemindersEnabled: val })}
              />
            </div>

            {notificationSettings.taskRemindersEnabled && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-300">Default Task Reminders:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {ALL_REMINDER_OPTIONS.map((opt) => {
                    const isSelected = (notificationSettings.defaultTaskReminders || []).includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleToggleTaskReminderOption(opt)}
                        className={`p-1.5 rounded-lg border text-[10px] font-medium transition-all text-left ${
                          isSelected
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {REMINDER_LABEL_MAP[opt]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-200">Class & Session Reminders</h4>
                <p className="text-[11px] text-slate-400">Send alerts before class start times with teacher strictness context.</p>
              </div>
              <Switch
                checked={notificationSettings.classRemindersEnabled}
                onCheckedChange={(val) => updateNotificationSettings({ classRemindersEnabled: val })}
              />
            </div>

            {notificationSettings.classRemindersEnabled && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-300">Default Class Reminders:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {ALL_REMINDER_OPTIONS.map((opt) => {
                    const isSelected = (notificationSettings.defaultClassReminders || []).includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleToggleClassReminderOption(opt)}
                        className={`p-1.5 rounded-lg border text-[10px] font-medium transition-all text-left ${
                          isSelected
                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {REMINDER_LABEL_MAP[opt]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={sendTestNotification}
            className="border-slate-800 bg-slate-900 text-amber-300 hover:text-amber-200 text-xs gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-amber-400" />
            Send Test Background Notification
          </Button>

          <Button
            onClick={onClose}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4"
          >
            Save & Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};