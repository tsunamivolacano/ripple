import { supabase } from "@/integrations/supabase/client";
import {
  Task,
  TimetableSlot,
  EvidenceEntry,
  StudyLog,
  ProcrastinationDebt,
  UserSettings,
  NotificationSettings
} from "@/types/ripple";

export type CollectionKey =
  | "slots"
  | "tasks"
  | "evidence"
  | "study"
  | "debt"
  | "settings"
  | "notifSettings";

const TABLES: Record<CollectionKey, string> = {
  slots: "timetable_slots",
  tasks: "tasks",
  evidence: "evidence_entries",
  study: "study_logs",
  debt: "procrastination_debt",
  settings: "user_settings",
  notifSettings: "notification_settings"
};

/* ------------------------------ Mappers ------------------------------ */

const taskFromRow = (r: any): Task => ({
  id: r.id,
  title: r.title,
  description: r.description ?? undefined,
  syllabus: r.syllabus ?? undefined,
  slotId: r.slot_id ?? undefined,
  hasDeadline: r.has_deadline,
  dueDate: r.due_date ?? undefined,
  estimatedHours: Number(r.estimated_hours ?? 1),
  completionPercentage: r.completion_percentage ?? 0,
  taskType: r.task_type,
  category: r.category ?? "academic",
  reminders: r.reminders ?? undefined,
  recurrence: r.recurrence ?? undefined,
  createdAt: r.created_at,
  completedAt: r.completed_at ?? undefined,
  renegotiatedCount: r.renegotiated_count ?? 0,
  lastRenegotiatedAt: r.last_renegotiated_at ?? undefined
});

const taskToRow = (t: Task, userId: string) => ({
  id: t.id,
  user_id: userId,
  title: t.title,
  description: t.description ?? null,
  syllabus: t.syllabus ?? null,
  slot_id: t.slotId ?? null,
  has_deadline: t.hasDeadline,
  due_date: t.dueDate ?? null,
  estimated_hours: t.estimatedHours,
  completion_percentage: t.completionPercentage,
  task_type: t.taskType,
  category: t.category ?? "academic",
  reminders: t.reminders ?? null,
  recurrence: t.recurrence ?? null,
  completed_at: t.completedAt ?? null,
  renegotiated_count: t.renegotiatedCount ?? 0,
  last_renegotiated_at: t.lastRenegotiatedAt ?? null
});

const slotFromRow = (r: any): TimetableSlot => ({
  id: r.id,
  subject: r.subject,
  dayOfWeek: r.day_of_week,
  startTime: r.start_time,
  endTime: r.end_time,
  room: r.room,
  teacherName: r.teacher_name,
  strictnessTag: r.strictness_tag,
  stakesTag: r.stakes_tag,
  weight: r.weight ?? 20,
  reminders: r.reminders ?? undefined,
  recurrence: r.recurrence ?? undefined,
  specificDate: r.specific_date ?? undefined,
  notes: r.notes ?? undefined
});

const slotToRow = (s: TimetableSlot, userId: string) => ({
  id: s.id,
  user_id: userId,
  subject: s.subject,
  day_of_week: s.dayOfWeek,
  start_time: s.startTime,
  end_time: s.endTime,
  room: s.room,
  teacher_name: s.teacherName,
  strictness_tag: s.strictnessTag,
  stakes_tag: s.stakesTag,
  weight: s.weight,
  reminders: s.reminders ?? null,
  recurrence: s.recurrence ?? null,
  specific_date: s.specificDate ?? null,
  notes: s.notes ?? null
});

const evidenceFromRow = (r: any): EvidenceEntry => ({
  id: r.id,
  taskId: r.task_id ?? "",
  taskTitle: r.task_title,
  subject: r.subject ?? "General",
  teacherName: r.teacher_name ?? "Unknown Instructor",
  predictedScenario: r.predicted_scenario ?? "",
  actualOutcome: r.actual_outcome ?? "",
  wasOnTime: r.was_on_time,
  accuracyRating: r.accuracy_rating ?? 5,
  dateLogged: r.date_logged,
  userNotes: r.user_notes ?? undefined
});

const evidenceToRow = (e: EvidenceEntry, userId: string) => ({
  id: e.id,
  user_id: userId,
  task_id: e.taskId,
  task_title: e.taskTitle,
  subject: e.subject,
  teacher_name: e.teacherName,
  predicted_scenario: e.predictedScenario,
  actual_outcome: e.actualOutcome,
  was_on_time: e.wasOnTime,
  accuracy_rating: e.accuracyRating,
  date_logged: e.dateLogged,
  user_notes: e.userNotes ?? null
});

const studyFromRow = (r: any): StudyLog => ({
  id: r.id,
  subject: r.subject,
  durationMinutes: r.duration_minutes,
  topic: r.topic ?? undefined,
  loggedAt: r.logged_at,
  source: r.source as StudyLog["source"]
});

const studyToRow = (l: StudyLog, userId: string) => ({
  id: l.id,
  user_id: userId,
  subject: l.subject,
  duration_minutes: l.durationMinutes,
  topic: l.topic ?? null,
  logged_at: l.loggedAt,
  source: l.source
});

const debtFromRow = (r: any): ProcrastinationDebt => ({
  totalHoursBehind: Number(r.total_hours_behind ?? 0),
  missedDeadlinesCount: r.missed_deadlines_count ?? 0,
  streakDays: r.streak_days ?? 0,
  compoundingScore: r.compounding_score ?? 0,
  weeklyDebtTrend: r.weekly_debt_trend ?? []
});

