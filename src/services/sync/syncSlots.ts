import { supabase } from '@/integrations/supabase/client';
import { TimetableSlot } from '@/types/ripple';
import { isValidUUID, generateUUID } from '@/utils/uuidUtils';

export async function fetchUserSlots(userId: string): Promise<TimetableSlot[]> {
  if (!isValidUUID(userId)) return [];

  try {
    const { data, error } = await supabase
      .from('timetable_slots')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[syncSlots] Failed to fetch timetable_slots:', error.message);
      return [];
    }

    if (!data) return [];

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
  } catch (e) {
    console.error('[syncSlots] Exception fetching user slots:', e);
    return [];
  }
}

export async function syncSlotInsert(userId: string, slot: TimetableSlot): Promise<boolean> {
  if (!isValidUUID(userId)) return false;

  try {
    const validId = slot.id || generateUUID();
    const payload = {
      id: validId,
      user_id: userId,
      subject: slot.subject,
      day_of_week: slot.dayOfWeek,
      start_time: slot.startTime,
      end_time: slot.endTime,
      room: slot.room || '',
      teacher_name: slot.teacherName || '',
      strictness_tag: slot.strictnessTag || 'NOTEBOOK_CHECK',
      stakes_tag: slot.stakesTag || 'HOMEWORK',
      weight: slot.weight || 20,
      reminders: slot.reminders || ['15m'],
      recurrence: slot.recurrence || { type: 'weekly' },
      specific_date: slot.specificDate || null,
      notes: slot.notes || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('timetable_slots').upsert(payload);
    if (error) {
      console.error('[syncSlots] Error inserting timetable slot:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[syncSlots] Slot insert exception:', e);
    return false;
  }
}

export async function syncSlotUpdate(userId: string, slot: TimetableSlot): Promise<boolean> {
  if (!isValidUUID(userId) || !slot.id) return false;

  try {
    const payload = {
      subject: slot.subject,
      day_of_week: slot.dayOfWeek,
      start_time: slot.startTime,
      end_time: slot.endTime,
      room: slot.room || '',
      teacher_name: slot.teacherName || '',
      strictness_tag: slot.strictnessTag || 'NOTEBOOK_CHECK',
      stakes_tag: slot.stakesTag || 'HOMEWORK',
      weight: slot.weight || 20,
      reminders: slot.reminders || ['15m'],
      recurrence: slot.recurrence || { type: 'weekly' },
      specific_date: slot.specificDate || null,
      notes: slot.notes || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('timetable_slots').update(payload).eq('id', slot.id).eq('user_id', userId);
    if (error) {
      console.error('[syncSlots] Error updating timetable slot:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[syncSlots] Slot update exception:', e);
    return false;
  }
}

export async function syncSlotDelete(userId: string, slotId: string): Promise<boolean> {
  if (!isValidUUID(userId) || !slotId) return false;

  try {
    const { error } = await supabase.from('timetable_slots').delete().eq('id', slotId).eq('user_id', userId);
    if (error) {
      console.error('[syncSlots] Error deleting timetable slot:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[syncSlots] Slot delete exception:', e);
    return false;
  }
}