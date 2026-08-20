-- Ensure unique constraint on procrastination_debt(user_id) if not present, so upsert works cleanly and seamlessly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'procrastination_debt_user_id_key'
  ) THEN
    -- If duplicate rows exist, keep only the latest one per user
    DELETE FROM public.procrastination_debt a
    USING public.procrastination_debt b
    WHERE a.user_id = b.user_id AND a.created_at < b.created_at;

    ALTER TABLE public.procrastination_debt ADD CONSTRAINT procrastination_debt_user_id_key UNIQUE (user_id);
  END IF;
END $$;