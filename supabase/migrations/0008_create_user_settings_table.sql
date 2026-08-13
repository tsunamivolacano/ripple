CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  intensity_mode TEXT DEFAULT 'standard' CHECK (intensity_mode IN ('coach', 'standard', 'doomsday')),
  is_minor_profile BOOLEAN DEFAULT false,
  weekly_digest_only BOOLEAN DEFAULT false,
  personal_velocity_multiplier NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);