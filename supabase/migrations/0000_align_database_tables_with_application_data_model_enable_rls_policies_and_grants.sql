-- Enable RLS and setup policies for tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop restricting check constraint on tasks.type if any so specific task types (problem_set, revision, essay, etc.) work seamlessly
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_type_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;

-- Add any missing columns to tasks table for full sync
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS slot_id text,
  ADD COLUMN IF NOT EXISTS task_type text,
  ADD COLUMN IF NOT EXISTS reminders jsonb,
  ADD COLUMN IF NOT EXISTS recurrence jsonb;

-- Ensure tasks RLS policies exist
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role has full access to tasks" ON public.tasks;
CREATE POLICY "Service role has full access to tasks" ON public.tasks FOR ALL TO service_role USING (true);

-- Ensure profiles RLS policies exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Service role has full access to profiles" ON public.profiles;
CREATE POLICY "Service role has full access to profiles" ON public.profiles FOR ALL TO service_role USING (true);

-- Explicit Grants for Data API
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tasks TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.timetable_slots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.timetable_slots TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.study_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.study_logs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.evidence_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.evidence_entries TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.procrastination_debt TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.procrastination_debt TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_settings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notification_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notification_settings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.calendar_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.calendar_events TO service_role;

-- Ensure profiles exist for all existing auth.users
INSERT INTO public.profiles (id, email, name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'first_name', split_part(email, '@', 1)), 
  'student'
FROM auth.users
ON CONFLICT (id) DO NOTHING;