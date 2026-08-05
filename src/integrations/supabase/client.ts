import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vmmnblegmigzjokycdhq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbW5ibGVnbWlnempva3ljZGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MDAxNDgsImV4cCI6MjEwMTQ3NjE0OH0.3JyyA6wwRsxbltbPM19f1FPC2SxWORMIlLdXOkaWNR0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);