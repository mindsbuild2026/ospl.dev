-- Migration: Fix Moderation System Functions
-- Fixes type-casting bug in reject_prompt and adds prompt_type_id restoration in restore_rejected_prompt

BEGIN;

-- 1. Fix reject_prompt function (replace invalid CAST on prompt_type with prompt_type_id)
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
    v_prompt_row.prompt_type_id, -- Fixed: use prompt_type_id directly, no invalid CAST
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


-- 2. Fix restore_rejected_prompt function (restore prompt_type_id)
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

  -- Create new prompt entry with pending status, copying prompt_type_id
  INSERT INTO prompts (
    slug,
    title,
    short_description,
    description,
    category_id,
    prompt_type_id, -- Added
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
    v_rejected_row.prompt_type_id, -- Added
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

-- 3. Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';

COMMIT;
