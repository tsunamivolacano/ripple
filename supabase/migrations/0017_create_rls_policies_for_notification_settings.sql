DO $$ BEGIN
  CREATE POLICY "Users can view own notification settings" ON public.notification_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own notification settings" ON public.notification_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own notification settings" ON public.notification_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can delete own notification settings" ON public.notification_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "Service role has full access" ON public.notification_settings FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;