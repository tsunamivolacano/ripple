DO $$ BEGIN
  CREATE POLICY "Admin can view all audit logs" ON public.admin_audit_logs FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Admin can insert audit logs" ON public.admin_audit_logs FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "Service role has full access" ON public.admin_audit_logs FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;