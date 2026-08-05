-- 1. PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'student',
  intensity_mode TEXT DEFAULT 'standard',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- 2. TIMETABLE SLOTS TABLE
CREATE TABLE public.timetable_slots (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- 3. TASKS TABLE
CREATE TABLE public.tasks (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_id TEXT REFERENCES public.timetable_slots(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  estimated_hours NUMERIC DEFAULT 1,
  completion_percentage INTEGER DEFAULT 0,
  task_type TEXT DEFAULT 'problem_set',
  status TEXT DEFAULT 'manageable',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  renegotiated_count INTEGER DEFAULT 0,
  last_renegotiated_at TIMESTAMP WITH TIME ZONE
);

-- 4. EVIDENCE LOG TABLE
CREATE TABLE public.evidence_log (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT,
  task_title TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  predicted_scenario TEXT,
  actual_outcome TEXT NOT NULL,
  was_on_time BOOLEAN DEFAULT TRUE,
  accuracy_rating INTEGER DEFAULT 5,
  date_logged TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_notes TEXT
);

-- 5. PROCRASTINATION DEBT TABLE
CREATE TABLE public.procrastination_debt (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_hours_behind NUMERIC DEFAULT 0,
  missed_deadlines_count INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  compounding_score INTEGER DEFAULT 0,
  weekly_debt_trend JSONB DEFAULT '[{"day": "Mon", "debtHours": 0}, {"day": "Tue", "debtHours": 0}, {"day": "Wed", "debtHours": 0}, {"day": "Thu", "debtHours": 0}, {"day": "Fri", "debtHours": 0}, {"day": "Sat", "debtHours": 0}, {"day": "Sun", "debtHours": 0}]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procrastination_debt ENABLE ROW LEVEL SECURITY;

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

-- RLS POLICIES (Users only see their own data)
CREATE POLICY "profiles_owner" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id);
CREATE POLICY "slots_owner" ON public.timetable_slots FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tasks_owner" ON public.tasks FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "evidence_owner" ON public.evidence_log FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "debt_owner" ON public.procrastination_debt FOR ALL TO authenticated USING (auth.uid() = user_id);

-- AUTOMATIC PROFILE CREATION ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, intensity_mode, email)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    COALESCE(new.raw_user_meta_data ->> 'role', 'student'),
    CASE 
      WHEN new.raw_user_meta_data ->> 'role' = 'corporate' THEN 'standard'
      ELSE 'coach'
    END,
    new.email
  );
  
  -- Initialize empty debt record
  INSERT INTO public.procrastination_debt (user_id) VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();