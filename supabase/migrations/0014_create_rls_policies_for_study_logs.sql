DO $$ BEGIN
  CREATE POLICY "Users can view own study logs" ON public.study_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own study logs" ON public.study_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own study logs" ON public.study_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can delete own study logs" ON public.study_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "Service role has full access" ON public.study_logs FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;