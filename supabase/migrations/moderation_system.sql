-- ============================================================================
-- Moderation System Migration
-- ============================================================================
-- This migration adds a complete moderation workflow to the prompt platform.
-- Key features:
--   - Pending/Approved/Rejected status for prompts
--   - Rejected prompts archive with restoration capability
--   - Audit logging for all moderation actions
--   - RLS policies for admin access
--   - Retention management for old rejected prompts
-- ============================================================================

-- ============================================================================
-- PHASE 1: ALTER EXISTING TABLES
-- ============================================================================

-- Add moderation fields to prompts table if not already present
DO $$
BEGIN
  -- submitted_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompts' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE prompts ADD COLUMN submitted_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- approved_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompts' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE prompts ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;

  -- approved_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompts' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE prompts ADD COLUMN approved_by UUID REFERENCES authors(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index on submitted_at for efficient moderation queue queries
CREATE INDEX IF NOT EXISTS idx_prompts_submitted_at ON prompts(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_approved_at ON prompts(approved_at DESC);

-- ============================================================================
-- PHASE 2: CREATE REJECTED PROMPTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rejected_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_prompt_id UUID NOT NULL,  -- Reference to original prompt_id (not a foreign key, as it's deleted)
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

CREATE INDEX IF NOT EXISTS idx_rejected_prompts_author_id ON rejected_prompts(author_id);
CREATE INDEX IF NOT EXISTS idx_rejected_prompts_rejected_at ON rejected_prompts(rejected_at DESC);
CREATE INDEX IF NOT EXISTS idx_rejected_prompts_original_prompt_id ON rejected_prompts(original_prompt_id);
CREATE INDEX IF NOT EXISTS idx_rejected_prompts_retained_until ON rejected_prompts(retained_until);

ALTER TABLE rejected_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors can view their own rejected prompts" ON rejected_prompts
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Admins can view all rejected prompts" ON rejected_prompts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM authors 
      WHERE authors.id = (SELECT id FROM authors WHERE user_id = auth.uid()) 
      LIMIT 1
    )
    AND (SELECT is_admin FROM authors WHERE user_id = auth.uid() LIMIT 1) = TRUE
  );

-- ============================================================================
-- PHASE 3: CREATE MODERATION LOGS TABLE
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

