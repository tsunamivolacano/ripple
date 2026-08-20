import { supabase } from '@/integrations/supabase/client';
import { StudyLog } from '@/types/ripple';
import { isValidUUID, generateUUID } from '@/utils/uuidUtils';

export async function fetchUserStudyLogs(userId: string): Promise<StudyLog[]> {
  const { data, error } = await supabase
    .from('study_logs')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false });

  if (error || !data) {
    if (error) console.warn('[syncStudyLogs] Failed to fetch study_logs:', error.message);
    return [];
  }

  return data.map((l) => ({
    id: l.id,
    subject: l.subject,
    durationMinutes: Number(l.duration_minutes) || 0,
    topic: l.topic || undefined,
    loggedAt: l.logged_at || l.created_at || new Date().toISOString(),
    source: (l.source as any) || 'manual'
  }));
}

export async function syncStudyLogInsert(userId: string, log: StudyLog): Promise<string | null> {
  if (!isValidUUID(userId)) return null;

  try {
    const validId = isValidUUID(log.id) ? log.id : generateUUID();

    const payload = {
      id: validId,
      user_id: userId,
      subject: log.subject,
      duration_minutes: Math.max(1, Math.round(log.durationMinutes)),
      topic: log.topic || null,
      logged_at: log.loggedAt || new Date().toISOString(),
      source: log.source || 'manual'
    };

    const { data, error } = await supabase.from('study_logs').insert(payload).select('id').single();
    if (error) {
      console.error('[syncStudyLogs] Error inserting study log into Supabase:', error.message);
      return null;
    }
    return data?.id || validId;
  } catch (e) {
    console.error('[syncStudyLogs] Study log insert exception:', e);
    return null;
  }
}

export async function syncStudyLogDelete(userId: string, logId: string): Promise<void> {
  if (!isValidUUID(userId) || !isValidUUID(logId)) return;

  try {
    const { error } = await supabase.from('study_logs').delete().eq('id', logId).eq('user_id', userId);
    if (error) {
      console.error('[syncStudyLogs] Error deleting study log:', error.message);
    }
  } catch (e) {
    console.error('[syncStudyLogs] Study log delete exception:', e);
  }
}