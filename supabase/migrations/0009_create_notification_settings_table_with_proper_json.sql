CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  task_reminders_enabled BOOLEAN DEFAULT true,
  class_reminders_enabled BOOLEAN DEFAULT true,
  default_task_reminders JSONB DEFAULT '["15m", "exact"]'::jsonb,
  default_class_reminders JSONB DEFAULT '["15m"]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);