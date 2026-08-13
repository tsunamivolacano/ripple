CREATE TABLE IF NOT EXISTS public.evidence_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  task_title TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  predicted_scenario TEXT,
  actual_outcome TEXT,
  was_on_time BOOLEAN DEFAULT false,
  accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  date_logged TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);