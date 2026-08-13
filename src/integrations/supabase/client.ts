import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mbtfxnnnqlbhduqddvmw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_3WuXe4l8p6fut22s8RFZTg_FNHhhz8o";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);