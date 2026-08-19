-- ============================================================================
-- PRODUCTION MODERATION SYSTEM MIGRATION
-- ============================================================================
-- Complete migration script for deploying the moderation system
-- Compatible with Supabase / PostgreSQL
-- Safe for production with rollback capabilities
-- 
-- Execution Order:
--   1. Review all changes
--   2. Backup the database
--   3. Execute this entire script
--   4. Test the admin moderation dashboard
--   5. Deploy UI components
--
-- This migration:
--   - Adds moderation status tracking to prompts
--   - Creates rejected_prompts archive table
--   - Creates moderation_logs audit table
--   - Implements RLS policies for admin access
--   - Creates helper functions for moderation workflows
--   - Maintains full backward compatibility
-- ============================================================================

-- ============================================================================
-- TRANSACTION WRAPPER FOR SAFETY
-- ============================================================================
BEGIN;

-- ============================================================================
-- PHASE 1: ENSURE EXTENSIONS ARE AVAILABLE
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PHASE 2: VERIFY OR CREATE ENUM TYPES
-- ============================================================================

-- Check if moderation_status enum exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'moderation_status' AND typtype = 'e'
  ) THEN
    CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END
$$;

-- ============================================================================
-- PHASE 3: ALTER PROMPTS TABLE TO ADD MODERATION FIELDS
-- ============================================================================

-- Ensure moderation_status column exists with DEFAULT 'pending'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompts' AND column_name = 'moderation_status'
  ) THEN
    ALTER TABLE prompts 
    ADD COLUMN moderation_status moderation_status DEFAULT 'pending' NOT NULL;
  END IF;
END
$$;

-- Add submitted_at timestamp for moderation queue tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompts' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE prompts 
    ADD COLUMN submitted_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END
$$;

-- Add approved_at timestamp for approval tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompts' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE prompts 
    ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;
END
$$;

-- Add approved_by foreign key to track which admin approved
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompts' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE prompts 
    ADD COLUMN approved_by UUID REFERENCES authors(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- ============================================================================
-- PHASE 4: CREATE INDEXES ON PROMPTS FOR MODERATION QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_prompts_moderation_status 
ON prompts(moderation_status);

CREATE INDEX IF NOT EXISTS idx_prompts_submitted_at 
ON prompts(submitted_at DESC) 
WHERE moderation_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_prompts_approved_at 
ON prompts(approved_at DESC) 
WHERE moderation_status = 'approved';

CREATE INDEX IF NOT EXISTS idx_prompts_moderation_status_created 
ON prompts(moderation_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompts_author_moderation 
ON prompts(author_id, moderation_status);

-- ============================================================================
-- PHASE 5: ADD is_admin COLUMN TO AUTHORS TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'authors' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE authors 
    ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
    
    CREATE INDEX idx_authors_is_admin 
    ON authors(is_admin) 
    WHERE is_admin = TRUE;
  END IF;
END
$$;

-- ============================================================================
-- PHASE 6: CREATE REJECTED_PROMPTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rejected_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_prompt_id UUID NOT NULL,
  author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  tags TEXT[],
  parameters JSONB,
  examples JSONB,
  prompt_type_id UUID REFERENCES prompt_types(id) ON DELETE SET NULL,
  image_url TEXT,
  visibility TEXT,
  metadata JSONB,
  system_prompt TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  expected_output TEXT,
  rejection_reason TEXT NOT NULL,
  rejected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rejected_by UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  original_created_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retained_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

-- ============================================================================
-- PHASE 7: CREATE INDEXES ON REJECTED_PROMPTS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_rejected_prompts_author_id 
ON rejected_prompts(author_id);

CREATE INDEX IF NOT EXISTS idx_rejected_prompts_rejected_at 
ON rejected_prompts(rejected_at DESC);

CREATE INDEX IF NOT EXISTS idx_rejected_prompts_original_prompt_id 
ON rejected_prompts(original_prompt_id);

DROP INDEX IF EXISTS idx_rejected_prompts_retained_until;

CREATE INDEX IF NOT EXISTS idx_rejected_prompts_retained_until
ON rejected_prompts(retained_until);

CREATE INDEX IF NOT EXISTS idx_rejected_prompts_author_original 
ON rejected_prompts(author_id, original_prompt_id);

-- ============================================================================
-- PHASE 8: CREATE MODERATION_LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'restored', 'deleted')),
  old_status moderation_status,
  new_status moderation_status,
  reason TEXT,
  performed_by UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- ============================================================================
-- PHASE 9: CREATE INDEXES ON MODERATION_LOGS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_moderation_logs_prompt_id 
ON moderation_logs(prompt_id);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_performed_at 
ON moderation_logs(performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_performed_by 
ON moderation_logs(performed_by);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_action 
ON moderation_logs(action);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_prompt_action 
ON moderation_logs(prompt_id, action);

-- ============================================================================
-- PHASE 10: ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE rejected_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PHASE 11: CREATE RLS POLICIES FOR REJECTED_PROMPTS
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authors can view their own rejected prompts" ON rejected_prompts;
DROP POLICY IF EXISTS "Admins can view all rejected prompts" ON rejected_prompts;

-- Policy: Authors see their own rejected prompts
CREATE POLICY "Authors can view their own rejected prompts" ON rejected_prompts
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT user_id FROM authors WHERE id = author_id
    )
  );

