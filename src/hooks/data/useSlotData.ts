import { useState, Dispatch, SetStateAction } from 'react';
import { TimetableSlot, NotificationSettings } from '@/types/ripple';
import { showSuccess } from '@/utils/toast';
import { scheduleClassNotifications, cancelItemNotifications, getNextSlotDateISO } from '@/utils/notificationService';
import { logUserActivity } from '@/services/loggerService';
import { UserAccount } from '../useRippleAuth';

export function useSlotData(
  currentUser: UserAccount | null,
  slots: TimetableSlot[],
  setSlots: Dispatch<SetStateAction<TimetableSlot[]>>,
  notificationSettings: NotificationSettings
) {
  const addSlot = async (slotData: Omit<TimetableSlot, 'id'>) => {
    if (!currentUser) return;
    const newSlot: TimetableSlot = { ...slotData, id: `slot-${Date.now()}` };
    setSlots((prev) => [...prev, newSlot]);

    const nextClassISO = getNextSlotDateISO(newSlot.dayOfWeek, newSlot.startTime);
    await scheduleClassNotifications(currentUser.id, newSlot, nextClassISO, notificationSettings);
    showSuccess(`Timetable slot for ${newSlot.subject} created with reminders.`);

    logUserActivity({
      eventName: 'timetable_slot_created',
      eventType: 'timetable',
      userId: currentUser.id,
      userEmail: currentUser.email,
      success: true,
      metadata: { slotId: newSlot.id, subject: newSlot.subject, teacher: newSlot.teacherName, day: newSlot.dayOfWeek }
    });
  };

  const updateSlot = async (updatedSlot: TimetableSlot) => {
    if (!currentUser) return;
    setSlots((prev) => prev.map((s) => (s.id === updatedSlot.id ? updatedSlot : s)));

    const nextClassISO = getNextSlotDateISO(updatedSlot.dayOfWeek, updatedSlot.startTime);
    await scheduleClassNotifications(currentUser.id, updatedSlot, nextClassISO, notificationSettings);
    showSuccess(`Updated ${updatedSlot.subject} class schedule.`);

    logUserActivity({
      eventName: 'timetable_slot_updated',
      eventType: 'timetable',
      userId: currentUser.id,
      userEmail: currentUser.email,
      success: true,
      metadata: { slotId: updatedSlot.id, subject: updatedSlot.subject, teacher: updatedSlot.teacherName }
    });
  };

  const deleteSlot = async (id: string) => {
    if (!currentUser) return;
    const slotToDelete = slots.find((s) => s.id === id);
    setSlots((prev) => prev.filter((s) => s.id !== id));
    await cancelItemNotifications(currentUser.id, id);
    showSuccess('Timetable slot removed.');

    logUserActivity({
      eventName: 'timetable_slot_deleted',
      eventType: 'timetable',
      userId: currentUser.id,
      userEmail: currentUser.email,
      success: true,
      metadata: { slotId: id, subject: slotToDelete?.subject }
    });
  };

  return { addSlot, updateSlot, deleteSlot };
}