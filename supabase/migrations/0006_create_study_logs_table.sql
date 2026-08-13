CREATE TABLE IF NOT EXISTS public.study_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  topic TEXT,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT CHECK (source IN ('manual', 'timer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);