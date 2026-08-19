import { supabase } from '@/integrations/supabase/client';
import { Task, TaskType, TaskCategory, TaskStatus } from '@/types/ripple';
import { isValidUUID, generateUUID } from '@/utils/uuidUtils';

export async function fetchUserTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    if (error) console.warn('[syncTasks] Failed to fetch tasks:', error.message);
    return [];
  }

  return data.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description || undefined,
    slotId: t.slot_id || undefined,
    hasDeadline: t.has_deadline ?? true,
    dueDate: t.due_date || undefined,
    estimatedHours: Number(t.estimated_hours) || 1.0,
    completionPercentage: Number(t.completion_percentage) || 0,
    taskType: (t.task_type || t.type || 'problem_set') as TaskType,
    category: (t.category as TaskCategory) || 'academic',
    status: (t.status as TaskStatus) || 'manageable',
    reminders: (t.reminders as any) || ['15m', 'exact'],
    recurrence: (t.recurrence as any) || undefined,
    createdAt: t.created_at || new Date().toISOString(),
    completedAt: t.completed_at || undefined,
    renegotiatedCount: t.renegotiated_count || 0,
    lastRenegotiatedAt: t.last_renegotiated || undefined
  }));
}

export async function syncTaskInsert(userId: string, task: Task): Promise<void> {
  if (!isValidUUID(userId)) return;

  try {
    const validId = isValidUUID(task.id) ? task.id : generateUUID();

    const payload = {
      id: validId,
      user_id: userId,
      title: task.title,
      description: task.description || null,
      slot_id: task.slotId || null,
      has_deadline: task.hasDeadline ?? true,
      due_date: task.dueDate || null,
      estimated_hours: task.estimatedHours,
      completion_percentage: task.completionPercentage,
      task_type: task.taskType,
      type: task.category || 'academic',
      category: task.category || 'academic',
      status: task.status,
      priority: task.status === 'critical' || task.status === 'too_late' ? 'high' : 'medium',
      reminders: task.reminders || ['15m', 'exact'],
      recurrence: task.recurrence || null,
      created_at: task.createdAt || new Date().toISOString()
    };

    await supabase.from('tasks').upsert(payload);
  } catch (e) {
    console.warn('[syncTasks] Task insert notice:', e);
  }
}

export async function syncTaskUpdate(userId: string, task: Task): Promise<void> {
  if (!isValidUUID(userId)) return;

  try {
    const payload = {
      title: task.title,
      description: task.description || null,
      slot_id: task.slotId || null,
      has_deadline: task.hasDeadline ?? true,
      due_date: task.dueDate || null,
      estimated_hours: task.estimatedHours,
      completion_percentage: task.completionPercentage,
      task_type: task.taskType,
      type: task.category || 'academic',
      category: task.category || 'academic',
      status: task.status,
      reminders: task.reminders || ['15m', 'exact'],
      recurrence: task.recurrence || null,
      completed_at: task.completedAt || null,
      renegotiated_count: task.renegotiatedCount || 0,
      last_renegotiated: task.lastRenegotiatedAt || null
    };

    await supabase.from('tasks').update(payload).eq('id', task.id).eq('user_id', userId);
  } catch (e) {
    console.warn('[syncTasks] Task update notice:', e);
  }
}

export async function syncTaskDelete(userId: string, taskId: string): Promise<void> {
  if (!isValidUUID(userId)) return;

  try {
    await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId);
  } catch (e) {
    console.warn('[syncTasks] Task delete notice:', e);
  }
}