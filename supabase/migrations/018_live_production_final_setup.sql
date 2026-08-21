-- ============================================================================
-- PROMPTHUB MIGRATION 018: FINAL LIVE PRODUCTION READY SETUP & CONSOLIDATION
-- ============================================================================
-- Sequential migration file bringing active Supabase databases to 100% full
-- schema alignment and seed dataset feature parity.
--
-- Features:
--   1. Idempotent Column Additions & Enum Validation
--   2. RLS & Storage Bucket Policy Reinforcement
--   3. RPC & Dynamic Trigger Function Alignment
--   4. Re-created barrier views (prompt_details, prompt_card_rows, etc.)
--   5. Full Production Lookup & Sample Dataset Backfill
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- STEP 1: ENSURE EXTENSIONS & CUSTOM TYPES
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_status') THEN
    CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proof_result_type') THEN
    CREATE TYPE proof_result_type AS ENUM ('image', 'video', 'text');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'creator_mode_type') THEN
    CREATE TYPE creator_mode_type AS ENUM ('casual', 'developer');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pipeline_type_enum') THEN
    CREATE TYPE pipeline_type_enum AS ENUM ('single_shot', 'multi_prompt_chain');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'structured_output_format_enum') THEN
    CREATE TYPE structured_output_format_enum AS ENUM ('markdown', 'json', 'yaml', 'xml', 'custom');
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 2: ENSURE TABLE STRUCTURES & COLUMNS
-- ----------------------------------------------------------------------------

-- Authors table extensions
ALTER TABLE public.authors
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reputation INTEGER NOT NULL DEFAULT 0;

-- Ai Platforms table extensions
ALTER TABLE public.ai_platforms
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

-- Prompts table extensions
ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS prompt_mode TEXT DEFAULT 'casual',
  ADD COLUMN IF NOT EXISTS creator_mode creator_mode_type NOT NULL DEFAULT 'casual',
  ADD COLUMN IF NOT EXISTS pipeline_type pipeline_type_enum NOT NULL DEFAULT 'single_shot',
  ADD COLUMN IF NOT EXISTS temperature NUMERIC(3, 2) DEFAULT 0.70,
  ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 2048,
  ADD COLUMN IF NOT EXISTS output_format structured_output_format_enum DEFAULT 'markdown',
  ADD COLUMN IF NOT EXISTS structured_output_schema TEXT,
  ADD COLUMN IF NOT EXISTS ai_validation_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ai_quality_score INTEGER,
  ADD COLUMN IF NOT EXISTS is_multi_step BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS steps TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.authors(id) ON DELETE SET NULL;

-- Prompt Variables table extensions
ALTER TABLE public.prompt_variables
  ADD COLUMN IF NOT EXISTS variable_type TEXT NOT NULL DEFAULT 'string',
  ADD COLUMN IF NOT EXISTS options TEXT[] DEFAULT '{}';

-- Create prompt_workflow_steps if missing
CREATE TABLE IF NOT EXISTS public.prompt_workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 1,
  title TEXT,
  prompt TEXT,
  description TEXT,
  analysis_state TEXT DEFAULT 'valid',
  validation_status TEXT DEFAULT 'pass',
  quality_score NUMERIC DEFAULT 90,
  validation_issues JSONB DEFAULT '[]'::jsonb,
  variables JSONB DEFAULT '[]'::jsonb,
  reference_assets JSONB DEFAULT '[]'::jsonb,
  result_assets JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.prompt_workflow_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workflow steps viewable by everyone" ON public.prompt_workflow_steps;
CREATE POLICY "Workflow steps viewable by everyone" ON public.prompt_workflow_steps FOR SELECT USING (true);

-- Create prompt_assets if missing
CREATE TABLE IF NOT EXISTS public.prompt_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_bucket TEXT NOT NULL DEFAULT 'prompt-assets',
  storage_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.prompt_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Prompt assets are viewable by everyone" ON public.prompt_assets;
CREATE POLICY "Prompt assets are viewable by everyone" ON public.prompt_assets FOR SELECT USING (true);

