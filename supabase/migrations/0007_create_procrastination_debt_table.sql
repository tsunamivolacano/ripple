CREATE TABLE IF NOT EXISTS public.procrastination_debt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_hours_behind NUMERIC DEFAULT 0,
  missed_deadlines_count INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  compounding_score NUMERIC DEFAULT 0,
  weekly_debt_trend JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);