CREATE INDEX IF NOT EXISTS idx_moderation_logs_prompt_id ON moderation_logs(prompt_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_performed_at ON moderation_logs(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_performed_by ON moderation_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_action ON moderation_logs(action);

ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view moderation logs" ON moderation_logs
  FOR SELECT USING (
    (SELECT is_admin FROM authors WHERE user_id = auth.uid() LIMIT 1) = TRUE
  );

-- ============================================================================
-- PHASE 4: ADD is_admin COLUMN TO authors TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'authors' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE authors ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
    CREATE INDEX IF NOT EXISTS idx_authors_is_admin ON authors(is_admin) WHERE is_admin = TRUE;
  END IF;
END $$;

-- ============================================================================
-- PHASE 5: UPDATE RLS POLICIES
-- ============================================================================

-- Drop and recreate the public select policy for prompts
DROP POLICY IF EXISTS "Public can view approved prompts" ON prompts;
DROP POLICY IF EXISTS "Authors can view their own prompts" ON prompts;

-- New policy: Public and authors can see approved prompts, authors can see their own regardless of status
CREATE POLICY "Visibility policy for prompts" ON prompts
  FOR SELECT USING (
    moderation_status = 'approved' 
    OR auth.uid() = author_id
  );

-- Add admin policy for prompts (admins can see all)
CREATE POLICY "Admins can view all prompts" ON prompts
  FOR SELECT USING (
    (SELECT is_admin FROM authors WHERE user_id = auth.uid() LIMIT 1) = TRUE
  );

-- Update UPDATE policy to allow admins to approve/reject
DROP POLICY IF EXISTS "Authors can update their own prompts" ON prompts;

CREATE POLICY "Authors can update their own prompts" ON prompts
  FOR UPDATE USING (auth.uid() = author_id AND moderation_status != 'rejected')
  WITH CHECK (auth.uid() = author_id AND moderation_status != 'rejected');

CREATE POLICY "Admins can update prompt moderation status" ON prompts
  FOR UPDATE USING ((SELECT is_admin FROM authors WHERE user_id = auth.uid() LIMIT 1) = TRUE)
  WITH CHECK ((SELECT is_admin FROM authors WHERE user_id = auth.uid() LIMIT 1) = TRUE);

-- ============================================================================
-- PHASE 6: TRIGGER FUNCTIONS FOR AUTOMATIC LOGGING
-- ============================================================================

-- Function to create moderation log entry on prompt submission
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
    'pending',
    NEW.author_id,
    NEW.submitted_at,
    jsonb_build_object('title', NEW.title)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_prompt_submission ON prompts;
CREATE TRIGGER trigger_log_prompt_submission
AFTER INSERT ON prompts
FOR EACH ROW
EXECUTE FUNCTION log_prompt_submission();

-- ============================================================================
-- PHASE 7: HELPER FUNCTIONS FOR MODERATION ACTIONS
-- ============================================================================

-- Function to approve a prompt
CREATE OR REPLACE FUNCTION approve_prompt(
  p_prompt_id UUID,
  p_admin_id UUID
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
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
  -- Get prompt data before deletion
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
    original_created_at
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
    v_prompt_row.created_at
  );

  -- Update prompt to rejected status first (before deletion logic)
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
    jsonb_build_object('rejection_reason', p_rejection_reason, 'rejected_by_id', p_admin_id)
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
    jsonb_build_object('restored_from_rejected_id', p_rejected_prompt_id, 'restored_by_id', p_admin_id)
  );

  -- Remove from rejected_prompts (optional - can keep for history)
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
-- PHASE 8: CLEANUP FUNCTION FOR RETENTION
-- ============================================================================

-- Function to clean up old rejected prompts based on retention period
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

-- Note: To schedule this function with pg_cron, run:
-- SELECT cron.schedule('cleanup_rejected_prompts', '0 2 * * *', 'SELECT cleanup_old_rejected_prompts()');

-- ============================================================================
-- PHASE 9: INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_prompts_moderation_status_created ON prompts(moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_author_moderation ON prompts(author_id, moderation_status);
CREATE INDEX IF NOT EXISTS idx_rejected_prompts_author_original ON rejected_prompts(author_id, original_prompt_id);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_prompts_title_full_text ON prompts USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_prompts_description_full_text ON prompts USING gin(to_tsvector('english', COALESCE(short_description, '')));

-- ============================================================================
-- PHASE 10: SEED ADMIN USER (OPTIONAL)
-- ============================================================================

-- This is commented out - uncomment and modify with actual admin GitHub ID and email
-- INSERT INTO authors (user_id, handle, name, is_admin) 
-- VALUES (
--   (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1),
--   'admin',
--   'Admin User',
--   TRUE
-- )
-- ON CONFLICT (user_id) DO UPDATE SET is_admin = TRUE;

-- ============================================================================
-- ROLLBACK STATEMENTS (for reference)
-- ============================================================================
/*
-- To rollback this migration, run these statements in reverse order:

DROP TRIGGER IF EXISTS trigger_log_prompt_submission ON prompts;
DROP FUNCTION IF EXISTS log_prompt_submission();
DROP FUNCTION IF EXISTS approve_prompt(UUID, UUID);
DROP FUNCTION IF EXISTS reject_prompt(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS restore_rejected_prompt(UUID, UUID);
DROP FUNCTION IF EXISTS delete_rejected_prompt(UUID, UUID);
DROP FUNCTION IF EXISTS cleanup_old_rejected_prompts();

DROP INDEX IF EXISTS idx_prompts_title_full_text;
DROP INDEX IF EXISTS idx_prompts_description_full_text;
DROP INDEX IF EXISTS idx_rejected_prompts_author_original;
DROP INDEX IF EXISTS idx_prompts_moderation_status_created;
DROP INDEX IF EXISTS idx_prompts_author_moderation;

DROP TABLE IF EXISTS moderation_logs;
DROP TABLE IF EXISTS rejected_prompts;

DROP INDEX IF EXISTS idx_prompts_approved_at;
DROP INDEX IF EXISTS idx_prompts_submitted_at;
DROP INDEX IF EXISTS idx_authors_is_admin;

ALTER TABLE prompts DROP COLUMN IF EXISTS approved_by;
ALTER TABLE prompts DROP COLUMN IF EXISTS approved_at;
ALTER TABLE prompts DROP COLUMN IF EXISTS submitted_at;

ALTER TABLE authors DROP COLUMN IF EXISTS is_admin;
*/
