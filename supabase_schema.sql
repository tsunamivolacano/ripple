-- RIPPLE Supabase Database Setup Schema

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Timetable Slots Table
CREATE TABLE IF NOT EXISTS public.timetable_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT,
  teacher_name TEXT NOT NULL,
  strictness_tag TEXT NOT NULL,
  stakes_tag TEXT NOT NULL,
  weight NUMERIC DEFAULT 25,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  slot_id UUID REFERENCES public.timetable_slots(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  estimated_hours NUMERIC DEFAULT 1.0,
  completion_percentage NUMERIC DEFAULT 0,
  task_type TEXT NOT NULL,
  category TEXT DEFAULT 'academic',
  status TEXT DEFAULT 'manageable',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  renegotiated_count INT DEFAULT 0,
  last_renegotiated_at TIMESTAMP WITH TIME ZONE
);

-- 4. Evidence Entries Table
CREATE TABLE IF NOT EXISTS public.evidence_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id TEXT,
  task_title TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  predicted_scenario TEXT NOT NULL,
  actual_outcome TEXT NOT NULL,
  was_on_time BOOLEAN DEFAULT true,
  accuracy_rating INT DEFAULT 5,
  date_logged TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_notes TEXT
);

-- 5. User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  intensity_mode TEXT DEFAULT 'standard',
  is_minor_profile BOOLEAN DEFAULT false,
  weekly_digest_only BOOLEAN DEFAULT false,
  personal_velocity_multiplier NUMERIC DEFAULT 1.0,
  has_completed_tutorial BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. User Debt Table
CREATE TABLE IF NOT EXISTS public.user_debt (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_hours_behind NUMERIC DEFAULT 0,
  missed_deadlines_count INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  compoundingScore INT DEFAULT 0,
  weekly_debt_trend JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DATA API GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.timetable_slots TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tasks TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.evidence_entries TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_settings TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_debt TO service_role, authenticated, anon;

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_debt ENABLE ROW LEVEL SECURITY;

-- PERMISSIVE POLICIES FOR PUBLIC & AUTHENTICATED ACCESS
CREATE POLICY "Public Profiles Read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "User Profiles All" ON public.profiles FOR ALL USING (true);

CREATE POLICY "Timetable Slots Access" ON public.timetable_slots FOR ALL USING (true);
CREATE POLICY "Tasks Access" ON public.tasks FOR ALL USING (true);
CREATE POLICY "Evidence Entries Access" ON public.evidence_entries FOR ALL USING (true);
CREATE POLICY "User Settings Access" ON public.user_settings FOR ALL USING (true);
CREATE POLICY "User Debt Access" ON public.user_debt FOR ALL USING (true);