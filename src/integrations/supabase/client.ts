import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qhtuhgthmzrmqfxjjmcj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodHVoZ3RobXpybXFmeGpqbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MDI3NDEsImV4cCI6MjEwMTQ3ODc0MX0.Qq-ZDAlBYSLEUxxpxaD8Odn-m1JcjSBpA3npF8etTR0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);