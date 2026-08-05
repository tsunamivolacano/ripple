import { supabase } from '@/integrations/supabase/client';
import { ALL_PERSONAS } from '@/data/ripplePersonaData';

export async function ensureDemoUserAndData(personaId: string, email: string, password: string, fullName: string, role: string) {
  // Try to sign in first
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (!signInError && signInData.user) {
    return signInData.user;
  }

  // If user does not exist, create the account
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role
      }
    }
  });

  if (signUpError) {
    throw signUpError;
  }

  const user = signUpData.user;
  if (!user) {
    throw new Error('Failed to create demo user account');
  }

  // Seed demo data for this user in Supabase
  const persona = ALL_PERSONAS.find(p => p.id === personaId);
  if (!persona) return user;

  // Insert profile
  await supabase.from('profiles').upsert({
    id: user.id,
    full_name: persona.name,
    role: persona.role,
    intensity_mode: persona.settings.intensityMode,
    velocity_multiplier: persona.settings.personalVelocityMultiplier
  });

  // Insert slots
  const slotMap: Record<string, string> = {};
  for (const s of persona.slots) {
    const { data: insertedSlot } = await supabase
      .from('timetable_slots')
      .insert({
        user_id: user.id,
        subject: s.subject,
        day_of_week: s.dayOfWeek,
        start_time: s.startTime,
        end_time: s.endTime,
        room: s.room,
        teacher_name: s.teacherName,
        strictness_tag: s.strictnessTag,
        stakes_tag: s.stakesTag,
        weight: s.weight,
        notes: s.notes
      })
      .select()
      .single();

    if (insertedSlot) {
      slotMap[s.id] = insertedSlot.id;
    }
  }

  // Insert tasks
  for (const t of persona.tasks) {
    const mappedSlotId = t.slotId ? slotMap[t.slotId] || null : null;
    await supabase.from('tasks').insert({
      user_id: user.id,
      title: t.title,
      description: t.description || '',
      slot_id: mappedSlotId,
      due_date: t.dueDate,
      estimated_hours: t.estimatedHours,
      completion_percentage: t.completionPercentage,
      task_type: t.taskType,
      status: t.status
    });
  }

  // Insert evidence
  for (const e of persona.evidenceEntries) {
    await supabase.from('evidence_log').insert({
      user_id: user.id,
      task_title: e.taskTitle,
      subject: e.subject,
      teacher_name: e.teacherName,
      predicted_scenario: e.predictedScenario,
      actual_outcome: e.actualOutcome,
      was_on_time: e.wasOnTime,
      accuracy_rating: e.accuracyRating,
      user_notes: e.userNotes || ''
    });
  }

  // Re-authenticate if necessary
  const { data: finalAuth } = await supabase.auth.signInWithPassword({ email, password });
  return finalAuth?.user || user;
}