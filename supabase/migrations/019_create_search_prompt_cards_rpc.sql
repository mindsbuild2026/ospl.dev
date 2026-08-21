-- ============================================================================
-- PROMPTHUB MIGRATION 019: COMPLETE RPCs, VIEWS & SCHEMA RELOAD
-- ============================================================================
-- Resolves PGRST205 (prompt_filter_options missing) and PGRST202 (search_prompt_cards missing)
-- as well as all moderation, reputation, and interaction RPC functions.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. VIEW: prompt_filter_options
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.prompt_filter_options CASCADE;
CREATE OR REPLACE VIEW public.prompt_filter_options AS
SELECT
  COALESCE(array_agg(DISTINCT pt.name ORDER BY pt.name), '{}') AS prompt_types,
  COALESCE(array_agg(DISTINCT p.difficulty ORDER BY p.difficulty), '{}') AS difficulties
FROM public.prompts p
LEFT JOIN public.prompt_types pt ON pt.id = p.prompt_type_id;

GRANT SELECT ON public.prompt_filter_options TO authenticated, anon;

-- ----------------------------------------------------------------------------
-- 2. RPC: search_prompt_cards
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.search_prompt_cards(text, uuid, text, uuid, text[], text, int, int);
DROP FUNCTION IF EXISTS public.search_prompt_cards;

CREATE OR REPLACE FUNCTION public.search_prompt_cards(
  p_search TEXT DEFAULT '',
  p_category_id UUID DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL,
  p_ai_platform_id UUID DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'trending',
  p_limit INT DEFAULT 60,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  short_description TEXT,
  category_name TEXT,
  subcategory_name TEXT,
  tags TEXT[],
  ai_platforms TEXT[],
  featured BOOLEAN,
  verified BOOLEAN,
  community_validated BOOLEAN,
  views INT,
  copies INT,
  bookmarks INT,
  rating NUMERIC,
  rating_count INT,
  has_proof BOOLEAN,
  success_rate NUMERIC,
  author_name TEXT,
  author_handle TEXT,
  author_avatar_url TEXT,
  author_verified BOOLEAN,
  trending_score NUMERIC,
  weekly_growth NUMERIC,
  prompt_mode TEXT,
  updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.slug,
    p.title,
    p.short_description,
    c.name AS category_name,
    sc.name AS subcategory_name,
    COALESCE(array_agg(DISTINCT t.slug) FILTER (WHERE t.slug IS NOT NULL), ARRAY[]::text[]) AS tags,
    COALESCE(array_agg(DISTINCT ap.slug) FILTER (WHERE ap.slug IS NOT NULL), ARRAY[]::text[]) AS ai_platforms,
    p.featured,
    p.verified,
    p.community_validated,
    COALESCE(pm.views, 0)::INT AS views,
    COALESCE(pm.copies, 0)::INT AS copies,
    COALESCE(pm.bookmarks, 0)::INT AS bookmarks,
    COALESCE(pm.rating_average, 0)::NUMERIC(10,2) AS rating,
    COALESCE(pm.rating_count, 0)::INT AS rating_count,
    COALESCE(pm.has_proof, false) AS has_proof,
    COALESCE(pm.success_rate, 0)::NUMERIC(10,2) AS success_rate,
    a.name AS author_name,
    a.handle AS author_handle,
    a.avatar_url AS author_avatar_url,
    a.verified AS author_verified,
    COALESCE(pm.trending_score, 0)::NUMERIC(10,2) AS trending_score,
    COALESCE(pm.weekly_growth, 0)::NUMERIC(10,2) AS weekly_growth,
    p.prompt_mode,
    p.updated_at,
    p.created_at
  FROM public.prompts p
  LEFT JOIN public.prompt_metrics pm ON pm.prompt_id = p.id
  LEFT JOIN public.authors a ON a.id = p.author_id
  LEFT JOIN public.categories c ON c.id = p.category_id
  LEFT JOIN public.subcategories sc ON sc.id = p.subcategory_id
  LEFT JOIN public.prompt_tags pt ON pt.prompt_id = p.id
  LEFT JOIN public.tags t ON t.id = pt.tag_id
  LEFT JOIN public.prompt_ai_platforms pap ON pap.prompt_id = p.id
  LEFT JOIN public.ai_platforms ap ON ap.id = pap.ai_platform_id
  WHERE
    (p.moderation_status = 'approved' OR auth.uid() = a.user_id OR EXISTS (SELECT 1 FROM public.authors WHERE user_id = auth.uid() AND is_admin = true))
    AND (p_search IS NULL OR p_search = '' OR p.title ILIKE '%' || p_search || '%' OR p.short_description ILIKE '%' || p_search || '%' OR coalesce(p.description, '') ILIKE '%' || p_search || '%')
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_difficulty IS NULL OR p.difficulty ILIKE p_difficulty OR p.difficulty_level ILIKE p_difficulty)
    AND (p_ai_platform_id IS NULL OR pap.ai_platform_id = p_ai_platform_id)
    AND (p_tags IS NULL OR EXISTS (
      SELECT 1 FROM public.prompt_tags pt2
      JOIN public.tags t2 ON pt2.tag_id = t2.id
      WHERE pt2.prompt_id = p.id AND (t2.slug = ANY(p_tags) OR t2.name = ANY(p_tags))
    ))
  GROUP BY
    p.id, p.slug, p.title, p.short_description, c.name, sc.name, p.featured, p.verified, p.community_validated,
    pm.views, pm.copies, pm.bookmarks, pm.rating_average, pm.rating_count, pm.has_proof, pm.success_rate,
    a.name, a.handle, a.avatar_url, a.verified, pm.trending_score, pm.weekly_growth, p.prompt_mode, p.updated_at, p.created_at
  ORDER BY
    CASE WHEN p_sort_by IN ('trending', 'Trending') THEN COALESCE(pm.trending_score, 0) END DESC,
    CASE WHEN p_sort_by IN ('newest', 'Newest') THEN p.created_at END DESC,
    CASE WHEN p_sort_by IN ('rating', 'Highest Rated') THEN COALESCE(pm.rating_average, 0) END DESC,
    CASE WHEN p_sort_by IN ('views', 'Most Viewed') THEN COALESCE(pm.views, 0) END DESC,
    CASE WHEN p_sort_by IN ('copies', 'Most Copied') THEN COALESCE(pm.copies, 0) END DESC,
    CASE WHEN p_sort_by IN ('bookmarks', 'Most Bookmarked') THEN COALESCE(pm.bookmarks, 0) END DESC,
    CASE WHEN p_sort_by = 'A-Z' THEN p.title END ASC,
    p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_prompt_cards TO authenticated, anon;