const debtToRow = (d: ProcrastinationDebt, userId: string) => ({
  user_id: userId,
  total_hours_behind: d.totalHoursBehind,
  missed_deadlines_count: d.missedDeadlinesCount,
  streak_days: d.streakDays,
  compounding_score: d.compoundingScore,
  weekly_debt_trend: d.weeklyDebtTrend
});

const settingsFromRow = (r: any): UserSettings => ({
  intensityMode: r.intensity_mode ?? "standard",
  isMinorProfile: r.is_minor_profile ?? false,
  weeklyDigestOnly: r.weekly_digest_only ?? false,
  personalVelocityMultiplier: Number(r.personal_velocity_multiplier ?? 1.0)
});

const settingsToRow = (s: UserSettings, userId: string) => ({
  user_id: userId,
  intensity_mode: s.intensityMode,
  is_minor_profile: s.isMinorProfile,
  weekly_digest_only: s.weeklyDigestOnly,
  personal_velocity_multiplier: s.personalVelocityMultiplier
});

const notifFromRow = (r: any): NotificationSettings => ({
  taskRemindersEnabled: r.task_reminders_enabled ?? true,
  classRemindersEnabled: r.class_reminders_enabled ?? true,
  defaultTaskReminders: r.default_task_reminders ?? ["15m", "exact"],
  defaultClassReminders: r.default_class_reminders ?? ["15m"]
});

const notifToRow = (n: NotificationSettings, userId: string) => ({
  user_id: userId,
  task_reminders_enabled: n.taskRemindersEnabled,
  class_reminders_enabled: n.classRemindersEnabled,
  default_task_reminders: n.defaultTaskReminders,
  default_class_reminders: n.defaultClassReminders
});

const ROW_MAPPERS: Record<CollectionKey, (row: any) => any> = {
  slots: slotFromRow,
  tasks: taskFromRow,
  evidence: evidenceFromRow,
  study: studyFromRow,
  debt: debtFromRow,
  settings: settingsFromRow,
  notifSettings: notifFromRow
};

const ROW_SERIALIZERS: Record<CollectionKey, (value: any, userId: string) => any> = {
  slots: slotToRow,
  tasks: taskToRow,
  evidence: evidenceToRow,
  study: studyToRow,
  debt: debtToRow,
  settings: settingsToRow,
  notifSettings: notifToRow
};

/* ------------------------------ Fetch ------------------------------ */

/**
 * Fetch a single collection for a user. Returns null when the table is
 * unavailable or the query fails, allowing the caller to fall back to cache.
 */
export async function fetchCollection(
  userId: string,
  kind: CollectionKey
): Promise<any | null> {
  try {
    const table = TABLES[kind];
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", userId);

    if (error || data === null) {
      console.warn(`[rippleData] fetch ${kind} failed`, error?.message);
      return null;
    }

    const mapper = ROW_MAPPERS[kind];

    if (kind === "debt" || kind === "settings" || kind === "notifSettings") {
      const row = data[0];
      return row ? mapper(row) : null;
    }

    return (data as any[]).map((r) => mapper(r));
  } catch (err) {
    console.warn(`[rippleData] fetch ${kind} exception`, err);
    return null;
  }
}

/* ------------------------------ Persist ------------------------------ */

/**
 * Persist a collection for a user. Arrays are diff-synced (delete rows no
 * longer present, upsert the rest). Single-row kinds are upserted by user_id.
 */
export async function persistCollection(
  userId: string,
  kind: CollectionKey,
  value: any
): Promise<boolean> {
  try {
    const table = TABLES[kind];
    const serialize = ROW_SERIALIZERS[kind];

    if (Array.isArray(value)) {
      // Remove rows deleted locally
      const { data: existing, error: listErr } = await supabase
        .from(table)
        .select("id")
        .eq("user_id", userId);

      if (!listErr && existing) {
        const localIds = new Set<string>(value.map((v) => v.id));
        const idsToDelete = existing.map((r) => r.id).filter((id) => !localIds.has(id));
        if (idsToDelete.length > 0) {
          await supabase.from(table).delete().eq("user_id", userId).in("id", idsToDelete);
        }
      }

      if (value.length > 0) {
        const rows = value.map((v) => serialize(v, userId));
        const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
        if (error) {
          console.warn(`[rippleData] upsert ${kind} failed`, error.message);
          return false;
        }
      }
      return true;
    }

    const { error } = await supabase
      .from(table)
      .upsert(serialize(value, userId), { onConflict: "user_id" });

    if (error) {
      console.warn(`[rippleData] upsert ${kind} failed`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[rippleData] persist ${kind} exception`, err);
    return false;
  }
}

/** Hard-delete every collection row for a user (used by reset). */
export async function deleteAllUserData(userId: string): Promise<void> {
  const keys: CollectionKey[] = [
    "slots",
    "tasks",
    "evidence",
    "study",
    "debt",
    "settings",
    "notifSettings"
  ];
  await Promise.all(
    keys.map(async (kind) => {
      try {
        await supabase.from(TABLES[kind]).delete().eq("user_id", userId);
      } catch (err) {
        console.warn(`[rippleData] reset ${kind} exception`, err);
      }
    })
  );
}