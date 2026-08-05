-- -----------------------------------------------------------------------------
-- RIPPLE SUPABASE DATABASE SCHEMA, DATA API GRANTS, RLS POLICIES & SEED DATA
-- -----------------------------------------------------------------------------

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'student',
  intensity_mode TEXT DEFAULT 'standard',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grants & RLS for profiles
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2. Timetable Slots Table
CREATE TABLE IF NOT EXISTS public.timetable_slots (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT,
  teacher_name TEXT NOT NULL,
  strictness_tag TEXT NOT NULL,
  stakes_tag TEXT NOT NULL,
  weight INTEGER DEFAULT 20,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grants & RLS for timetable_slots
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.timetable_slots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.timetable_slots TO service_role;
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own timetable slots" ON public.timetable_slots FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own timetable slots" ON public.timetable_slots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own timetable slots" ON public.timetable_slots FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own timetable slots" ON public.timetable_slots FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slot_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  estimated_hours NUMERIC DEFAULT 1.0,
  completion_percentage INTEGER DEFAULT 0,
  task_type TEXT DEFAULT 'problem_set',
  status TEXT DEFAULT 'manageable',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  renegotiated_count INTEGER DEFAULT 0,
  last_renegotiated_at TIMESTAMP WITH TIME ZONE
);

-- Grants & RLS for tasks
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tasks" ON public.tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Evidence Log Table
CREATE TABLE IF NOT EXISTS public.evidence_log (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id TEXT NOT NULL,
  task_title TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  predicted_scenario TEXT NOT NULL,
  actual_outcome TEXT NOT NULL,
  was_on_time BOOLEAN DEFAULT true,
  accuracy_rating INTEGER DEFAULT 5,
  date_logged TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_notes TEXT
);

-- Grants & RLS for evidence_log
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.evidence_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.evidence_log TO service_role;
ALTER TABLE public.evidence_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own evidence entries" ON public.evidence_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own evidence entries" ON public.evidence_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own evidence entries" ON public.evidence_log FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own evidence entries" ON public.evidence_log FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. Procrastination Debt Table
CREATE TABLE IF NOT EXISTS public.procrastination_debt (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  total_hours_behind NUMERIC DEFAULT 0,
  missed_deadlines_count INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  compounding_score INTEGER DEFAULT 0,
  weekly_debt_trend JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grants & RLS for procrastination_debt
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.procrastination_debt TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.procrastination_debt TO service_role;
ALTER TABLE public.procrastination_debt ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own debt record" ON public.procrastination_debt FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own debt record" ON public.procrastination_debt FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own debt record" ON public.procrastination_debt FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Auto profile trigger on user creation
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, intensity_mode)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'role', 'student'),
    COALESCE(new.raw_user_meta_data ->> 'intensity_mode', 'standard')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();