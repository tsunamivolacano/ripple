import { supabase } from '@/integrations/supabase/client';
import { EvidenceEntry } from '@/types/ripple';
import { isValidUUID, generateUUID } from '@/utils/uuidUtils';

export async function fetchUserEvidence(userId: string): Promise<EvidenceEntry[]> {
  if (!isValidUUID(userId)) return [];

  try {
    const { data, error } = await supabase
      .from('evidence_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date_logged', { ascending: false });

    if (error) {
      console.error('[syncEvidence] Failed to fetch evidence_entries:', error.message);
      return [];
    }

    if (!data) return [];

    return data.map((e) => ({
      id: e.id,
      taskId: e.task_id,
      taskTitle: e.task_title,
      subject: e.subject,
      teacherName: e.teacher_name,
      predictedScenario: e.predicted_scenario || '',
      actualOutcome: e.actual_outcome || '',
      wasOnTime: Boolean(e.was_on_time),
      accuracyRating: Math.min(5, Math.max(1, e.accuracy_rating || 5)),
      dateLogged: e.date_logged || e.created_at || new Date().toISOString(),
      userNotes: e.user_notes || undefined
    }));
  } catch (e) {
    console.error('[syncEvidence] Exception fetching evidence:', e);
    return [];
  }
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
      was_on_time: Boolean(entry.wasOnTime),
      accuracy_rating: Math.min(5, Math.max(1, entry.accuracyRating || 5)),
      date_logged: entry.dateLogged || new Date().toISOString(),
      user_notes: entry.userNotes || null
    };

    const { data, error } = await supabase.from('evidence_entries').upsert(payload).select('id').single();
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