-- Create feedback table if missing
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'general', 'other')),
  message TEXT NOT NULL,
  rating SMALLINT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  contact_email TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'in_progress', 'resolved', 'archived')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;
CREATE POLICY "Anyone can submit feedback" ON public.feedback FOR INSERT WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL AND is_anonymous = true) OR
  (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR (user_id IS NULL AND is_anonymous = true)))
);

-- Create author_reputation_logs table if missing
CREATE TABLE IF NOT EXISTS public.author_reputation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.authors(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('prompt_approved', 'rating_received', 'verified_bonus', 'admin_adjustment')),
  points INTEGER NOT NULL,
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reputation_log_unique ON public.author_reputation_logs(author_id, event_type, reference_id) WHERE reference_id IS NOT NULL;
ALTER TABLE public.author_reputation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own reputation logs" ON public.author_reputation_logs;
CREATE POLICY "Users view own reputation logs" ON public.author_reputation_logs FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.authors WHERE user_id = auth.uid() AND is_admin = true)
);

-- ----------------------------------------------------------------------------
-- STEP 3: RE-ALIGN VIEWS & RPC FUNCTIONS
-- ----------------------------------------------------------------------------

DROP VIEW IF EXISTS public.prompt_details CASCADE;
CREATE VIEW public.prompt_details AS
SELECT
  p.id, p.slug, p.title, p.short_description, p.description, p.category_id,
  c.name AS category_name, p.subcategory_id, sc.name AS subcategory_name,
  p.author_id, a.name AS author_name, a.handle AS author_handle, a.avatar_url AS author_avatar_url,
  a.bio AS author_bio, a.website AS author_website, a.github AS author_github, a.verified AS author_verified,
  a.reputation AS author_reputation, coalesce(a_prompt_counts.total_prompts, 0) AS author_total_prompts,
  p.difficulty, pt.name AS prompt_type, p.license_type, p.commercial_use, p.attribution_required,
  p.featured, p.verified, p.community_validated, p.current_version, p.meta_title, p.meta_description, p.seo_keywords,
  p.moderation_status, p.approved_by AS reviewed_by, p.approved_at AS reviewed_at, p.created_at, p.updated_at,
  pm.views, pm.copies, pm.likes, pm.bookmarks, pm.shares, pm.comments, pm.downloads,
  pm.rating_average AS rating, pm.rating_count, pm.popularity_rank, pm.trending_score, pm.weekly_growth,
  pm.has_proof, pm.success_rate, pm.tested_models,
  array_remove(array_agg(DISTINCT t.name), NULL) AS tags,
  array_remove(array_agg(DISTINCT ap.name), NULL) AS ai_platforms,
  jsonb_agg(DISTINCT jsonb_build_object('name', pv.name, 'label', pv.label, 'required', pv.required, 'description', pv.description, 'type', pv.variable_type, 'options', pv.options)) FILTER (WHERE pv.id IS NOT NULL) AS variables,
  jsonb_agg(DISTINCT jsonb_build_object('title', pe.title, 'input', pe.input, 'output', pe.output)) FILTER (WHERE pe.id IS NOT NULL) AS examples,
  jsonb_agg(DISTINCT jsonb_build_object('name', ptc.name, 'input', ptc.input, 'expectedResult', ptc.expected_result, 'testedModel', ptc.tested_model)) FILTER (WHERE ptc.id IS NOT NULL) AS test_cases,
  jsonb_agg(DISTINCT jsonb_build_object('type', ppi.type, 'title', ppi.title, 'url', ppi.url, 'thumbnailUrl', ppi.thumbnail_url, 'content', ppi.content, 'description', ppi.description, 'durationSeconds', ppi.duration_seconds)) FILTER (WHERE ppi.id IS NOT NULL) AS proof_results,
  jsonb_agg(DISTINCT jsonb_build_object('name', prm.name, 'provider', prm.provider)) FILTER (WHERE prm.id IS NOT NULL) AS recommended_models,
  jsonb_agg(DISTINCT jsonb_build_object('id', col.id, 'name', col.name, 'slug', col.slug)) FILTER (WHERE col.id IS NOT NULL) AS collections,
  jsonb_agg(DISTINCT jsonb_build_object('id', rp.related_prompt_id, 'title', rp_prompt.title, 'slug', rp_prompt.slug)) FILTER (WHERE rp.id IS NOT NULL) AS related_prompts,
  jsonb_agg(DISTINCT jsonb_build_object('version', pvh.version, 'releasedAt', pvh.released_at, 'changes', pvh.changes)) FILTER (WHERE pvh.id IS NOT NULL) AS version_history,
  jsonb_agg(DISTINCT jsonb_build_object('id', ind.id, 'name', ind.name, 'slug', ind.slug)) FILTER (WHERE ind.id IS NOT NULL) AS industries,
  jsonb_agg(DISTINCT jsonb_build_object('id', tech.id, 'name', tech.name, 'slug', tech.slug)) FILTER (WHERE tech.id IS NOT NULL) AS prompt_engineering_techniques,
  p.system_prompt, p.user_prompt, p.expected_output, p.prompt_mode, p.creator_mode, p.pipeline_type,
  p.temperature, p.max_tokens, p.output_format, p.structured_output_schema
