DO $$ BEGIN
  CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can delete own settings" ON public.user_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "Service role has full access" ON public.user_settings FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;