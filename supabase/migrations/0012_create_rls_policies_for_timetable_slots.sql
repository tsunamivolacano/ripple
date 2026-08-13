DO $$ BEGIN
  CREATE POLICY "Users can view own timetable slots" ON public.timetable_slots FOR SELECT TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own timetable slots" ON public.timetable_slots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own timetable slots" ON public.timetable_slots FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can delete own timetable slots" ON public.timetable_slots FOR DELETE TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "Service role has full access" ON public.timetable_slots FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;