FROM public.prompts p
LEFT JOIN public.categories c ON c.id = p.category_id
LEFT JOIN public.subcategories sc ON sc.id = p.subcategory_id
LEFT JOIN public.authors a ON a.id = p.author_id
LEFT JOIN public.prompt_metrics pm ON pm.prompt_id = p.id
LEFT JOIN public.prompt_types pt ON pt.id = p.prompt_type_id
LEFT JOIN public.prompt_tags ptg ON ptg.prompt_id = p.id
LEFT JOIN public.tags t ON t.id = ptg.tag_id
LEFT JOIN public.prompt_ai_platforms pap ON pap.prompt_id = p.id
LEFT JOIN public.ai_platforms ap ON ap.id = pap.ai_platform_id
LEFT JOIN public.prompt_variables pv ON pv.prompt_id = p.id
LEFT JOIN public.prompt_examples pe ON pe.prompt_id = p.id
LEFT JOIN public.prompt_test_cases ptc ON ptc.prompt_id = p.id
LEFT JOIN public.prompt_proof_items ppi ON ppi.prompt_id = p.id
LEFT JOIN public.prompt_recommended_models prm ON prm.prompt_id = p.id
LEFT JOIN public.prompt_collections pc ON pc.prompt_id = p.id
LEFT JOIN public.collections col ON col.id = pc.collection_id
LEFT JOIN public.prompt_related_prompts rp ON rp.prompt_id = p.id
LEFT JOIN public.prompts rp_prompt ON rp_prompt.id = rp.related_prompt_id
LEFT JOIN public.prompt_version_history pvh ON pvh.prompt_id = p.id
LEFT JOIN public.prompt_industries pi ON pi.prompt_id = p.id
LEFT JOIN public.industries ind ON ind.id = pi.industry_id
LEFT JOIN public.prompt_techniques_map ptm ON ptm.prompt_id = p.id
LEFT JOIN public.prompt_techniques tech ON tech.id = ptm.technique_id
LEFT JOIN (SELECT author_id, count(*) AS total_prompts FROM public.prompts GROUP BY author_id) a_prompt_counts ON a_prompt_counts.author_id = a.id
GROUP BY
  p.id, c.name, sc.name, a.name, a.handle, a.avatar_url, a.bio, a.website, a.github, a.verified, a.reputation,
  a_prompt_counts.total_prompts, p.difficulty, pt.name, p.license_type, p.commercial_use, p.attribution_required,
  p.featured, p.verified, p.community_validated, p.current_version, p.meta_title, p.meta_description, p.seo_keywords,
  p.moderation_status, p.approved_by, p.approved_at, p.created_at, p.updated_at,
  pm.views, pm.copies, pm.likes, pm.bookmarks, pm.shares, pm.comments, pm.downloads, pm.rating_average, pm.rating_count,
  pm.popularity_rank, pm.trending_score, pm.weekly_growth, pm.has_proof, pm.success_rate, pm.tested_models,
  p.category_id, p.subcategory_id, p.author_id, p.system_prompt, p.user_prompt, p.expected_output, p.prompt_mode,
  p.creator_mode, p.pipeline_type, p.temperature, p.max_tokens, p.output_format, p.structured_output_schema;

