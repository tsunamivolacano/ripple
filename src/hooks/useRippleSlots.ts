import { useState, useCallback } from 'react';
import { TimetableSlot, NotificationSettings } from '@/types/ripple';
import { generateUUID } from '@/utils/uuidUtils';
import { showSuccess } from '@/utils/toast';
import { 
  scheduleClassNotifications, 
  cancelItemNotifications, 
  getNextSlotDateISO 
} from '@/utils/notificationService';
import { 
  syncSlotInsert, 
  syncSlotUpdate, 
  syncSlotDelete 
} from '@/services/databaseSyncService';
import { UserAccount } from './useRippleAuth';

export function useRippleSlots(
  currentUser: UserAccount | null,
  notificationSettings: NotificationSettings
) {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);

  const addSlot = useCallback(async (slotData: Omit<TimetableSlot, 'id'>) => {
    if (!currentUser) return;
    const newSlot: TimetableSlot = { ...slotData, id: generateUUID() };
    setSlots((prev) => [...prev, newSlot]);

    if (!currentUser.isDemo) {
      await syncSlotInsert(currentUser.id, newSlot);
    }

    const nextClassISO = getNextSlotDateISO(newSlot.dayOfWeek, newSlot.startTime);
    await scheduleClassNotifications(currentUser.id, newSlot, nextClassISO, notificationSettings);
    showSuccess(`Timetable slot for ${newSlot.subject} saved.`);
  }, [currentUser, notificationSettings]);

  const updateSlot = useCallback(async (updatedSlot: TimetableSlot) => {
    if (!currentUser) return;
    setSlots((prev) => prev.map((s) => (s.id === updatedSlot.id ? updatedSlot : s)));

    if (!currentUser.isDemo) {
      await syncSlotUpdate(currentUser.id, updatedSlot);
    }

    const nextClassISO = getNextSlotDateISO(updatedSlot.dayOfWeek, updatedSlot.startTime);
    await scheduleClassNotifications(currentUser.id, updatedSlot, nextClassISO, notificationSettings);
    showSuccess(`Updated ${updatedSlot.subject} class schedule.`);
  }, [currentUser, notificationSettings]);

  const deleteSlot = useCallback(async (id: string) => {
    if (!currentUser) return;
    setSlots((prev) => prev.filter((s) => s.id !== id));
    if (!currentUser.isDemo) {
      await syncSlotDelete(currentUser.id, id);
    }
    await cancelItemNotifications(currentUser.id, id);
    showSuccess('Timetable slot removed.');
  }, [currentUser]);

  return {
    slots,
    setSlots,
    addSlot,
    updateSlot,
    deleteSlot
  };
}