-- Policy: Admins see all rejected prompts
CREATE POLICY "Admins can view all rejected prompts" ON rejected_prompts
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM authors 
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );

-- Policy: Admins can delete rejected prompts (for cleanup)
CREATE POLICY "Admins can delete rejected prompts" ON rejected_prompts
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM authors 
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================================================
-- PHASE 12: CREATE RLS POLICIES FOR MODERATION_LOGS
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view moderation logs" ON moderation_logs;

CREATE POLICY "Admins can view moderation logs" ON moderation_logs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM authors 
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================================================
-- PHASE 13: UPDATE RLS POLICIES ON PROMPTS TABLE
-- ============================================================================

-- Drop and recreate policies to ensure proper moderation enforcement
DROP POLICY IF EXISTS "Public can view approved prompts" ON prompts;
DROP POLICY IF EXISTS "Authors can view their own prompts" ON prompts;
DROP POLICY IF EXISTS "Authors can insert prompts" ON prompts;
DROP POLICY IF EXISTS "Authors can update their own prompts" ON prompts;
DROP POLICY IF EXISTS "Authors can delete their own prompts" ON prompts;

-- Policy: Public visibility - only approved prompts
CREATE POLICY "Public can view approved prompts" ON prompts
  FOR SELECT 
  USING (moderation_status = 'approved');

-- Policy: Authors see their own prompts regardless of status
CREATE POLICY "Authors can view their own prompts" ON prompts
  FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM authors WHERE id = author_id));

-- Policy: Authors can insert new prompts
CREATE POLICY "Authors can insert prompts" ON prompts
  FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT user_id FROM authors WHERE id = author_id));

-- Policy: Authors can update their own non-rejected prompts
CREATE POLICY "Authors can update their own prompts" ON prompts
  FOR UPDATE 
  USING (
    auth.uid() IN (SELECT user_id FROM authors WHERE id = author_id)
    AND moderation_status != 'rejected'
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM authors WHERE id = author_id)
    AND moderation_status != 'rejected'
  );

-- Policy: Authors can delete their own prompts
CREATE POLICY "Authors can delete their own prompts" ON prompts
  FOR DELETE 
  USING (auth.uid() IN (SELECT user_id FROM authors WHERE id = author_id));

-- Policy: Admins can view all prompts
CREATE POLICY "Admins can view all prompts" ON prompts
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM authors 
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );

-- Policy: Admins can update moderation status
CREATE POLICY "Admins can update prompt moderation status" ON prompts
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM authors 
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM authors 
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================================================
-- PHASE 14: UPDATE RLS POLICIES FOR RELATED TABLES
-- ============================================================================

-- Update policies for dependent tables to respect moderation_status
-- These should only return data for approved prompts (or author's own prompts)

DROP POLICY IF EXISTS "Examples viewable if prompt is viewable" ON prompt_examples;
CREATE POLICY "Examples viewable if prompt is viewable" ON prompt_examples
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE id = prompt_id 
      AND (
        moderation_status = 'approved'
        OR auth.uid() IN (SELECT user_id FROM authors WHERE id = author_id)
      )
    )
  );

DROP POLICY IF EXISTS "Test cases viewable if prompt is viewable" ON prompt_test_cases;
CREATE POLICY "Test cases viewable if prompt is viewable" ON prompt_test_cases
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE id = prompt_id 
      AND (
        moderation_status = 'approved'
        OR auth.uid() IN (SELECT user_id FROM authors WHERE id = author_id)
      )
    )
  );

DROP POLICY IF EXISTS "Variables viewable if prompt is viewable" ON prompt_variables;
CREATE POLICY "Variables viewable if prompt is viewable" ON prompt_variables
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE id = prompt_id 
      AND (
        moderation_status = 'approved'
        OR auth.uid() IN (SELECT user_id FROM authors WHERE id = author_id)
      )
    )
  );

-- ============================================================================
-- PHASE 15: TRIGGER FUNCTIONS FOR AUTOMATIC LOGGING
-- ============================================================================

-- Drop existing trigger if present
DROP TRIGGER IF EXISTS trigger_log_prompt_submission ON prompts;