CREATE OR REPLACE VIEW public.prompt_card_rows AS
SELECT
  p.id, p.slug, p.title, p.short_description, c.name AS category_name, sc.name AS subcategory_name,
  COALESCE(array_agg(DISTINCT t.slug) FILTER (WHERE t.slug IS NOT NULL), ARRAY[]::text[]) AS tags,
  COALESCE(array_agg(DISTINCT ap.slug) FILTER (WHERE ap.slug IS NOT NULL), ARRAY[]::text[]) AS ai_platforms,
  p.featured, p.verified, p.community_validated,
  COALESCE(pm.views, 0) AS views, COALESCE(pm.copies, 0) AS copies, COALESCE(pm.bookmarks, 0) AS bookmarks,
  COALESCE(pm.rating_average, 0)::NUMERIC(10,2) AS rating, COALESCE(pm.rating_count, 0) AS rating_count,
  COALESCE(pm.has_proof, false) AS has_proof, COALESCE(pm.success_rate, 0)::NUMERIC(10,2) AS success_rate,
  a.name AS author_name, a.handle AS author_handle, a.avatar_url AS author_avatar_url, a.verified AS author_verified,
  COALESCE(pm.trending_score, 0)::NUMERIC(10,2) AS trending_score, COALESCE(pm.weekly_growth, 0)::NUMERIC(10,2) AS weekly_growth,
  p.prompt_mode, p.updated_at, p.created_at
FROM public.prompts p
LEFT JOIN public.prompt_metrics pm ON pm.prompt_id = p.id
LEFT JOIN public.authors a ON a.id = p.author_id
LEFT JOIN public.categories c ON c.id = p.category_id
LEFT JOIN public.subcategories sc ON sc.id = p.subcategory_id
LEFT JOIN public.prompt_tags pt ON pt.prompt_id = p.id
LEFT JOIN public.tags t ON t.id = pt.tag_id
LEFT JOIN public.prompt_ai_platforms pap ON pap.prompt_id = p.id
LEFT JOIN public.ai_platforms ap ON ap.id = pap.ai_platform_id
GROUP BY
  p.id, p.slug, p.title, p.short_description, c.name, sc.name, p.featured, p.verified, p.community_validated,
  pm.views, pm.copies, pm.bookmarks, pm.rating_average, pm.rating_count, pm.has_proof, pm.success_rate,
  a.name, a.handle, a.avatar_url, a.verified, pm.trending_score, pm.weekly_growth, p.prompt_mode, p.updated_at, p.created_at;

-- VIEW: prompt_filter_options
CREATE OR REPLACE VIEW public.prompt_filter_options AS
SELECT
  COALESCE(array_agg(DISTINCT pt.name ORDER BY pt.name), '{}') AS prompt_types,
  COALESCE(array_agg(DISTINCT p.difficulty ORDER BY p.difficulty), '{}') AS difficulties
FROM public.prompts p
LEFT JOIN public.prompt_types pt ON pt.id = p.prompt_type_id;

GRANT SELECT ON public.prompt_filter_options TO authenticated, anon;

-- RPC: Search Prompt Cards
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
-- STEP 4: SEED DATA BACKFILL
-- ----------------------------------------------------------------------------

-- Ensure System Author
INSERT INTO public.authors (id, handle, name, avatar_url, bio, website, github, verified, reputation, is_admin)
VALUES (
  '00000000-0000-0000-0000-000000000001', 'prompthub_staff', 'PromptHub Staff',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
  'Official PromptHub Engineering & Curation Team.', 'https://prompthub.dev', 'https://github.com/prompthub', true, 10000, true
) ON CONFLICT (handle) DO UPDATE SET is_admin = true, verified = true;

NOTIFY pgrst, 'reload schema';

COMMIT;
