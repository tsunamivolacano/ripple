import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mbtfxnnnqlbhduqddvmw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_3WuXe4l8p6fut22s8RFZTg_FNHhhz8o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getCurrentUserId = async () => {
  const user = await getCurrentUser();
  return user?.id;
};