-- Function to log prompt submission
CREATE OR REPLACE FUNCTION log_prompt_submission()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO moderation_logs (
    prompt_id,
    action,
    old_status,
    new_status,
    performed_by,
    performed_at,
    metadata
  ) VALUES (
    NEW.id,
    'submitted',
    NULL,
    NEW.moderation_status,
    NEW.author_id,
    NEW.submitted_at,
    jsonb_build_object(
      'title', NEW.title,
      'category_id', NEW.category_id,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically log submissions
CREATE TRIGGER trigger_log_prompt_submission
  AFTER INSERT ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION log_prompt_submission();

-- ============================================================================
-- PHASE 16: MODERATION WORKFLOW FUNCTIONS
-- ============================================================================

-- Function to approve a prompt
DROP FUNCTION IF EXISTS approve_prompt(UUID, UUID);
CREATE OR REPLACE FUNCTION approve_prompt(
  p_prompt_id UUID,
  p_admin_id UUID
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_author_id UUID;
BEGIN
  -- Get author_id for the log
  SELECT author_id INTO v_author_id FROM prompts WHERE id = p_prompt_id;
  
  IF v_author_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Prompt not found'
    );
  END IF;

  -- Update prompt status
  UPDATE prompts
  SET 
    moderation_status = 'approved',
    approved_at = NOW(),
    approved_by = p_admin_id
  WHERE id = p_prompt_id;

  -- Log the action
  INSERT INTO moderation_logs (
    prompt_id,
    action,
    old_status,
    new_status,
    performed_by,
    performed_at,
    metadata
  ) VALUES (
    p_prompt_id,
    'approved',
    'pending',
    'approved',
    p_admin_id,
    NOW(),
    jsonb_build_object('approved_by_id', p_admin_id)
  );

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Prompt approved successfully',
    'prompt_id', p_prompt_id
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a prompt and archive it
DROP FUNCTION IF EXISTS reject_prompt(UUID, UUID, TEXT);
CREATE OR REPLACE FUNCTION reject_prompt(
  p_prompt_id UUID,
  p_admin_id UUID,
  p_rejection_reason TEXT
)
RETURNS jsonb AS $$
DECLARE
  v_prompt_row prompts%ROWTYPE;
  v_result jsonb;
BEGIN
  -- Get prompt data before archival
  SELECT * INTO v_prompt_row FROM prompts WHERE id = p_prompt_id;

  IF v_prompt_row IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Prompt not found'
    );
  END IF;

  -- Archive to rejected_prompts table
  INSERT INTO rejected_prompts (
    original_prompt_id,
    author_id,
    title,
    short_description,
    description,
    category_id,
    prompt_type_id,
    image_url,
    system_prompt,
    user_prompt,
    expected_output,
    rejection_reason,
    rejected_at,
    rejected_by,
    original_created_at,
    retained_until
  ) VALUES (
    p_prompt_id,
    v_prompt_row.author_id,
    v_prompt_row.title,
    v_prompt_row.short_description,
    v_prompt_row.description,
    v_prompt_row.category_id,
    CAST(v_prompt_row.prompt_type AS UUID),
    NULL,
    v_prompt_row.system_prompt,
    v_prompt_row.user_prompt,
    v_prompt_row.expected_output,
    p_rejection_reason,
    NOW(),
    p_admin_id,
    v_prompt_row.created_at,
    NOW() + INTERVAL '30 days'
  );

  -- Update prompt status to rejected
  UPDATE prompts
  SET moderation_status = 'rejected'
  WHERE id = p_prompt_id;

  -- Log the action
  INSERT INTO moderation_logs (
    prompt_id,
    action,
    old_status,
    new_status,
    reason,
    performed_by,
    performed_at,
    metadata
  ) VALUES (
    p_prompt_id,
    'rejected',
    'pending',
    'rejected',
    p_rejection_reason,
    p_admin_id,
    NOW(),
    jsonb_build_object(
      'rejection_reason', p_rejection_reason,
      'rejected_by_id', p_admin_id
    )
  );

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Prompt rejected and archived',
    'prompt_id', p_prompt_id
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore a rejected prompt
DROP FUNCTION IF EXISTS restore_rejected_prompt(UUID, UUID);
CREATE OR REPLACE FUNCTION restore_rejected_prompt(
  p_rejected_prompt_id UUID,
  p_admin_id UUID
)
RETURNS jsonb AS $$
DECLARE
  v_rejected_row rejected_prompts%ROWTYPE;
  v_new_prompt_id UUID;
  v_result jsonb;
BEGIN
  -- Get rejected prompt data
  SELECT * INTO v_rejected_row FROM rejected_prompts WHERE id = p_rejected_prompt_id;

  IF v_rejected_row IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Rejected prompt not found'
    );
  END IF;

  -- Create new prompt entry with pending status
  INSERT INTO prompts (
    slug,
    title,
    short_description,
    description,
    category_id,
    author_id,
    moderation_status,
    system_prompt,
    user_prompt,
    expected_output,
    submitted_at
  ) VALUES (
    v_rejected_row.title || '-restored-' || to_char(NOW(), 'YYYYMMDDHHmmss'),
    v_rejected_row.title,
    v_rejected_row.short_description,
    v_rejected_row.description,
    v_rejected_row.category_id,
    v_rejected_row.author_id,
    'pending',
    v_rejected_row.system_prompt,
    v_rejected_row.user_prompt,
    v_rejected_row.expected_output,
    NOW()
  )
  RETURNING id INTO v_new_prompt_id;

  -- Log the restore action
  INSERT INTO moderation_logs (
    prompt_id,
    action,
    old_status,
    new_status,
    performed_by,
    performed_at,
    metadata
  ) VALUES (
    v_new_prompt_id,
    'restored',
    'rejected',
    'pending',
    p_admin_id,
    NOW(),
    jsonb_build_object(
      'restored_from_rejected_id', p_rejected_prompt_id,
      'restored_by_id', p_admin_id
    )
  );

  -- Remove from rejected_prompts
  DELETE FROM rejected_prompts WHERE id = p_rejected_prompt_id;

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Prompt restored to pending status',
    'new_prompt_id', v_new_prompt_id
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to permanently delete a rejected prompt
DROP FUNCTION IF EXISTS delete_rejected_prompt(UUID, UUID);
CREATE OR REPLACE FUNCTION delete_rejected_prompt(
  p_rejected_prompt_id UUID,
  p_admin_id UUID
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  DELETE FROM rejected_prompts WHERE id = p_rejected_prompt_id;

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Rejected prompt permanently deleted',
    'rejected_prompt_id', p_rejected_prompt_id
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PHASE 17: CLEANUP FUNCTION FOR RETENTION POLICY
-- ============================================================================

DROP FUNCTION IF EXISTS cleanup_old_rejected_prompts();
CREATE OR REPLACE FUNCTION cleanup_old_rejected_prompts()
RETURNS TABLE(deleted_count INT) AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM rejected_prompts
  WHERE retained_until < NOW();
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  RETURN QUERY SELECT v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PHASE 18: MATERIALIZED VIEW OR FUNCTION FOR SEARCH
-- ============================================================================

-- Update search_prompt_cards function to ensure it respects moderation_status
-- This function likely already exists, so we verify it filters correctly

-- Note: Assuming search_prompt_cards exists from the original schema
-- It should include: WHERE p.moderation_status = 'approved'

-- ============================================================================
-- PHASE 19: SAMPLE DATA - ADMIN USER SETUP (OPTIONAL)
-- ============================================================================

-- To set an existing user as admin, uncomment and modify:
-- UPDATE authors 
-- SET is_admin = TRUE 
-- WHERE email = 'admin@example.com';

-- Or if using handle:
-- UPDATE authors 
-- SET is_admin = TRUE 
-- WHERE handle = '@admin';

-- ============================================================================
-- PHASE 20: FINAL VERIFICATION
-- ============================================================================

-- Verify all new columns exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompts' AND column_name = 'moderation_status') THEN
    RAISE EXCEPTION 'Failed: moderation_status column not found on prompts table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompts' AND column_name = 'submitted_at') THEN
    RAISE EXCEPTION 'Failed: submitted_at column not found on prompts table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'authors' AND column_name = 'is_admin') THEN
    RAISE EXCEPTION 'Failed: is_admin column not found on authors table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rejected_prompts') THEN
    RAISE EXCEPTION 'Failed: rejected_prompts table not found';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moderation_logs') THEN
    RAISE EXCEPTION 'Failed: moderation_logs table not found';
  END IF;
  
  RAISE NOTICE 'All moderation system components verified successfully';
