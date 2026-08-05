import { supabase } from './client';
import { TimetableSlot, Task, EvidenceEntry, ProcrastinationDebt, UserProfile } from '@/types/ripple';

export const TABLES = {
  PROFILES: 'profiles',
  TIMETABLE_SLOTS: 'timetable_slots',
  TASKS: 'tasks',
  EVIDENCE_LOG: 'evidence_log',
  PROCRASTINATION_DEBT: 'procrastination_debt'
} as const;

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from(TABLES.PROFILES).select('*').eq('id', userId).single();
  if (error || !data) return null;
  return {
    id: data.id,
    fullName: data.full_name || '',
    email: data.email || '',
    role: data.role || 'student',
    intensityMode: data.intensity_mode || 'standard'
  };
}

export async function fetchUserSlots(userId: string): Promise<TimetableSlot[]> {
  const { data, error } = await supabase.from(TABLES.TIMETABLE_SLOTS).select('*').eq('user_id', userId);
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    subject: row.subject,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    room: row.room,
    teacherName: row.teacher_name,
    strictnessTag: row.strictness_tag,
    stakesTag: row.stakes_tag,
    weight: row.weight,
    notes: row.notes
  }));
}

export async function saveUserSlot(userId: string, slot: TimetableSlot): Promise<void> {
  await supabase.from(TABLES.TIMETABLE_SLOTS).upsert({
    id: slot.id,
    user_id: userId,
    subject: slot.subject,
    day_of_week: slot.dayOfWeek,
    start_time: slot.startTime,
    end_time: slot.endTime,
    room: slot.room,
    teacher_name: slot.teacherName,
    strictness_tag: slot.strictnessTag,
    stakes_tag: slot.stakesTag,
    weight: slot.weight,
    notes: slot.notes
  });
}

export async function deleteUserSlot(userId: string, slotId: string): Promise<void> {
  await supabase.from(TABLES.TIMETABLE_SLOTS).delete().eq('id', slotId).eq('user_id', userId);
}

export async function fetchUserTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase.from(TABLES.TASKS).select('*').eq('user_id', userId);
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    slotId: row.slot_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    estimatedHours: row.estimated_hours,
    completionPercentage: row.completion_percentage,
    taskType: row.task_type,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    renegotiatedCount: row.renegotiated_count,
    lastRenegotiatedAt: row.last_renegotiated_at
  }));
}

export async function saveUserTask(userId: string, task: Task): Promise<void> {
  await supabase.from(TABLES.TASKS).upsert({
    id: task.id,
    user_id: userId,
    slot_id: task.slotId,
    title: task.title,
    description: task.description,
    due_date: task.dueDate,
    estimated_hours: task.estimatedHours,
    completion_percentage: task.completionPercentage,
    task_type: task.taskType,
    status: task.status,
    created_at: task.createdAt,
    completed_at: task.completedAt,
    renegotiated_count: task.renegotiatedCount,
    last_renegotiated_at: task.lastRenegotiatedAt
  });
}

export async function deleteUserTask(userId: string, taskId: string): Promise<void> {
  await supabase.from(TABLES.TASKS).delete().eq('id', taskId).eq('user_id', userId);
}

export async function fetchUserEvidence(userId: string): Promise<EvidenceEntry[]> {
  const { data, error } = await supabase.from(TABLES.EVIDENCE_LOG).select('*').eq('user_id', userId);
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    taskId: row.task_id,
    taskTitle: row.task_title,
    subject: row.subject,
    teacherName: row.teacher_name,
    predictedScenario: row.predicted_scenario,
    actualOutcome: row.actual_outcome,
    wasOnTime: row.was_on_time,
    accuracyRating: row.accuracy_rating,
    dateLogged: row.date_logged,
    userNotes: row.user_notes
  }));
}

export async function saveUserEvidence(userId: string, entry: EvidenceEntry): Promise<void> {
  await supabase.from(TABLES.EVIDENCE_LOG).upsert({
    id: entry.id,
    user_id: userId,
    task_id: entry.taskId,
    task_title: entry.taskTitle,
    subject: entry.subject,
    teacher_name: entry.teacherName,
    predicted_scenario: entry.predictedScenario,
    actual_outcome: entry.actualOutcome,
    was_on_time: entry.wasOnTime,
    accuracy_rating: entry.accuracyRating,
    date_logged: entry.dateLogged,
    user_notes: entry.userNotes
  });
}

export async function fetchUserDebt(userId: string): Promise<ProcrastinationDebt | null> {
  const { data, error } = await supabase.from(TABLES.PROCRASTINATION_DEBT).select('*').eq('user_id', userId).single();
  if (error || !data) return null;
  return {
    totalHoursBehind: data.total_hours_behind,
    missedDeadlinesCount: data.missed_deadlines_count,
    streakDays: data.streak_days,
    compoundingScore: data.compounding_score,
    weeklyDebtTrend: data.weekly_debt_trend
  };
}

export async function saveUserDebt(userId: string, debt: ProcrastinationDebt): Promise<void> {
  await supabase.from(TABLES.PROCRASTINATION_DEBT).upsert({
    user_id: userId,
    total_hours_behind: debt.totalHoursBehind,
    missed_deadlines_count: debt.missedDeadlinesCount,
    streak_days: debt.streakDays,
    compounding_score: debt.compoundingScore,
    weekly_debt_trend: debt.weeklyDebtTrend,
    updated_at: new Date().toISOString()
  });
}