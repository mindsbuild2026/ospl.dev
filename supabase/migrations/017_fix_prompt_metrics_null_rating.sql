-- Migration 017: Fix rating_average Not-Null Constraint Violation on prompt_metrics
-- Resolves HTTP 400 error when submitting prompt templates or copying prompts.

-- 1. Re-create initialize_prompt_metrics trigger function with default 0 for rating_average
CREATE OR REPLACE FUNCTION public.initialize_prompt_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.prompt_metrics (prompt_id, views, copies, bookmarks, rating_count, rating_average)
  VALUES (NEW.id, 0, 0, 0, 0, 0)
  ON CONFLICT (prompt_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-create increment_prompt_copy RPC function with default 0 for rating_average
CREATE OR REPLACE FUNCTION public.increment_prompt_copy(prompt_id_input uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_new_copies int := 0;
  v_last_event timestamp with time zone;
BEGIN
  IF prompt_id_input IS NULL THEN
    RAISE EXCEPTION 'prompt_id_input cannot be null';
  END IF;

  -- Deduplication check: prevent rapid double-clicks from same user/session within 5 seconds
  IF v_user_id IS NOT NULL THEN
    SELECT created_at INTO v_last_event
    FROM public.prompt_events
    WHERE prompt_id = prompt_id_input
      AND user_id = v_user_id
      AND event_type = 'copy'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_event IS NOT NULL AND v_last_event > (now() - INTERVAL '5 seconds') THEN
      -- Duplicate click within 5s window -> return current count without double counting
      SELECT copies INTO v_new_copies
      FROM public.prompt_metrics
      WHERE prompt_id = prompt_id_input;

      RETURN jsonb_build_object(
        'success', true,
        'copies', coalesce(v_new_copies, 0),
        'deduplicated', true
      );
    END IF;
  END IF;

  -- Log copy event
  INSERT INTO public.prompt_events (prompt_id, user_id, event_type, event_metadata, created_at)
  VALUES (prompt_id_input, v_user_id, 'copy', jsonb_build_object('timestamp', now()), now());

  -- Ensure prompt_metrics row exists and update copies atomically
  INSERT INTO public.prompt_metrics (prompt_id, views, copies, bookmarks, rating_count, rating_average, updated_at)
  VALUES (prompt_id_input, 0, 1, 0, 0, 0, now())
  ON CONFLICT (prompt_id) DO UPDATE
  SET copies = coalesce(prompt_metrics.copies, 0) + 1,
      updated_at = now();

  -- Get authoritative updated count
  SELECT copies INTO v_new_copies
  FROM public.prompt_metrics
  WHERE prompt_id = prompt_id_input;

  -- Update prompt_analytics table if present
  BEGIN
    INSERT INTO public.prompt_analytics (prompt_id, copies, updated_at)
    VALUES (prompt_id_input, 1, now())
    ON CONFLICT (prompt_id) DO UPDATE
    SET copies = coalesce(prompt_analytics.copies, 0) + 1,
        updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if prompt_analytics table doesn't exist
  END;

  RETURN jsonb_build_object(
    'success', true,
    'copies', coalesce(v_new_copies, 1),
    'deduplicated', false
  );
END;
$$;

-- 3. Re-create rate_prompt RPC function ensuring rating_average is never null
CREATE OR REPLACE FUNCTION public.rate_prompt(prompt_id_input uuid, rating_input int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_author_id uuid;
  v_count int;
  v_avg numeric;
  v_existing_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated to rate prompts';
  END IF;

  IF rating_input < 1 OR rating_input > 5 THEN
    RAISE EXCEPTION 'Rating must be an integer between 1 and 5';
  END IF;

  -- Lookup author_id if present
  SELECT id INTO v_author_id FROM public.authors WHERE user_id = v_user_id LIMIT 1;

  -- Check existing rating row
  SELECT id INTO v_existing_id
  FROM public.ratings
  WHERE prompt_id = prompt_id_input AND user_id = v_user_id
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.ratings
    SET rating_value = rating_input,
        updated_at = now()
    WHERE id = v_existing_id;
  ELSE
    INSERT INTO public.ratings (prompt_id, user_id, rating_value, created_at, updated_at)
    VALUES (prompt_id_input, v_user_id, rating_input, now(), now());
  END IF;

  -- Recalculate exact total count and average rating
  SELECT count(*), round(avg(rating_value)::numeric, 1)
  INTO v_count, v_avg
  FROM public.ratings
  WHERE prompt_id = prompt_id_input;

  -- Update prompt_metrics safely with coalesce
  UPDATE public.prompt_metrics
  SET rating_count = coalesce(v_count, 0),
      rating_average = coalesce(v_avg, 0),
      updated_at = now()
  WHERE prompt_id = prompt_id_input;

  RETURN jsonb_build_object(
    'success', true,
    'rating_average', coalesce(v_avg, 0),
    'rating_count', coalesce(v_count, 0),
    'user_rating', rating_input
  );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.increment_prompt_copy(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rate_prompt(uuid, int) TO authenticated, anon;

-- Force Supabase/PostgREST to rebuild its API schema cache immediately
NOTIFY pgrst, 'reload schema';