END
$$;

-- ============================================================================
-- COMMIT TRANSACTION
-- ============================================================================
COMMIT;

-- ============================================================================
-- POST-DEPLOYMENT NOTES
-- ============================================================================

-- 1. To schedule automatic cleanup of old rejected prompts, run:
--    SELECT cron.schedule('cleanup_rejected_prompts', '0 2 * * *', 'SELECT cleanup_old_rejected_prompts()');
--
-- 2. To designate an admin user, run:
--    UPDATE authors SET is_admin = TRUE WHERE id = 'USER_ID_HERE';
--
-- 3. Deploy UI components:
--    - AdminModerationView.tsx
--    - ModerationQueueCard.tsx
--    - RejectedPromptCard.tsx
--    - ModerationStatusBadge.tsx
--    - AdminModerationPage.tsx
--    - moderationService.ts
--
-- 4. Add route: /admin/moderation (protected with admin check)
--
-- 5. Update PromptDetailView to show ModerationStatusBadge when viewing own prompts
--
-- 6. Test in development:
--    - Submit a prompt (should be pending)
--    - View admin dashboard (should be visible in Pending tab)
--    - Approve prompt (should be visible to public)
--    - Reject prompt (should be moved to Rejected tab)
--    - Restore prompt (should return to Pending)
--
-- ============================================================================

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

