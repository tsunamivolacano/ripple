import { supabase } from '@/integrations/supabase/client';
import { TimetableSlot } from '@/types/ripple';
import { isValidUUID } from '@/utils/uuidUtils';

export async function fetchUserSlots(userId: string): Promise<TimetableSlot[]> {
  const { data, error } = await supabase
    .from('timetable_slots')
    .select('*')
    .eq('user_id', userId);

  if (error || !data) {
    if (error) console.warn('[syncSlots] Failed to fetch timetable_slots:', error.message);
    return [];
  }

  return data.map((s) => ({
    id: s.id,
    subject: s.subject,
    dayOfWeek: s.day_of_week as any,
    startTime: s.start_time,
    endTime: s.end_time,
    room: s.room || '',
    teacherName: s.teacher_name || '',
    strictnessTag: (s.strictness_tag as any) || 'NOTEBOOK_CHECK',
    stakesTag: (s.stakes_tag as any) || 'HOMEWORK',
    weight: Number(s.weight) || 20,
    reminders: (s.reminders as any) || ['15m'],
    recurrence: (s.recurrence as any) || { type: 'weekly' },
    specificDate: s.specific_date || undefined,
    notes: s.notes || undefined
  }));
}

export async function syncSlotInsert(userId: string, slot: TimetableSlot): Promise<void> {
  if (!isValidUUID(userId)) return;

  try {
    const payload = {
      id: slot.id,
      user_id: userId,
      subject: slot.subject,
      day_of_week: slot.dayOfWeek,
      start_time: slot.startTime,
      end_time: slot.endTime,
      room: slot.room || '',
      teacher_name: slot.teacherName || '',
      strictness_tag: slot.strictnessTag,
      stakes_tag: slot.stakesTag,
      weight: slot.weight,
      reminders: slot.reminders || ['15m'],
      recurrence: slot.recurrence || { type: 'weekly' },
      specific_date: slot.specificDate || null,
      notes: slot.notes || null
    };

    await supabase.from('timetable_slots').upsert(payload);
  } catch (e) {
    console.warn('[syncSlots] Slot insert notice:', e);
  }
}

export async function syncSlotUpdate(userId: string, slot: TimetableSlot): Promise<void> {
  if (!isValidUUID(userId)) return;

  try {
    const payload = {
      subject: slot.subject,
      day_of_week: slot.dayOfWeek,
      start_time: slot.startTime,
      end_time: slot.endTime,
      room: slot.room || '',
      teacher_name: slot.teacherName || '',
      strictness_tag: slot.strictnessTag,
      stakes_tag: slot.stakesTag,
      weight: slot.weight,
      reminders: slot.reminders || ['15m'],
      recurrence: slot.recurrence || { type: 'weekly' },
      specific_date: slot.specificDate || null,
      notes: slot.notes || null
    };

    await supabase.from('timetable_slots').update(payload).eq('id', slot.id).eq('user_id', userId);
  } catch (e) {
    console.warn('[syncSlots] Slot update notice:', e);
  }
}

export async function syncSlotDelete(userId: string, slotId: string): Promise<void> {
  if (!isValidUUID(userId)) return;

  try {
    await supabase.from('timetable_slots').delete().eq('id', slotId).eq('user_id', userId);
  } catch (e) {
    console.warn('[syncSlots] Slot delete notice:', e);
  }
}