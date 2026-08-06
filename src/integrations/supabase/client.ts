import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mbtfxnnnqlbhduqddvmw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1idGZ4bm5ucWxiaGR1cWRkdm13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMTExNjUsImV4cCI6MjEwMTU4NzE2NX0.6QmzDqFU4WW3rrau5EPhKJGhT23SVrdkigwZlSV_-c4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);