/*
BEGIN;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_log_prompt_submission ON prompts;

-- Drop functions
DROP FUNCTION IF EXISTS log_prompt_submission();
DROP FUNCTION IF EXISTS approve_prompt(UUID, UUID);
DROP FUNCTION IF EXISTS reject_prompt(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS restore_rejected_prompt(UUID, UUID);
DROP FUNCTION IF EXISTS delete_rejected_prompt(UUID, UUID);
DROP FUNCTION IF EXISTS cleanup_old_rejected_prompts();

-- Drop tables
DROP TABLE IF EXISTS moderation_logs;
DROP TABLE IF EXISTS rejected_prompts;

-- Drop indexes
DROP INDEX IF EXISTS idx_prompts_approved_at;
DROP INDEX IF EXISTS idx_prompts_submitted_at;
DROP INDEX IF EXISTS idx_prompts_moderation_status;
DROP INDEX IF EXISTS idx_prompts_moderation_status_created;
DROP INDEX IF EXISTS idx_prompts_author_moderation;
DROP INDEX IF EXISTS idx_authors_is_admin;

-- Drop enum
DROP TYPE IF EXISTS moderation_status;

-- Remove columns from prompts
ALTER TABLE prompts DROP COLUMN IF EXISTS approved_by;
ALTER TABLE prompts DROP COLUMN IF EXISTS approved_at;
ALTER TABLE prompts DROP COLUMN IF EXISTS submitted_at;
ALTER TABLE prompts DROP COLUMN IF EXISTS moderation_status;

-- Remove column from authors
ALTER TABLE authors DROP COLUMN IF EXISTS is_admin;

-- Restore original RLS policies on prompts
DROP POLICY IF EXISTS "Public can view approved prompts" ON prompts;
DROP POLICY IF EXISTS "Authors can view their own prompts" ON prompts;
DROP POLICY IF EXISTS "Authors can insert prompts" ON prompts;
DROP POLICY IF EXISTS "Authors can update their own prompts" ON prompts;
DROP POLICY IF EXISTS "Authors can delete their own prompts" ON prompts;
DROP POLICY IF EXISTS "Admins can view all prompts" ON prompts;
DROP POLICY IF EXISTS "Admins can update prompt moderation status" ON prompts;

-- Restore original policies (if using original schema)
CREATE POLICY "Public can view all prompts" ON prompts
  FOR SELECT USING (true);

CREATE POLICY "Authors can insert prompts" ON prompts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own prompts" ON prompts
  FOR UPDATE USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own prompts" ON prompts
  FOR DELETE USING (auth.uid() = author_id);

COMMIT;
*/


-- ============================================================================
-- SCHEMA REPAIR: ADD PROMPT_TYPE_ID TO PROMPTS TABLE
-- ============================================================================

DO $$
BEGIN
  -- 1. Add prompt_type_id column if it does not exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompts' AND column_name = 'prompt_type_id'
  ) THEN
    ALTER TABLE prompts ADD COLUMN prompt_type_id UUID;
  END IF;

  -- 2. Add Foreign Key constraint to prompt_types table if it does not exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'prompts' AND constraint_name = 'fk_prompts_prompt_type'
  ) THEN
    ALTER TABLE prompts 
    ADD CONSTRAINT fk_prompts_prompt_type 
    FOREIGN KEY (prompt_type_id) REFERENCES prompt_types(id) 
    ON DELETE SET NULL;
  END IF;
END
$$;

-- 3. Create an index to make filtering prompts by type extremely fast
CREATE INDEX IF NOT EXISTS idx_prompts_prompt_type_id 
ON prompts(prompt_type_id);

-- 4. CRITICAL: Force Supabase/PostgREST to reload its schema cache
-- This resolves the "Could not find in schema cache" API error instantly.
NOTIFY pgrst, 'reload schema';


-- ============================================================================
-- SCHEMA FIX: REPAIR DIFFICULTY CHECK CONSTRAINT
-- ============================================================================

BEGIN;

-- 1. Safely drop the existing constraint
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_difficulty_check;

-- 2. Add difficulty column if it somehow got dropped, or ensure it is TEXT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompts' AND column_name = 'difficulty'
  ) THEN
    ALTER TABLE prompts ADD COLUMN difficulty TEXT;
  END IF;
END
$$;

-- 3. Set a safe default value for the column
ALTER TABLE prompts ALTER COLUMN difficulty SET DEFAULT 'beginner';

-- 4. Clean up any existing rows with invalid or null values
UPDATE prompts 
SET difficulty = 'beginner' 
WHERE difficulty IS NULL 
   OR difficulty NOT IN ('beginner', 'intermediate', 'advanced');

-- 5. Re-apply the check constraint cleanly (forces lowercase values)
ALTER TABLE prompts 
ADD CONSTRAINT prompts_difficulty_check 
CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'));

COMMIT;

ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_difficulty_check;

ALTER TABLE prompts 
ADD CONSTRAINT prompts_difficulty_check 
CHECK (lower(difficulty) IN ('beginner', 'intermediate', 'advanced'));

-- ============================================================================
-- CONSOLIDATED MODERATION SYSTEM FIXES
-- ============================================================================
BEGIN;

