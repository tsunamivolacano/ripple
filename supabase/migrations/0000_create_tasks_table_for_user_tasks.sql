CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('academic', 'personal')),
  status TEXT NOT NULL CHECK (status IN ('manageable', 'tight', 'critical', 'too_late', 'completed', 'renegotiated')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMP WITH TIME ZONE,
  estimated_hours NUMERIC NOT NULL,
  completion_percentage NUMERIC DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  renegotiated_count INTEGER DEFAULT 0,
  last_renegotiated TIMESTAMP WITH TIME ZONE,
  has_deadline BOOLEAN DEFAULT true,
  category TEXT NOT NULL CHECK (category IN ('academic', 'personal'))
);