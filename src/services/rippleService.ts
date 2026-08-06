import { supabase } from '@/integrations/supabase/client';
import { 
  TimetableSlot, 
  Task, 
  EvidenceEntry, 
  UserSettings, 
  UserProfile 
} from '@/types/ripple';
import { calculateTaskStatus } from '@/utils/timeUtils';
import { User } from '@supabase/supabase-js';
import { PERSONAS_MAP } from '@/data/ripplePersonaData';

export interface UserDataResult {
  profile: UserProfile | null;
  settings: UserSettings;
  slots: TimetableSlot[];
  tasks: Task[];
  evidenceEntries: EvidenceEntry[];
}

const defaultSettings: UserSettings = {
  intensityMode: 'standard',
  isMinorProfile: false,
  weeklyDigestOnly: false,
  personalVelocityMultiplier: 1.0
};

export async function seedDemoDataForUser(userId: string, demoKey: 'riya' | 'aman' | 'kabir'): Promise<void> {
  const bundle = PERSONAS_MAP[demoKey];
  if (!bundle) return;

  try {
    // 1. Profile
    await supabase.from('profiles').upsert({
      id: userId,
      name: bundle.name,
      role: bundle.role
    });

    // 2. Settings
    await supabase.from('user_settings').upsert({
      user_id: userId,
      intensity_mode: bundle.settings.intensityMode,
      is_minor_profile: bundle.settings.isMinorProfile,
      weekly_digest_only: bundle.settings.weeklyDigestOnly,
      personal_velocity_multiplier: bundle.settings.personalVelocityMultiplier
    });

    // 3. Timetable Slots
    const slotMap = new Map<string, string>();
    for (const slot of bundle.slots) {
      const { data: slotRes } = await supabase
        .from('timetable_slots')
        .insert({
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
        })
        .select()
        .single();

      if (slotRes) {
        slotMap.set(slot.id, slotRes.id);
      }
    }

    // 4. Tasks
    for (const task of bundle.tasks) {
      const mappedSlotId = task.slotId ? slotMap.get(task.slotId) || null : null;
      await supabase.from('tasks').insert({
        user_id: userId,
        title: task.title,
        description: task.description,
        slot_id: mappedSlotId,
        due_date: task.dueDate,
        estimated_hours: task.estimatedHours,
        completion_percentage: task.completionPercentage,
        task_type: task.taskType,
        status: task.status
      });
    }

    // 5. Evidence Log
    for (const ev of bundle.evidenceEntries) {
      await supabase.from('evidence_log').insert({
        user_id: userId,
        task_title: ev.taskTitle,
        subject: ev.subject,
        teacher_name: ev.teacherName,
        predicted_scenario: ev.predictedScenario,
        actual_outcome: ev.actualOutcome,
        was_on_time: ev.wasOnTime,
        accuracy_rating: ev.accuracyRating,
        user_notes: ev.userNotes
      });
    }
  } catch (e) {
    console.error('Error seeding demo persona data:', e);
  }
}

export async function fetchUserData(currentUser: User): Promise<UserDataResult> {
  const userId = currentUser.id;
  const userEmail = currentUser.email || '';

  let demoKey: 'riya' | 'aman' | 'kabir' | null = null;
  if (userEmail.includes('riya')) demoKey = 'riya';
  else if (userEmail.includes('aman')) demoKey = 'aman';
  else if (userEmail.includes('kabir')) demoKey = 'kabir';

  // Fetch Profile
  let { data: profData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  // Fetch Slots
  let { data: slotsData } = await supabase
    .from('timetable_slots')
    .select('*')
    .eq('user_id', userId);

  // If demo user and slots are empty, seed demo data first
  if (demoKey && (!slotsData || slotsData.length === 0)) {
    await seedDemoDataForUser(userId, demoKey);
    const { data: pData } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    profData = pData;
    const { data: sData } = await supabase.from('timetable_slots').select('*').eq('user_id', userId);
    slotsData = sData;
  }

  // Profile
  let profile: UserProfile | null = null;
  if (profData) {
    profile = {
      id: profData.id,
      name: profData.name || 'User',
      role: profData.role || 'student'
    };
  } else {
    const demoBundle = demoKey ? PERSONAS_MAP[demoKey] : null;
    profile = {
      id: userId,
      name: demoBundle ? demoBundle.name : currentUser.user_metadata?.name || 'User',
      role: demoBundle ? demoBundle.role : currentUser.user_metadata?.role || 'student'
    };
  }

  // Fetch Settings
  const { data: setData } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  let settings: UserSettings = defaultSettings;
  if (setData) {
    settings = {
      intensityMode: setData.intensity_mode || 'standard',
      isMinorProfile: setData.is_minor_profile || false,
      weeklyDigestOnly: setData.weekly_digest_only || false,
      personalVelocityMultiplier: Number(setData.personal_velocity_multiplier) || 1.0
    };
  } else if (demoKey) {
    settings = PERSONAS_MAP[demoKey].settings;
  }

  // Slots
  let slots: TimetableSlot[] = [];
  if (slotsData && slotsData.length > 0) {
    slots = slotsData.map((s) => ({
      id: s.id,
      userId: s.user_id,
      subject: s.subject,
      dayOfWeek: s.day_of_week,
      startTime: s.start_time,
      endTime: s.end_time,
      room: s.room || '',
      teacherName: s.teacher_name,
      strictnessTag: s.strictness_tag,
      stakesTag: s.stakes_tag,
      weight: Number(s.weight),
      notes: s.notes
    }));
  } else if (demoKey) {
    slots = PERSONAS_MAP[demoKey].slots;
  }

  // Fetch Tasks
  const { data: tasksData } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId);

  let tasks: Task[] = [];
  if (tasksData && tasksData.length > 0) {
    tasks = tasksData.map((t) => {
      const computedStatus = calculateTaskStatus(
        t.due_date,
        Number(t.estimated_hours),
        Number(t.completion_percentage),
        settings.personalVelocityMultiplier
      );
      return {
        id: t.id,
        userId: t.user_id,
        title: t.title,
        description: t.description,
        slotId: t.slot_id,
        dueDate: t.due_date,
        estimatedHours: Number(t.estimated_hours),
        completionPercentage: Number(t.completion_percentage),
        taskType: t.task_type,
        status: t.status === 'completed' ? 'completed' : computedStatus,
        createdAt: t.created_at,
        completedAt: t.completed_at,
        renegotiatedCount: Number(t.renegotiated_count || 0),
        lastRenegotiatedAt: t.last_renegotiated_at
      };
    });
  } else if (demoKey) {
    tasks = PERSONAS_MAP[demoKey].tasks;
  }

  // Fetch Evidence Log
  const { data: evData } = await supabase
    .from('evidence_log')
    .select('*')
    .eq('user_id', userId);

  let evidenceEntries: EvidenceEntry[] = [];
  if (evData && evData.length > 0) {
    evidenceEntries = evData.map((e) => ({
      id: e.id,
      userId: e.user_id,
      taskId: e.task_id,
      taskTitle: e.task_title,
      subject: e.subject,
      teacherName: e.teacher_name,
      predictedScenario: e.predicted_scenario,
      actualOutcome: e.actual_outcome,
      wasOnTime: e.was_on_time,
      accuracyRating: Number(e.accuracy_rating),
      dateLogged: e.date_logged,
      userNotes: e.user_notes
    }));
  } else if (demoKey) {
    evidenceEntries = PERSONAS_MAP[demoKey].evidenceEntries;
  }

  return { profile, settings, slots, tasks, evidenceEntries };
}