-- ============================================================================
-- FIX 1: FORCE PENDING STATUS ON ALL NEW SUBMISSIONS (BEFORE INSERT)
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_pending_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Force status to pending, no matter what the frontend payload says
  NEW.moderation_status := 'pending';
  
  -- Clear out any unauthorized approval timestamps on fresh inserts
  NEW.approved_at := NULL;
  NEW.approved_by := NULL;
  NEW.submitted_at := COALESCE(NEW.submitted_at, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enforce_pending_on_insert ON prompts;
CREATE TRIGGER trigger_enforce_pending_on_insert
  BEFORE INSERT ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION enforce_pending_on_insert();


-- ============================================================================
-- FIX 2: RUN LOGGING WITH PRIVILEGE BYPASS (AFTER INSERT)
-- ============================================================================

CREATE OR REPLACE FUNCTION log_prompt_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- We use SECURITY DEFINER to bypass RLS policies on the moderation_logs table
  INSERT INTO moderation_logs (
    prompt_id, 
    action, 
    new_status, 
    performed_by, 
    performed_at, 
    metadata
  ) VALUES (
    NEW.id, 
    'submitted', 
    NEW.moderation_status, 
    NEW.author_id, 
    NEW.submitted_at, 
    jsonb_build_object('title', NEW.title, 'category_id', NEW.category_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- <--- Crucial fix for RLS Error 42501

DROP TRIGGER IF EXISTS trigger_log_prompt_submission ON prompts;
CREATE TRIGGER trigger_log_prompt_submission
  AFTER INSERT ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION log_prompt_submission();


-- ============================================================================
-- CLEANUP: REFRESH THE SCHEMAS
-- ============================================================================

NOTIFY pgrst, 'reload schema';

COMMIT;

BEGIN;

-- 1. DROP the incorrect policies
DROP POLICY IF EXISTS "Authors can insert tags for their own prompts" ON prompt_tags;
DROP POLICY IF EXISTS "Authors can delete tags from their own prompts" ON prompt_tags;
DROP POLICY IF EXISTS "Anyone can view tags for approved or own prompts" ON prompt_tags;

-- 2. CORRECTED INSERT: Verify auth.uid() matches the author's user_id
CREATE POLICY "Authors can insert tags for their own prompts" ON prompt_tags
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_tags.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 3. CORRECTED DELETE: Verify auth.uid() matches the author's user_id
CREATE POLICY "Authors can delete tags from their own prompts" ON prompt_tags
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_tags.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 4. CORRECTED SELECT: View tags for approved prompts, OR pending prompts owned by the user
CREATE POLICY "Anyone can view tags for approved or own prompts" ON prompt_tags
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_tags.prompt_id 
      AND (
        prompts.moderation_status = 'approved' 
        OR auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
      )
    )
  );

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================================
-- RLS FIX: ALLOW AUTHORS TO LINK AI PLATFORMS TO THEIR PROMPTS
-- ============================================================================
BEGIN;

-- Ensure RLS is active on this junction table
ALTER TABLE prompt_ai_platforms ENABLE ROW LEVEL SECURITY;

-- 1. INSERT POLICY: Authors can only link AI platforms to their own prompts
DROP POLICY IF EXISTS "Authors can insert platforms for their own prompts" ON prompt_ai_platforms;
CREATE POLICY "Authors can insert platforms for their own prompts" ON prompt_ai_platforms
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_ai_platforms.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 2. DELETE POLICY: Authors can unlink AI platforms from their own prompts
DROP POLICY IF EXISTS "Authors can delete platforms from their own prompts" ON prompt_ai_platforms;
CREATE POLICY "Authors can delete platforms from their own prompts" ON prompt_ai_platforms
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_ai_platforms.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 3. SELECT POLICY: Anyone can view platforms for approved prompts; authors can see pending ones
DROP POLICY IF EXISTS "Anyone can view platforms for approved or own prompts" ON prompt_ai_platforms;
CREATE POLICY "Anyone can view platforms for approved or own prompts" ON prompt_ai_platforms
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_ai_platforms.prompt_id 
      AND (
        prompts.moderation_status = 'approved' 
        OR auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
      )
    )
  );

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';

COMMIT;


-- ============================================================================
-- RLS FIX: ALLOW AUTHORS TO LINK TECHNIQUES TO THEIR PROMPTS
-- ============================================================================
BEGIN;

-- Ensure RLS is active on this junction table
ALTER TABLE prompt_techniques_map ENABLE ROW LEVEL SECURITY;

-- 1. INSERT POLICY: Authors can only link techniques to their own prompts
DROP POLICY IF EXISTS "Authors can insert techniques for their own prompts" ON prompt_techniques_map;
CREATE POLICY "Authors can insert techniques for their own prompts" ON prompt_techniques_map
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_techniques_map.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 2. DELETE POLICY: Authors can unlink techniques from their own prompts
DROP POLICY IF EXISTS "Authors can delete techniques from their own prompts" ON prompt_techniques_map;
CREATE POLICY "Authors can delete techniques from their own prompts" ON prompt_techniques_map
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_techniques_map.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 3. SELECT POLICY: Anyone can view techniques for approved prompts; authors see pending ones
DROP POLICY IF EXISTS "Anyone can view techniques for approved or own prompts" ON prompt_techniques_map;
CREATE POLICY "Anyone can view techniques for approved or own prompts" ON prompt_techniques_map
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_techniques_map.prompt_id 
      AND (
        prompts.moderation_status = 'approved' 
        OR auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
      )
    )
  );

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================================
-- RLS FIX: ALLOW AUTHORS TO ADD RECOMMENDED MODELS TO THEIR PROMPTS
-- ============================================================================
BEGIN;

