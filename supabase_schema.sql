-- RIPPLE Supabase Database Schema

-- 1. Create User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions for user_roles
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select_policy" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "user_roles_insert_policy" ON public.user_roles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 2. Create Permanent User Activity Logs Table
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  user_email TEXT NOT NULL DEFAULT 'anonymous',
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('auth', 'navigation', 'task', 'study', 'timer', 'timetable', 'evidence', 'settings', 'chat', 'error')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page_route TEXT,
  session_id TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_details TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Grant Data API access
GRANT SELECT, INSERT ON TABLE public.user_activity_logs TO authenticated;
GRANT SELECT, INSERT ON TABLE public.user_activity_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_activity_logs TO service_role;

ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users and anon clients to log activities securely
CREATE POLICY "user_activity_logs_insert_policy" ON public.user_activity_logs
FOR INSERT WITH CHECK (true);

CREATE POLICY "user_activity_logs_select_policy" ON public.user_activity_logs
FOR SELECT TO authenticated USING (user_id = auth.uid()::text OR user_email = auth.jwt() ->> 'email');

-- Indexes for efficient querying by user, event, timestamp, and type
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_email ON public.user_activity_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_activity_logs_event_type ON public.user_activity_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON public.user_activity_logs(timestamp DESC);

-- 3. Create Scheduled Notifications Queue Table
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('task', 'class', 'overdue')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  trigger_time TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_offset TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant Data API access
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.scheduled_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.scheduled_notifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.scheduled_notifications TO service_role;

ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_insert_policy" ON public.scheduled_notifications
FOR INSERT WITH CHECK (true);

CREATE POLICY "notifications_select_policy" ON public.scheduled_notifications
FOR SELECT USING (true);

CREATE POLICY "notifications_update_policy" ON public.scheduled_notifications
FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_notifications_user_item ON public.scheduled_notifications(user_id, item_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status_trigger ON public.scheduled_notifications(status, trigger_time);