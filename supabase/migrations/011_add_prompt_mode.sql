-- ============================================================================
-- PROMPTHUB MIGRATION 011: ADD CANONICAL PROMPT_MODE FIELD & FIX AUDIT TRIGGER
-- ============================================================================
-- Adds explicit `prompt_mode` column to `public.prompts` table with constraint
-- ('casual' | 'developer_pro') and patches `audit_prompt_changes()` to handle
-- missing request.headers parameter gracefully when running SQL scripts directly.
-- ============================================================================

BEGIN;

-- 1. Patch `audit_prompt_changes()` trigger function to use `current_setting('request.headers', true)`
--    This prevents PostgreSQL error 42704 ("unrecognized configuration parameter 'request.headers'")
--    when updating or inserting records directly in the Supabase SQL Editor or migration scripts.
CREATE OR REPLACE FUNCTION audit_prompt_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    table_name, record_id, action, old_data, new_data, 
    user_id, ip_address, user_agent
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    auth.uid(),
    inet_client_addr(),
    CASE 
      WHEN current_setting('request.headers', true) IS NOT NULL AND current_setting('request.headers', true) != '' 
      THEN current_setting('request.headers', true)::json->>'user-agent'
      ELSE NULL
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add `prompt_mode` column if not present
ALTER TABLE public.prompts
ADD COLUMN IF NOT EXISTS prompt_mode text;

-- 3. Safe Backfill Strategy based on existing structure
UPDATE public.prompts
SET prompt_mode = 'developer_pro'
WHERE prompt_mode IS NULL
  AND (
    creator_mode::text = 'developer'
    OR EXISTS (
      SELECT 1 FROM public.prompt_workflow_steps pws 
      WHERE pws.prompt_id = public.prompts.id
    )
  );

UPDATE public.prompts
SET prompt_mode = 'casual'
WHERE prompt_mode IS NULL;

-- 4. Enforce CHECK constraint
ALTER TABLE public.prompts
DROP CONSTRAINT IF EXISTS prompts_prompt_mode_check;

ALTER TABLE public.prompts
ADD CONSTRAINT prompts_prompt_mode_check
CHECK (prompt_mode IN ('casual', 'developer_pro'));

-- 5. Set default value for new rows
ALTER TABLE public.prompts
ALTER COLUMN prompt_mode SET DEFAULT 'casual';

-- 6. Performance Index
CREATE INDEX IF NOT EXISTS idx_prompts_prompt_mode
ON public.prompts(prompt_mode);

COMMIT;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
