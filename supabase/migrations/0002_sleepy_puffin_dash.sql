-- Verify all table grants for authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tasks TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.timetable_slots TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.study_logs TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.evidence_entries TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_settings TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notification_settings TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.procrastination_debt TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.calendar_events TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.scheduled_notifications TO authenticated, service_role;