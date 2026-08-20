import { supabase } from '@/integrations/supabase/client';
import { Task, TaskType, TaskCategory, TaskStatus } from '@/types/ripple';
import { isValidUUID, generateUUID } from '@/utils/uuidUtils';

export async function fetchUserTasks(userId: string): Promise<Task[]> {
  if (!isValidUUID(userId)) return [];

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[syncTasks] Failed to fetch tasks from Supabase:', error.message);
      return [];
    }

    if (!data) return [];

    return data.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description || undefined,
      slotId: t.slot_id && t.slot_id !== 'none' ? t.slot_id : undefined,
      hasDeadline: t.has_deadline ?? true,
      dueDate: t.due_date || undefined,
      estimatedHours: Number(t.estimated_hours) || 1.0,
      completionPercentage: Number(t.completion_percentage) || 0,
      taskType: (t.task_type || 'problem_set') as TaskType,
      category: (t.category === 'personal' ? 'personal' : 'academic') as TaskCategory,
      status: (t.status as TaskStatus) || 'manageable',
      reminders: (t.reminders as any) || ['15m', 'exact'],
      recurrence: (t.recurrence as any) || undefined,
      createdAt: t.created_at || new Date().toISOString(),
      completedAt: t.completed_at || undefined,
      renegotiatedCount: t.renegotiated_count || 0,
      lastRenegotiatedAt: t.last_renegotiated || undefined
    }));
  } catch (e) {
    console.error('[syncTasks] Exception fetching user tasks:', e);
    return [];
  }
}

export async function syncTaskInsert(userId: string, task: Task): Promise<boolean> {
  if (!isValidUUID(userId)) return false;

  try {
    const validId = task.id || generateUUID();
    const categoryVal = task.category === 'personal' ? 'personal' : 'academic';
    const statusVal = ['manageable', 'tight', 'critical', 'too_late', 'completed', 'renegotiated'].includes(task.status)
      ? task.status
      : 'manageable';

    const payload = {
      id: validId,
      user_id: userId,
      title: task.title,
      description: task.description || null,
      slot_id: task.slotId && task.slotId !== 'none' ? task.slotId : null,
      has_deadline: task.hasDeadline ?? true,
      due_date: task.dueDate || null,
      estimated_hours: task.estimatedHours || 1.0,
      completion_percentage: Math.min(100, Math.max(0, task.completionPercentage || 0)),
      task_type: task.taskType || 'problem_set',
      type: categoryVal,
      category: categoryVal,
      status: statusVal,
      priority: statusVal === 'critical' || statusVal === 'too_late' ? 'high' : 'medium',
      reminders: task.reminders || ['15m', 'exact'],
      recurrence: task.recurrence || null,
      created_at: task.createdAt || new Date().toISOString(),
      completed_at: task.completedAt || null,
      renegotiated_count: task.renegotiatedCount || 0,
      last_renegotiated: task.lastRenegotiatedAt || null
    };

    const { error } = await supabase.from('tasks').upsert(payload);
    if (error) {
      console.error('[syncTasks] Error inserting task into Supabase:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[syncTasks] Task insert exception:', e);
    return false;
  }
}

export async function syncTaskUpdate(userId: string, task: Task): Promise<boolean> {
  if (!isValidUUID(userId) || !task.id) return false;

  try {
    const categoryVal = task.category === 'personal' ? 'personal' : 'academic';
    const statusVal = ['manageable', 'tight', 'critical', 'too_late', 'completed', 'renegotiated'].includes(task.status)
      ? task.status
      : 'manageable';

    const payload = {
      title: task.title,
      description: task.description || null,
      slot_id: task.slotId && task.slotId !== 'none' ? task.slotId : null,
      has_deadline: task.hasDeadline ?? true,
      due_date: task.dueDate || null,
      estimated_hours: task.estimatedHours || 1.0,
      completion_percentage: Math.min(100, Math.max(0, task.completionPercentage || 0)),
      task_type: task.taskType || 'problem_set',
      type: categoryVal,
      category: categoryVal,
      status: statusVal,
      priority: statusVal === 'critical' || statusVal === 'too_late' ? 'high' : 'medium',
      reminders: task.reminders || ['15m', 'exact'],
      recurrence: task.recurrence || null,
      completed_at: task.completedAt || null,
      renegotiated_count: task.renegotiatedCount || 0,
      last_renegotiated: task.lastRenegotiatedAt || null
    };

    const { error } = await supabase.from('tasks').update(payload).eq('id', task.id).eq('user_id', userId);
    if (error) {
      console.error('[syncTasks] Error updating task in Supabase:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[syncTasks] Task update exception:', e);
    return false;
  }
}

export async function syncTaskDelete(userId: string, taskId: string): Promise<boolean> {
  if (!isValidUUID(userId) || !taskId) return false;

  try {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId);
    if (error) {
      console.error('[syncTasks] Error deleting task from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[syncTasks] Task delete exception:', e);
    return false;
  }
}