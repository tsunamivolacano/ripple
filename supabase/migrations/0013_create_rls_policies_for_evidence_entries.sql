DO $$ BEGIN
  CREATE POLICY "Users can view own evidence entries" ON public.evidence_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own evidence entries" ON public.evidence_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own evidence entries" ON public.evidence_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can delete own evidence entries" ON public.evidence_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "Service role has full access" ON public.evidence_entries FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;