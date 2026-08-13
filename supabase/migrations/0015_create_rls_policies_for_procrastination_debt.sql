DO $$ BEGIN
  CREATE POLICY "Users can view own debt" ON public.procrastination_debt FOR SELECT TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own debt" ON public.procrastination_debt FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own debt" ON public.procrastination_debt FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can delete own debt" ON public.procrastination_debt FOR DELETE TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "Service role has full access" ON public.procrastination_debt FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;