-- Ensure RLS is active on this table
ALTER TABLE prompt_recommended_models ENABLE ROW LEVEL SECURITY;

-- 1. INSERT POLICY: Authors can only add models for their own prompts
DROP POLICY IF EXISTS "Authors can insert models for their own prompts" ON prompt_recommended_models;
CREATE POLICY "Authors can insert models for their own prompts" ON prompt_recommended_models
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_recommended_models.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 2. DELETE POLICY: Authors can remove models from their own prompts
DROP POLICY IF EXISTS "Authors can delete models from their own prompts" ON prompt_recommended_models;
CREATE POLICY "Authors can delete models from their own prompts" ON prompt_recommended_models
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_recommended_models.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 3. SELECT POLICY: Anyone can view models for approved prompts; authors see pending ones
DROP POLICY IF EXISTS "Anyone can view models for approved or own prompts" ON prompt_recommended_models;
CREATE POLICY "Anyone can view models for approved or own prompts" ON prompt_recommended_models
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_recommended_models.prompt_id 
      AND (
        prompts.moderation_status = 'approved' 
        OR auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
      )
    )
  );

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================================
-- RLS FIX: ALLOW AUTHORS TO ADD VARIABLES TO THEIR PROMPTS
-- ============================================================================
BEGIN;

-- Ensure RLS is active on this table
ALTER TABLE prompt_variables ENABLE ROW LEVEL SECURITY;

-- 1. INSERT POLICY: Authors can only add variables for their own prompts
DROP POLICY IF EXISTS "Authors can insert variables for their own prompts" ON prompt_variables;
CREATE POLICY "Authors can insert variables for their own prompts" ON prompt_variables
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_variables.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 2. DELETE POLICY: Authors can remove variables from their own prompts
DROP POLICY IF EXISTS "Authors can delete variables from their own prompts" ON prompt_variables;
CREATE POLICY "Authors can delete variables from their own prompts" ON prompt_variables
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_variables.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 3. SELECT POLICY: Anyone can view variables for approved prompts; authors see pending ones
DROP POLICY IF EXISTS "Anyone can view variables for approved or own prompts" ON prompt_variables;
CREATE POLICY "Anyone can view variables for approved or own prompts" ON prompt_variables
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_variables.prompt_id 
      AND (
        prompts.moderation_status = 'approved' 
        OR auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
      )
    )
  );

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================================
-- RLS FIX: ALLOW AUTHORS TO ADD USAGE INSTRUCTIONS TO THEIR PROMPTS
-- ============================================================================
BEGIN;

-- Ensure RLS is active on this table
ALTER TABLE prompt_usage_instructions ENABLE ROW LEVEL SECURITY;

-- 1. INSERT POLICY: Authors can only add instructions for their own prompts
DROP POLICY IF EXISTS "Authors can insert instructions for their own prompts" ON prompt_usage_instructions;
CREATE POLICY "Authors can insert instructions for their own prompts" ON prompt_usage_instructions
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_usage_instructions.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 2. UPDATE POLICY: Authors can edit their own instructions
DROP POLICY IF EXISTS "Authors can update instructions for their own prompts" ON prompt_usage_instructions;
CREATE POLICY "Authors can update instructions for their own prompts" ON prompt_usage_instructions
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_usage_instructions.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_usage_instructions.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 3. DELETE POLICY: Authors can remove instructions from their own prompts
DROP POLICY IF EXISTS "Authors can delete instructions from their own prompts" ON prompt_usage_instructions;
CREATE POLICY "Authors can delete instructions from their own prompts" ON prompt_usage_instructions
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_usage_instructions.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 4. SELECT POLICY: Anyone can view instructions for approved prompts; authors see pending ones
DROP POLICY IF EXISTS "Anyone can view instructions for approved or own prompts" ON prompt_usage_instructions;
CREATE POLICY "Anyone can view instructions for approved or own prompts" ON prompt_usage_instructions
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_usage_instructions.prompt_id 
      AND (
        prompts.moderation_status = 'approved' 
        OR auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
      )
    )
  );

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================================
-- RLS FIX: ALLOW AUTHORS TO ADD EXAMPLES TO THEIR PROMPTS
-- ============================================================================
BEGIN;

-- Ensure RLS is active on this table
ALTER TABLE prompt_examples ENABLE ROW LEVEL SECURITY;

-- 1. INSERT POLICY: Authors can only add examples for their own prompts
DROP POLICY IF EXISTS "Authors can insert examples for their own prompts" ON prompt_examples;
CREATE POLICY "Authors can insert examples for their own prompts" ON prompt_examples
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_examples.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 2. UPDATE POLICY: Authors can edit their own examples
DROP POLICY IF EXISTS "Authors can update examples for their own prompts" ON prompt_examples;
CREATE POLICY "Authors can update examples for their own prompts" ON prompt_examples
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_examples.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_examples.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 3. DELETE POLICY: Authors can remove examples from their own prompts
DROP POLICY IF EXISTS "Authors can delete examples from their own prompts" ON prompt_examples;
CREATE POLICY "Authors can delete examples from their own prompts" ON prompt_examples
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_examples.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 4. SELECT POLICY: Anyone can view examples for approved prompts; authors see pending ones
DROP POLICY IF EXISTS "Anyone can view examples for approved or own prompts" ON prompt_examples;
CREATE POLICY "Anyone can view examples for approved or own prompts" ON prompt_examples
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_examples.prompt_id 
      AND (
        prompts.moderation_status = 'approved' 
        OR auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
      )
    )
  );

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';

