-- ============================================================================
-- PROMPTHUB MIGRATION 007: ADMIN DELETE APPROVED PROMPTS
-- ============================================================================
-- Allows Administrators to permanently delete any prompt (including approved)
-- along with all associated/linked records across all backend tables.
-- ============================================================================

BEGIN;

-- 1. Ensure RLS Policy allows Admins to delete any prompt in prompts table
DROP POLICY IF EXISTS "Admins can delete any prompt" ON public.prompts;
CREATE POLICY "Admins can delete any prompt" ON public.prompts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.authors 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- 2. Create RPC Function to safely & completely delete any prompt by an Admin
CREATE OR REPLACE FUNCTION delete_approved_prompt(
  p_prompt_id UUID,
  p_admin_id UUID
)
RETURNS jsonb AS $$
DECLARE
  v_is_admin BOOLEAN := FALSE;
  v_prompt_title TEXT;
  v_result jsonb;
BEGIN
  -- Verify caller is an admin (by is_admin flag or reputation >= 5000)
  SELECT EXISTS (
    SELECT 1 FROM public.authors 
    WHERE (id = p_admin_id OR user_id = auth.uid()) 
    AND (COALESCE(is_admin, false) = true OR COALESCE(reputation, 0) >= 5000)
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Permission denied: Only administrators can delete prompts'
    );
  END IF;

  -- Get prompt title for audit log
  SELECT title INTO v_prompt_title FROM public.prompts WHERE id = p_prompt_id;

  IF v_prompt_title IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Prompt not found'
    );
  END IF;

  -- Log action in moderation_logs before deletion
  INSERT INTO public.moderation_logs (
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
    'deleted',
    'approved',
    'deleted',
    'Permanently deleted by Admin',
    p_admin_id,
    NOW(),
    jsonb_build_object('deleted_title', v_prompt_title)
  );

  -- Explicit cleanup of any linked tables if ON DELETE CASCADE isn't set on custom tables
  DELETE FROM public.prompt_tags WHERE prompt_id = p_prompt_id;
  DELETE FROM public.prompt_ai_platforms WHERE prompt_id = p_prompt_id;
  DELETE FROM public.prompt_collections WHERE prompt_id = p_prompt_id;
  DELETE FROM public.prompt_variables WHERE prompt_id = p_prompt_id;
  DELETE FROM public.prompt_proof_items WHERE prompt_id = p_prompt_id;
  DELETE FROM public.prompt_version_history WHERE prompt_id = p_prompt_id;
  DELETE FROM public.prompt_usage_instructions WHERE prompt_id = p_prompt_id;
  DELETE FROM public.prompt_test_cases WHERE prompt_id = p_prompt_id;
  DELETE FROM public.prompt_examples WHERE prompt_id = p_prompt_id;
  DELETE FROM public.prompt_environmental_metrics WHERE prompt_id = p_prompt_id;
  DELETE FROM public.prompt_ai_validations WHERE prompt_id = p_prompt_id;
  DELETE FROM public.prompt_assets WHERE prompt_id = p_prompt_id;
  DELETE FROM public.prompt_workflow_steps WHERE prompt_id = p_prompt_id;
  DELETE FROM public.prompt_metrics WHERE prompt_id = p_prompt_id;
  DELETE FROM public.prompt_analytics WHERE prompt_id = p_prompt_id;
  DELETE FROM public.saved_prompts WHERE prompt_id = p_prompt_id;
  DELETE FROM public.ratings WHERE prompt_id = p_prompt_id;
  DELETE FROM public.moderation_queue WHERE prompt_id = p_prompt_id;

  -- Delete primary prompt row
  DELETE FROM public.prompts WHERE id = p_prompt_id;

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Prompt and all linked data permanently deleted from backend',
    'prompt_id', p_prompt_id
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
