-- Create user_activity_logs table
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  item_type TEXT,
  item_id TEXT,
  item_title TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT ON TABLE public.user_activity_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_activity_logs TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action_type ON public.user_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON public.user_activity_logs(created_at);

-- RLS Policies
CREATE POLICY "Users can view their own activity logs" ON public.user_activity_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs" ON public.user_activity_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can access all activity logs" ON public.user_activity_logs
  FOR ALL TO service_role USING (true);