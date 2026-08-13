CREATE TABLE IF NOT EXISTS public.timetable_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT,
  teacher_name TEXT,
  strictness_tag TEXT,
  stakes_tag TEXT,
  weight NUMERIC DEFAULT 100,
  reminders JSONB,
  recurrence JSONB,
  specific_date TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);