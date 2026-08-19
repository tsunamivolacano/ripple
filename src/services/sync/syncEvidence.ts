import { supabase } from '@/integrations/supabase/client';
import { EvidenceEntry } from '@/types/ripple';
import { isValidUUID, generateUUID } from '@/utils/uuidUtils';

export async function fetchUserEvidence(userId: string): Promise<EvidenceEntry[]> {
  const { data, error } = await supabase
    .from('evidence_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    if (error) console.warn('[syncEvidence] Failed to fetch evidence_entries:', error.message);
    return [];
  }

  return data.map((e) => ({
    id: e.id,
    taskId: e.task_id,
    taskTitle: e.task_title,
    subject: e.subject,
    teacherName: e.teacher_name,
    predictedScenario: e.predicted_scenario || '',
    actualOutcome: e.actual_outcome || '',
    wasOnTime: Boolean(e.was_on_time),
    accuracyRating: e.accuracy_rating || 5,
    dateLogged: e.date_logged || e.created_at || new Date().toISOString(),
    userNotes: e.user_notes || undefined
  }));
}

export async function syncEvidenceInsert(userId: string, entry: EvidenceEntry): Promise<string | null> {
  if (!isValidUUID(userId)) return null;

  try {
    const validId = isValidUUID(entry.id) ? entry.id : generateUUID();

    const payload = {
      id: validId,
      user_id: userId,
      task_id: entry.taskId,
      task_title: entry.taskTitle,
      subject: entry.subject,
      teacher_name: entry.teacherName,
      predicted_scenario: entry.predictedScenario || null,
      actual_outcome: entry.actualOutcome || null,
      was_on_time: entry.wasOnTime,
      accuracy_rating: entry.accuracyRating,
      date_logged: entry.dateLogged || new Date().toISOString(),
      user_notes: entry.userNotes || null
    };

    const { data, error } = await supabase.from('evidence_entries').insert(payload).select('id').single();
    if (error) {
      console.error('[syncEvidence] Error inserting evidence entry:', error.message);
      return null;
    }
    return data?.id || validId;
  } catch (e) {
    console.error('[syncEvidence] Evidence insert exception:', e);
    return null;
  }
}