COMMIT;

BEGIN;

-- ============================================================================
-- 1. SCHEMA FIX: ADD MISSING COLUMNS
-- ============================================================================
DO $$
BEGIN
  -- Add expected_result if it is missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompt_test_cases' AND column_name = 'expected_result'
  ) THEN
    ALTER TABLE prompt_test_cases ADD COLUMN expected_result TEXT;
  END IF;

  -- Add tested_model if it is missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompt_test_cases' AND column_name = 'tested_model'
  ) THEN
    ALTER TABLE prompt_test_cases ADD COLUMN tested_model TEXT;
  END IF;
END
$$;

-- ============================================================================
-- 2. RLS FIX: ALLOW AUTHORS TO MANAGE TEST CASES
-- ============================================================================

-- Ensure RLS is active
ALTER TABLE prompt_test_cases ENABLE ROW LEVEL SECURITY;

-- INSERT POLICY: Authors can only add test cases for their own prompts
DROP POLICY IF EXISTS "Authors can insert test cases for their own prompts" ON prompt_test_cases;
CREATE POLICY "Authors can insert test cases for their own prompts" ON prompt_test_cases
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_test_cases.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- UPDATE POLICY: Authors can edit their own test cases
DROP POLICY IF EXISTS "Authors can update test cases for their own prompts" ON prompt_test_cases;
CREATE POLICY "Authors can update test cases for their own prompts" ON prompt_test_cases
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_test_cases.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_test_cases.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- DELETE POLICY: Authors can remove test cases from their own prompts
DROP POLICY IF EXISTS "Authors can delete test cases from their own prompts" ON prompt_test_cases;
CREATE POLICY "Authors can delete test cases from their own prompts" ON prompt_test_cases
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_test_cases.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- SELECT POLICY: Anyone can view test cases for approved prompts; authors see pending ones
DROP POLICY IF EXISTS "Anyone can view test cases for approved or own prompts" ON prompt_test_cases;
CREATE POLICY "Anyone can view test cases for approved or own prompts" ON prompt_test_cases
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_test_cases.prompt_id 
      AND (
        prompts.moderation_status = 'approved' 
        OR auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
      )
    )
  );

-- ============================================================================
-- 3. RELOAD SCHEMA CACHE
-- ============================================================================
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================================
-- RLS FIX: ALLOW AUTHORS TO ADD VERSION HISTORY TO THEIR PROMPTS
-- ============================================================================
BEGIN;

-- Ensure RLS is active on this table
ALTER TABLE prompt_version_history ENABLE ROW LEVEL SECURITY;

-- 1. INSERT POLICY: Authors can only add version history for their own prompts
DROP POLICY IF EXISTS "Authors can insert versions for their own prompts" ON prompt_version_history;
CREATE POLICY "Authors can insert versions for their own prompts" ON prompt_version_history
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_version_history.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 2. UPDATE POLICY: Authors can edit their own version history (if they fix a typo in the changelog)
DROP POLICY IF EXISTS "Authors can update versions for their own prompts" ON prompt_version_history;
CREATE POLICY "Authors can update versions for their own prompts" ON prompt_version_history
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_version_history.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_version_history.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 3. DELETE POLICY: Authors can remove version history from their own prompts
DROP POLICY IF EXISTS "Authors can delete versions from their own prompts" ON prompt_version_history;
CREATE POLICY "Authors can delete versions from their own prompts" ON prompt_version_history
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_version_history.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

  BEGIN;

-- 1. Safely drop the old redundant 'title' column
ALTER TABLE prompt_test_cases DROP COLUMN IF EXISTS title;

-- 2. Ensure 'name' is marked as NOT NULL so you don't accidentally insert blank test cases
ALTER TABLE prompt_test_cases ALTER COLUMN name SET NOT NULL;
-- 1. Safely drop the old redundant 'title' column
ALTER TABLE prompt_test_cases DROP COLUMN IF EXISTS expected_output;

-- 2. Ensure 'name' is marked as NOT NULL so you don't accidentally insert blank test cases
ALTER TABLE prompt_test_cases ALTER COLUMN expected_result SET NOT NULL;

-- 3. Reload cache
NOTIFY pgrst, 'reload schema';

COMMIT;


-- 4. SELECT POLICY: Anyone can view versions for approved prompts; authors see pending ones
DROP POLICY IF EXISTS "Anyone can view versions for approved or own prompts" ON prompt_version_history;
CREATE POLICY "Anyone can view versions for approved or own prompts" ON prompt_version_history
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_version_history.prompt_id 
      AND (
        prompts.moderation_status = 'approved' 
        OR auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
      )
    )
  );

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';

COMMIT;