-- ----------------------------------------------------------------------------
-- 3. MODERATION & REPUTATION RPCs
-- ----------------------------------------------------------------------------

-- Function to approve a prompt
CREATE OR REPLACE FUNCTION public.approve_prompt(p_prompt_id UUID, p_admin_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE public.prompts
  SET moderation_status = 'approved', approved_at = NOW(), approved_by = p_admin_id
  WHERE id = p_prompt_id;

  INSERT INTO public.moderation_logs (prompt_id, action, old_status, new_status, performed_by, performed_at, metadata)
  VALUES (p_prompt_id, 'approved', 'pending', 'approved', p_admin_id, NOW(), jsonb_build_object('approved_by_id', p_admin_id));

  RETURN jsonb_build_object('success', true, 'message', 'Prompt approved successfully', 'prompt_id', p_prompt_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a prompt
CREATE OR REPLACE FUNCTION public.reject_prompt(p_prompt_id UUID, p_admin_id UUID, p_rejection_reason TEXT)
RETURNS JSONB AS $$
DECLARE
  v_prompt_row public.prompts%ROWTYPE;
BEGIN
  SELECT * INTO v_prompt_row FROM public.prompts WHERE id = p_prompt_id;
  IF v_prompt_row.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Prompt not found');
  END IF;

  INSERT INTO public.rejected_prompts (
    original_prompt_id, author_id, title, short_description, description, category_id,
    system_prompt, user_prompt, expected_output, rejection_reason, rejected_at, rejected_by, original_created_at, retained_until
  ) VALUES (
    p_prompt_id, v_prompt_row.author_id, v_prompt_row.title, v_prompt_row.short_description, v_prompt_row.description, v_prompt_row.category_id,
    v_prompt_row.system_prompt, coalesce(v_prompt_row.user_prompt, ''), v_prompt_row.expected_output, p_rejection_reason, NOW(), p_admin_id, v_prompt_row.created_at, NOW() + INTERVAL '30 days'
  );

  UPDATE public.prompts SET moderation_status = 'rejected' WHERE id = p_prompt_id;

  INSERT INTO public.moderation_logs (prompt_id, action, old_status, new_status, reason, performed_by, performed_at, metadata)
  VALUES (p_prompt_id, 'rejected', 'pending', 'rejected', p_rejection_reason, p_admin_id, NOW(), jsonb_build_object('rejection_reason', p_rejection_reason, 'rejected_by_id', p_admin_id));

  RETURN jsonb_build_object('success', true, 'message', 'Prompt rejected and archived', 'prompt_id', p_prompt_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore a rejected prompt
CREATE OR REPLACE FUNCTION public.restore_rejected_prompt(p_rejected_prompt_id UUID, p_admin_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_rejected_row public.rejected_prompts%ROWTYPE;
  v_new_prompt_id UUID;
BEGIN
  SELECT * INTO v_rejected_row FROM public.rejected_prompts WHERE id = p_rejected_prompt_id;
  IF v_rejected_row.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Rejected prompt not found');
  END IF;

  INSERT INTO public.prompts (
    slug, title, short_description, description, category_id, author_id, moderation_status, system_prompt, user_prompt, expected_output, submitted_at
  ) VALUES (
    v_rejected_row.title || '-restored-' || to_char(NOW(), 'YYYYMMDDHHmmss'),
    v_rejected_row.title, v_rejected_row.short_description, v_rejected_row.description, v_rejected_row.category_id, v_rejected_row.author_id,
    'pending', v_rejected_row.system_prompt, v_rejected_row.user_prompt, v_rejected_row.expected_output, NOW()
  ) RETURNING id INTO v_new_prompt_id;

  INSERT INTO public.moderation_logs (prompt_id, action, old_status, new_status, performed_by, performed_at, metadata)
  VALUES (v_new_prompt_id, 'restored', 'rejected', 'pending', p_admin_id, NOW(), jsonb_build_object('restored_from_rejected_id', p_rejected_prompt_id, 'restored_by_id', p_admin_id));

  DELETE FROM public.rejected_prompts WHERE id = p_rejected_prompt_id;
  RETURN jsonb_build_object('success', true, 'message', 'Prompt restored to pending status', 'new_prompt_id', v_new_prompt_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a rejected prompt
CREATE OR REPLACE FUNCTION public.delete_rejected_prompt(p_rejected_prompt_id UUID, p_admin_id UUID)
RETURNS JSONB AS $$
BEGIN
  DELETE FROM public.rejected_prompts WHERE id = p_rejected_prompt_id;
  RETURN jsonb_build_object('success', true, 'message', 'Rejected prompt permanently deleted', 'rejected_prompt_id', p_rejected_prompt_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete an approved prompt
CREATE OR REPLACE FUNCTION public.delete_approved_prompt(p_prompt_id UUID, p_admin_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_is_admin BOOLEAN := FALSE;
  v_prompt_title TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.authors WHERE (id = p_admin_id OR user_id = auth.uid()) AND (COALESCE(is_admin, false) = true OR COALESCE(reputation, 0) >= 5000)
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'message', 'Permission denied: Only administrators can delete prompts');
  END IF;

  SELECT title INTO v_prompt_title FROM public.prompts WHERE id = p_prompt_id;
  IF v_prompt_title IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Prompt not found');
  END IF;

  INSERT INTO public.moderation_logs (prompt_id, action, old_status, new_status, reason, performed_by, performed_at, metadata)
  VALUES (p_prompt_id, 'deleted', 'approved', 'deleted', 'Permanently deleted by Admin', p_admin_id, NOW(), jsonb_build_object('deleted_title', v_prompt_title));

  DELETE FROM public.prompts WHERE id = p_prompt_id;
  RETURN jsonb_build_object('success', true, 'message', 'Prompt and all linked data permanently deleted', 'prompt_id', p_prompt_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function: admin_adjust_reputation
CREATE OR REPLACE FUNCTION public.admin_adjust_reputation(p_author_id UUID, p_points INT, p_reason TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_is_admin BOOLEAN := false;
  v_target_user_id UUID;
  v_new_reputation INT;
BEGIN
  IF v_caller_id IS NOT NULL THEN
    SELECT COALESCE(is_admin, false) INTO v_is_admin FROM public.authors WHERE user_id = v_caller_id;
  END IF;
  IF NOT v_is_admin THEN RAISE EXCEPTION 'Unauthorized: Admin access required'; END IF;

  SELECT user_id INTO v_target_user_id FROM public.authors WHERE id = p_author_id OR user_id = p_author_id;
  IF v_target_user_id IS NULL THEN RAISE EXCEPTION 'Author not found'; END IF;

  INSERT INTO public.author_reputation_logs (user_id, author_id, event_type, points, description, created_at)
  VALUES (v_target_user_id, p_author_id, 'admin_adjustment', p_points, coalesce(p_reason, 'Admin manual adjustment'), NOW());

  v_new_reputation := public.recalculate_author_reputation(v_target_user_id);
  RETURN jsonb_build_object('success', true, 'new_reputation', v_new_reputation, 'points_added', p_points);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function: get_author_reputation_history
CREATE OR REPLACE FUNCTION public.get_author_reputation_history(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_author_id UUID;
  v_user_id UUID;
  v_is_verified BOOLEAN := false;
  v_approved_count INT := 0;
  v_5star_count INT := 0;
  v_4star_count INT := 0;
  v_admin_adjustments INT := 0;
  v_total INT := 0;
  v_logs JSONB;
BEGIN
  SELECT id, user_id, coalesce(verified, false) INTO v_author_id, v_user_id, v_is_verified
  FROM public.authors WHERE user_id = p_user_id OR id = p_user_id LIMIT 1;

  IF v_author_id IS NULL THEN
    RETURN jsonb_build_object('totalReputation', 0, 'approvedPromptsCount', 0, 'fiveStarRatingsCount', 0, 'fourStarRatingsCount', 0, 'isVerified', false, 'adminAdjustmentsTotal', 0, 'events', '[]'::jsonb);
  END IF;

  SELECT count(*) INTO v_approved_count FROM public.prompts WHERE author_id = v_author_id AND moderation_status = 'approved';
  SELECT count(*) INTO v_5star_count FROM public.ratings r JOIN public.prompts p ON p.id = r.prompt_id WHERE p.author_id = v_author_id AND p.moderation_status = 'approved' AND r.rating_value = 5 AND r.user_id != v_user_id;
  SELECT count(*) INTO v_4star_count FROM public.ratings r JOIN public.prompts p ON p.id = r.prompt_id WHERE p.author_id = v_author_id AND p.moderation_status = 'approved' AND r.rating_value = 4 AND r.user_id != v_user_id;
  SELECT coalesce(sum(points), 0) INTO v_admin_adjustments FROM public.author_reputation_logs WHERE author_id = v_author_id AND event_type = 'admin_adjustment';

  v_total := public.recalculate_author_reputation(v_user_id);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'userId', user_id, 'authorId', author_id, 'eventType', event_type, 'points', points, 'referenceId', reference_id, 'description', description, 'createdAt', created_at
  ) ORDER BY created_at DESC), '[]'::jsonb) INTO v_logs FROM public.author_reputation_logs WHERE author_id = v_author_id;

  RETURN jsonb_build_object('totalReputation', v_total, 'approvedPromptsCount', v_approved_count, 'fiveStarRatingsCount', v_5star_count, 'fourStarRatingsCount', v_4star_count, 'isVerified', v_is_verified, 'adminAdjustmentsTotal', v_admin_adjustments, 'events', v_logs);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.approve_prompt(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_prompt(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_rejected_prompt(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_rejected_prompt(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_approved_prompt(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_reputation(uuid, int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_author_reputation_history(uuid) TO authenticated, anon;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';

COMMIT;
