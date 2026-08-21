-- ============================================================================
-- PROMPTHUB MASTER PRODUCTION DATABASE SCHEMA
-- ============================================================================
-- Consolidated production-ready database schema for Supabase / PostgreSQL.
-- Executable on fresh Supabase projects or existing instances.
-- Includes:
--   1. Extensions & Custom ENUM Types
--   2. All 37+ Relational & Junction Tables with Indexes & Constraints
--   3. Row Level Security (RLS) Policies & Storage Bucket Setup
--   4. Triggers, Auditing & Automation Functions
--   5. Materialized Views, Barrier Views & Full-Featured RPC Functions
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1: EXTENSIONS & ENUM TYPES
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Types & Enums
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

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;

-- Immutable helper for full-text search vector expressions
CREATE OR REPLACE FUNCTION immutable_array_to_string(text[], text)
RETURNS text LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$
  SELECT array_to_string($1, $2);
$$;

-- ============================================================================
-- PHASE 2: CORE LOOKUP & PROFILE TABLES
-- ============================================================================

-- TABLE: authors
CREATE TABLE IF NOT EXISTS public.authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  github_id TEXT,
  handle TEXT NOT NULL UNIQUE CHECK (handle ~ '^@?[A-Za-z0-9_.-]+$'),
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  github TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  reputation INTEGER NOT NULL DEFAULT 0,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_authors_github_id ON public.authors(github_id) WHERE github_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_authors_handle ON public.authors(handle);
CREATE INDEX IF NOT EXISTS idx_authors_reputation ON public.authors(reputation DESC);
CREATE INDEX IF NOT EXISTS idx_authors_is_admin ON public.authors(is_admin) WHERE is_admin = TRUE;

ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authors are viewable by everyone" ON public.authors;
CREATE POLICY "Authors are viewable by everyone" ON public.authors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authors can update their own profile" ON public.authors;
CREATE POLICY "Authors can update their own profile" ON public.authors FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authors can insert their own profile" ON public.authors;
CREATE POLICY "Authors can insert their own profile" ON public.authors FOR INSERT WITH CHECK (auth.uid() = user_id);

-- TABLE: categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT NOT NULL DEFAULT 'auto_awesome',
  is_trending BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 100,
  seo_h1 TEXT,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_is_trending ON public.categories(is_trending);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can modify categories" ON public.categories;
CREATE POLICY "Only admins can modify categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.authors WHERE user_id = auth.uid() AND is_admin = true)
);

-- TABLE: subcategories
CREATE TABLE IF NOT EXISTS public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, slug),
  UNIQUE (category_id, name)
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_sort_order ON public.subcategories(sort_order);

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Subcategories are viewable by everyone" ON public.subcategories;
CREATE POLICY "Subcategories are viewable by everyone" ON public.subcategories FOR SELECT USING (true);

-- TABLE: tags
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_slug ON public.tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON public.tags(usage_count DESC);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tags are viewable by everyone" ON public.tags;
CREATE POLICY "Tags are viewable by everyone" ON public.tags FOR SELECT USING (true);

-- TABLE: ai_platforms
CREATE TABLE IF NOT EXISTS public.ai_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  provider TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_platforms_slug ON public.ai_platforms(slug);
CREATE INDEX IF NOT EXISTS idx_ai_platforms_usage_count ON public.ai_platforms(usage_count DESC);

ALTER TABLE public.ai_platforms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "AI platforms are viewable by everyone" ON public.ai_platforms;
CREATE POLICY "AI platforms are viewable by everyone" ON public.ai_platforms FOR SELECT USING (true);

-- TABLE: prompt_types
CREATE TABLE IF NOT EXISTS public.prompt_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_types_slug ON public.prompt_types(slug);

ALTER TABLE public.prompt_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prompt types are viewable by everyone" ON public.prompt_types;
CREATE POLICY "Prompt types are viewable by everyone" ON public.prompt_types FOR SELECT USING (true);

-- TABLE: industries
CREATE TABLE IF NOT EXISTS public.industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_industries_slug ON public.industries(slug);

ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Industries are viewable by everyone" ON public.industries;
CREATE POLICY "Industries are viewable by everyone" ON public.industries FOR SELECT USING (true);

-- TABLE: prompt_techniques
CREATE TABLE IF NOT EXISTS public.prompt_techniques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_techniques_slug ON public.prompt_techniques(slug);

ALTER TABLE public.prompt_techniques ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prompt techniques are viewable by everyone" ON public.prompt_techniques;
CREATE POLICY "Prompt techniques are viewable by everyone" ON public.prompt_techniques FOR SELECT USING (true);

-- TABLE: collections
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_sort_order ON public.collections(sort_order);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Collections are viewable by everyone" ON public.collections;
CREATE POLICY "Collections are viewable by everyone" ON public.collections FOR SELECT USING (true);

-- ============================================================================
-- PHASE 3: MAIN PROMPTS TABLE & CHILD ENTITIES
-- ============================================================================

-- TABLE: prompts
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE RESTRICT,
  prompt_type_id UUID REFERENCES public.prompt_types(id) ON DELETE SET NULL,
  difficulty TEXT NOT NULL DEFAULT 'Intermediate',
  prompt_type TEXT NOT NULL DEFAULT 'Text Generation',
  industry TEXT[] NOT NULL DEFAULT '{}',
  prompt_engineering_techniques TEXT[] NOT NULL DEFAULT '{}',
  system_prompt TEXT NOT NULL,
  user_prompt TEXT,
  expected_output TEXT,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  community_validated BOOLEAN NOT NULL DEFAULT FALSE,
  moderation_status moderation_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.authors(id) ON DELETE SET NULL,
  license_type TEXT NOT NULL DEFAULT 'MIT',
  commercial_use BOOLEAN NOT NULL DEFAULT TRUE,
  attribution_required BOOLEAN NOT NULL DEFAULT FALSE,
  current_version TEXT NOT NULL DEFAULT '1.0.0',
  meta_title TEXT,
  meta_description TEXT,
  seo_keywords TEXT[] NOT NULL DEFAULT '{}',
  trending_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  weekly_growth NUMERIC(10,2) NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  -- Metadata columns
  character_count INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  estimated_tokens INTEGER DEFAULT 0,
  complexity VARCHAR(30),
  difficulty_level VARCHAR(20),
  structure_level VARCHAR(30),
  reading_time_sec INTEGER DEFAULT 0,
  quality_score NUMERIC(5, 2) DEFAULT 0,
  short_summary TEXT,
  traits TEXT[] DEFAULT '{}',
  compatible_models TEXT[] DEFAULT '{}',
  metadata_generated_at TIMESTAMPTZ,
  -- Multi-step & Prompt Mode columns
  is_multi_step BOOLEAN NOT NULL DEFAULT FALSE,
  steps TEXT[] DEFAULT '{}',
  prompt_mode TEXT DEFAULT 'casual' CHECK (prompt_mode IN ('casual', 'developer_pro')),
  creator_mode creator_mode_type NOT NULL DEFAULT 'casual',
  pipeline_type pipeline_type_enum NOT NULL DEFAULT 'single_shot',
  temperature NUMERIC(3, 2) DEFAULT 0.70 CHECK (temperature >= 0.0 AND temperature <= 2.0),
  max_tokens INTEGER DEFAULT 2048 CHECK (max_tokens IS NULL OR max_tokens > 0),
  output_format structured_output_format_enum DEFAULT 'markdown',
  structured_output_schema TEXT,
  ai_validation_status TEXT DEFAULT 'pending',
  ai_quality_score INTEGER CHECK (ai_quality_score IS NULL OR (ai_quality_score >= 0 AND ai_quality_score <= 100)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_prompts_slug ON public.prompts(slug);
CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON public.prompts(category_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_subcategory_id ON public.prompts(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_prompts_author_id ON public.prompts(author_id);
CREATE INDEX IF NOT EXISTS idx_prompts_moderation_status ON public.prompts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_prompts_prompt_mode ON public.prompts(prompt_mode);
CREATE INDEX IF NOT EXISTS idx_prompts_creator_mode ON public.prompts(creator_mode);
CREATE INDEX IF NOT EXISTS idx_prompts_pipeline_type ON public.prompts(pipeline_type);
CREATE INDEX IF NOT EXISTS idx_prompts_search_trgm ON public.prompts USING gin ((title || ' ' || short_description || ' ' || coalesce(description, '')) gin_trgm_ops);

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved prompts are viewable by everyone" ON public.prompts;
CREATE POLICY "Approved prompts are viewable by everyone" ON public.prompts
  FOR SELECT USING (moderation_status = 'approved' OR auth.uid() = (SELECT user_id FROM public.authors WHERE id = author_id) OR EXISTS (SELECT 1 FROM public.authors WHERE user_id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Authors can update own prompts" ON public.prompts;
CREATE POLICY "Authors can update own prompts" ON public.prompts
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM public.authors WHERE id = author_id) OR EXISTS (SELECT 1 FROM public.authors WHERE user_id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Authors can delete own prompts" ON public.prompts;
CREATE POLICY "Authors can delete own prompts" ON public.prompts
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM public.authors WHERE id = author_id) OR EXISTS (SELECT 1 FROM public.authors WHERE user_id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Authenticated users can insert prompts" ON public.prompts;
CREATE POLICY "Authenticated users can insert prompts" ON public.prompts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- JUNCTION: prompt_collections
CREATE TABLE IF NOT EXISTS public.prompt_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (prompt_id, collection_id)
);
CREATE INDEX IF NOT EXISTS idx_prompt_collections_prompt_id ON public.prompt_collections(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_collections_collection_id ON public.prompt_collections(collection_id);
ALTER TABLE public.prompt_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view prompt collections" ON public.prompt_collections;
CREATE POLICY "Anyone can view prompt collections" ON public.prompt_collections FOR SELECT USING (true);

-- JUNCTION: collection_prompts
CREATE TABLE IF NOT EXISTS public.collection_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (collection_id, prompt_id)
);
CREATE INDEX IF NOT EXISTS idx_collection_prompts_collection_id ON public.collection_prompts(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_prompts_prompt_id ON public.collection_prompts(prompt_id);
ALTER TABLE public.collection_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Collection items visible if prompt is viewable" ON public.collection_prompts;
CREATE POLICY "Collection items visible if prompt is viewable" ON public.collection_prompts FOR SELECT USING (true);

-- JUNCTION: prompt_tags
CREATE TABLE IF NOT EXISTS public.prompt_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (prompt_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_prompt_tags_prompt_id ON public.prompt_tags(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag_id ON public.prompt_tags(tag_id);
ALTER TABLE public.prompt_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prompt tags are viewable by everyone" ON public.prompt_tags;
CREATE POLICY "Prompt tags are viewable by everyone" ON public.prompt_tags FOR SELECT USING (true);

-- JUNCTION: prompt_ai_platforms
CREATE TABLE IF NOT EXISTS public.prompt_ai_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  ai_platform_id UUID NOT NULL REFERENCES public.ai_platforms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (prompt_id, ai_platform_id)
);
CREATE INDEX IF NOT EXISTS idx_prompt_ai_platforms_prompt_id ON public.prompt_ai_platforms(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_ai_platforms_ai_platform_id ON public.prompt_ai_platforms(ai_platform_id);
ALTER TABLE public.prompt_ai_platforms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prompt AI platforms viewable by everyone" ON public.prompt_ai_platforms;
CREATE POLICY "Prompt AI platforms viewable by everyone" ON public.prompt_ai_platforms FOR SELECT USING (true);

-- JUNCTION: prompt_industries
CREATE TABLE IF NOT EXISTS public.prompt_industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  industry_id UUID NOT NULL REFERENCES public.industries(id) ON DELETE RESTRICT,
  UNIQUE (prompt_id, industry_id)
);
CREATE INDEX IF NOT EXISTS idx_prompt_industries_prompt_id ON public.prompt_industries(prompt_id);
ALTER TABLE public.prompt_industries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Industries mapping viewable by everyone" ON public.prompt_industries;
CREATE POLICY "Industries mapping viewable by everyone" ON public.prompt_industries FOR SELECT USING (true);

-- JUNCTION: prompt_techniques_map
CREATE TABLE IF NOT EXISTS public.prompt_techniques_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  technique_id UUID NOT NULL REFERENCES public.prompt_techniques(id) ON DELETE RESTRICT,
  UNIQUE (prompt_id, technique_id)
);
CREATE INDEX IF NOT EXISTS idx_prompt_techniques_map_prompt_id ON public.prompt_techniques_map(prompt_id);
ALTER TABLE public.prompt_techniques_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Techniques mapping viewable by everyone" ON public.prompt_techniques_map;
CREATE POLICY "Techniques mapping viewable by everyone" ON public.prompt_techniques_map FOR SELECT USING (true);

-- JUNCTION: prompt_related_prompts
CREATE TABLE IF NOT EXISTS public.prompt_related_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  related_prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE RESTRICT,
  relation_type TEXT NOT NULL DEFAULT 'related',
  UNIQUE (prompt_id, related_prompt_id)
);
CREATE INDEX IF NOT EXISTS idx_prompt_related_prompts_prompt_id ON public.prompt_related_prompts(prompt_id);
ALTER TABLE public.prompt_related_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Related prompts viewable by everyone" ON public.prompt_related_prompts;
CREATE POLICY "Related prompts viewable by everyone" ON public.prompt_related_prompts FOR SELECT USING (true);

-- CHILD TABLE: prompt_variables
CREATE TABLE IF NOT EXISTS public.prompt_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  variable_type TEXT NOT NULL DEFAULT 'string',
  options TEXT[] DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prompt_variables_prompt_id ON public.prompt_variables(prompt_id);
ALTER TABLE public.prompt_variables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prompt variables viewable by everyone" ON public.prompt_variables;
CREATE POLICY "Prompt variables viewable by everyone" ON public.prompt_variables FOR SELECT USING (true);

-- CHILD TABLE: prompt_examples
CREATE TABLE IF NOT EXISTS public.prompt_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  input TEXT,
  output TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prompt_examples_prompt_id ON public.prompt_examples(prompt_id);
ALTER TABLE public.prompt_examples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Examples viewable by everyone" ON public.prompt_examples;
CREATE POLICY "Examples viewable by everyone" ON public.prompt_examples FOR SELECT USING (true);

-- CHILD TABLE: prompt_test_cases
CREATE TABLE IF NOT EXISTS public.prompt_test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  input TEXT,
  expected_result TEXT,
  tested_model TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prompt_test_cases_prompt_id ON public.prompt_test_cases(prompt_id);
ALTER TABLE public.prompt_test_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Test cases viewable by everyone" ON public.prompt_test_cases;
CREATE POLICY "Test cases viewable by everyone" ON public.prompt_test_cases FOR SELECT USING (true);

-- CHILD TABLE: prompt_proof_items
CREATE TABLE IF NOT EXISTS public.prompt_proof_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  type proof_result_type NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  thumbnail_url TEXT,
  content TEXT,
  description TEXT,
  duration_seconds INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prompt_proof_items_prompt_id ON public.prompt_proof_items(prompt_id);
ALTER TABLE public.prompt_proof_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Proof items viewable by everyone" ON public.prompt_proof_items;
CREATE POLICY "Proof items viewable by everyone" ON public.prompt_proof_items FOR SELECT USING (true);

-- CHILD TABLE: prompt_version_history
CREATE TABLE IF NOT EXISTS public.prompt_version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  released_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changes TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prompt_version_history_prompt_id ON public.prompt_version_history(prompt_id);
ALTER TABLE public.prompt_version_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Version history viewable by everyone" ON public.prompt_version_history;
CREATE POLICY "Version history viewable by everyone" ON public.prompt_version_history FOR SELECT USING (true);

-- CHILD TABLE: prompt_recommended_models
CREATE TABLE IF NOT EXISTS public.prompt_recommended_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prompt_recommended_models_prompt_id ON public.prompt_recommended_models(prompt_id);
ALTER TABLE public.prompt_recommended_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recommended models viewable by everyone" ON public.prompt_recommended_models;
CREATE POLICY "Recommended models viewable by everyone" ON public.prompt_recommended_models FOR SELECT USING (true);

-- CHILD TABLE: prompt_usage_instructions
CREATE TABLE IF NOT EXISTS public.prompt_usage_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  instruction TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_instructions_prompt_id ON public.prompt_usage_instructions(prompt_id);
ALTER TABLE public.prompt_usage_instructions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usage instructions viewable by everyone" ON public.prompt_usage_instructions;
CREATE POLICY "Usage instructions viewable by everyone" ON public.prompt_usage_instructions FOR SELECT USING (true);

-- CHILD TABLE: prompt_workflow_steps (Multi-Step Support)
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
CREATE INDEX IF NOT EXISTS idx_prompt_workflow_steps_prompt ON public.prompt_workflow_steps(prompt_id, step_order);
ALTER TABLE public.prompt_workflow_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workflow steps viewable by everyone" ON public.prompt_workflow_steps;
CREATE POLICY "Workflow steps viewable by everyone" ON public.prompt_workflow_steps FOR SELECT USING (true);

-- CHILD TABLE: prompt_assets (Storage & Reference Media)
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
CREATE INDEX IF NOT EXISTS idx_prompt_assets_prompt_id ON public.prompt_assets(prompt_id);
ALTER TABLE public.prompt_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prompt assets are viewable by everyone" ON public.prompt_assets;
CREATE POLICY "Prompt assets are viewable by everyone" ON public.prompt_assets FOR SELECT USING (true);

-- ============================================================================
-- PHASE 4: INTERACTIVE, METRICS & EVENTS TABLES
-- ============================================================================

-- TABLE: ratings
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating_value INTEGER NOT NULL CHECK (rating_value >= 1 AND rating_value <= 5),
  review TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (prompt_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_ratings_prompt_id ON public.ratings(prompt_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON public.ratings(user_id);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ratings viewable by everyone" ON public.ratings;
CREATE POLICY "Ratings viewable by everyone" ON public.ratings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can rate" ON public.ratings;
CREATE POLICY "Authenticated users can rate" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their ratings" ON public.ratings;
CREATE POLICY "Users can update their ratings" ON public.ratings FOR UPDATE USING (auth.uid() = user_id);

-- TABLE: saved_prompts (Bookmarks)
CREATE TABLE IF NOT EXISTS public.saved_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (session_id IS NOT NULL OR user_id IS NOT NULL),
  UNIQUE (user_id, prompt_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_id ON public.saved_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_prompt_id ON public.saved_prompts(prompt_id);
ALTER TABLE public.saved_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view saved prompts" ON public.saved_prompts;
CREATE POLICY "Users can view saved prompts" ON public.saved_prompts FOR SELECT USING (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));
DROP POLICY IF EXISTS "Users can save prompts" ON public.saved_prompts;
CREATE POLICY "Users can save prompts" ON public.saved_prompts FOR INSERT WITH CHECK (auth.uid() = user_id OR session_id IS NOT NULL);
DROP POLICY IF EXISTS "Users can remove saved prompts" ON public.saved_prompts;
CREATE POLICY "Users can remove saved prompts" ON public.saved_prompts FOR DELETE USING (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));

-- TABLE: prompt_metrics
CREATE TABLE IF NOT EXISTS public.prompt_metrics (
  prompt_id UUID PRIMARY KEY REFERENCES public.prompts(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  copies INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  bookmarks INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  rating_average NUMERIC NOT NULL DEFAULT 0,
  has_proof BOOLEAN NOT NULL DEFAULT FALSE,
  success_rate NUMERIC NOT NULL DEFAULT 0,
  tested_models TEXT[] NOT NULL DEFAULT '{}',
  trending_score NUMERIC NOT NULL DEFAULT 0,
  weekly_growth NUMERIC NOT NULL DEFAULT 0,
  popularity_rank INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.prompt_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view prompt metrics" ON public.prompt_metrics;
CREATE POLICY "Anyone can view prompt metrics" ON public.prompt_metrics FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can update metrics" ON public.prompt_metrics;
CREATE POLICY "Authenticated users can update metrics" ON public.prompt_metrics FOR UPDATE USING (true) WITH CHECK (true);

-- TABLE: prompt_analytics (Legacy / Counterpart)
CREATE TABLE IF NOT EXISTS public.prompt_analytics (
  prompt_id UUID PRIMARY KEY REFERENCES public.prompts(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  copies INTEGER NOT NULL DEFAULT 0,
  bookmarks INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  trending_score NUMERIC(8, 4) DEFAULT 0,
  popularity_rank INTEGER DEFAULT 0,
  weekly_growth NUMERIC(8, 4) DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.prompt_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Analytics viewable by everyone" ON public.prompt_analytics;
CREATE POLICY "Analytics viewable by everyone" ON public.prompt_analytics FOR SELECT USING (true);

-- TABLE: prompt_daily_analytics
CREATE TABLE IF NOT EXISTS public.prompt_daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  copies INTEGER DEFAULT 0,
  bookmarks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (prompt_id, date)
);
ALTER TABLE public.prompt_daily_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Daily analytics viewable by everyone" ON public.prompt_daily_analytics;
CREATE POLICY "Daily analytics viewable by everyone" ON public.prompt_daily_analytics FOR SELECT USING (true);

-- TABLE: prompt_events (Partitioned Event Stream)
CREATE TABLE IF NOT EXISTS public.prompt_events (
  id UUID DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL,
  user_id UUID,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'copy', 'bookmark', 'share', 'comment', 'download', 'rating')),
  event_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS public.prompt_events_default PARTITION OF public.prompt_events DEFAULT;
CREATE INDEX IF NOT EXISTS idx_prompt_events_prompt_id ON public.prompt_events(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_events_type_time ON public.prompt_events(event_type, created_at DESC);
ALTER TABLE public.prompt_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can log events" ON public.prompt_events;
CREATE POLICY "Anyone can log events" ON public.prompt_events FOR INSERT WITH CHECK (auth.role() IN ('authenticated', 'anon'));
DROP POLICY IF EXISTS "Admins can view events" ON public.prompt_events;
CREATE POLICY "Admins can view events" ON public.prompt_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.authors WHERE user_id = auth.uid() AND is_admin = true)
);

-- ============================================================================
-- PHASE 5: MODERATION, REPUTATION & AUDITING TABLES
-- ============================================================================

-- TABLE: rejected_prompts
CREATE TABLE IF NOT EXISTS public.rejected_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_prompt_id UUID NOT NULL,
  author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  tags TEXT[],
  parameters JSONB,
  examples JSONB,
  prompt_type_id UUID REFERENCES public.prompt_types(id) ON DELETE SET NULL,
  image_url TEXT,
  visibility TEXT,
  metadata JSONB,
  system_prompt TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  expected_output TEXT,
  rejection_reason TEXT NOT NULL,
  rejected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rejected_by UUID NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
  original_created_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retained_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);
CREATE INDEX IF NOT EXISTS idx_rejected_prompts_author_id ON public.rejected_prompts(author_id);
ALTER TABLE public.rejected_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authors or admins view rejected prompts" ON public.rejected_prompts;
CREATE POLICY "Authors or admins view rejected prompts" ON public.rejected_prompts FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM public.authors WHERE id = author_id) OR EXISTS (SELECT 1 FROM public.authors WHERE user_id = auth.uid() AND is_admin = true)
);

-- TABLE: moderation_logs
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'restored', 'deleted')),
  old_status TEXT,
  new_status TEXT,
  reason TEXT,
  performed_by UUID NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view moderation logs" ON public.moderation_logs;
CREATE POLICY "Admins can view moderation logs" ON public.moderation_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.authors WHERE user_id = auth.uid() AND is_admin = true)
);

-- TABLE: moderation_queue
CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view moderation queue" ON public.moderation_queue;
CREATE POLICY "Admins view moderation queue" ON public.moderation_queue FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.authors WHERE user_id = auth.uid() AND is_admin = true)
);

-- TABLE: author_reputation_logs
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

-- TABLE: feedback
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
DROP POLICY IF EXISTS "Admins can view feedback" ON public.feedback;
CREATE POLICY "Admins can view feedback" ON public.feedback FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.authors WHERE user_id = auth.uid() AND is_admin = true)
);
DROP POLICY IF EXISTS "Admins can update feedback" ON public.feedback;
CREATE POLICY "Admins can update feedback" ON public.feedback FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.authors WHERE user_id = auth.uid() AND is_admin = true)
);
DROP POLICY IF EXISTS "Admins can delete feedback" ON public.feedback;
CREATE POLICY "Admins can delete feedback" ON public.feedback FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.authors WHERE user_id = auth.uid() AND is_admin = true)
);

-- TABLE: audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.authors WHERE user_id = auth.uid() AND is_admin = true)
);

-- ============================================================================
-- PHASE 6: STORAGE BUCKET CONFIGURATION
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('prompt-assets', 'prompt-assets', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/json', 'text/plain'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public Storage Read Access" ON storage.objects;
CREATE POLICY "Public Storage Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'prompt-assets');

DROP POLICY IF EXISTS "Authenticated Upload Access" ON storage.objects;
CREATE POLICY "Authenticated Upload Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'prompt-assets' AND auth.role() = 'authenticated');

-- ============================================================================
-- PHASE 7: AUTOMATION TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function: Generate Unique Author Handle
CREATE OR REPLACE FUNCTION public.generate_unique_author_handle(candidate TEXT, user_uuid UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  normalized TEXT;
  candidate_handle TEXT;
  suffix INTEGER := 0;
BEGIN
  normalized := lower(regexp_replace(coalesce(candidate, 'user'), '[^a-z0-9_.-]', '_', 'g'));
  normalized := regexp_replace(normalized, '_+', '_', 'g');
  normalized := trim(both '_' FROM normalized);
  IF normalized = '' THEN normalized := concat('user_', left(user_uuid::text, 8)); END IF;
  candidate_handle := normalized;
  LOOP
    IF suffix > 0 THEN
      candidate_handle := left(normalized, greatest(1, 48 - length('_' || suffix))) || '_' || suffix;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.authors WHERE handle = candidate_handle) THEN
      RETURN candidate_handle;
    END IF;
    suffix := suffix + 1;
  END LOOP;
END;
$$;

-- Function & Trigger: Create Author Profile for Auth User
CREATE OR REPLACE FUNCTION public.create_author_profile_for_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  raw_metadata JSONB := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
  candidate_handle TEXT;
  author_name TEXT;
  github_profile TEXT;
  avatar_url TEXT;
  github_id TEXT;
BEGIN
  PERFORM set_config('row_security', 'off', true);

  author_name := coalesce(raw_metadata->>'name', raw_metadata->>'full_name', split_part(NEW.email, '@', 1), concat('User ', left(NEW.id::text, 8)));
  candidate_handle := coalesce(raw_metadata->>'login', raw_metadata->>'username', split_part(NEW.email, '@', 1), concat('user_', left(NEW.id::text, 8)));
  github_profile := coalesce(raw_metadata->>'html_url', raw_metadata->>'url', NULL);
  avatar_url := coalesce(raw_metadata->>'avatar_url', NULL);
  github_id := coalesce(raw_metadata->>'id', NULL);

  INSERT INTO public.authors (
    user_id, github_id, handle, name, avatar_url, bio, website, github, verified, reputation, created_at, updated_at
  ) VALUES (
    NEW.id, github_id, public.generate_unique_author_handle(candidate_handle, NEW.id), author_name, avatar_url, NULL, NULL, github_profile, FALSE, 0, NOW(), NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    github_id = EXCLUDED.github_id,
    handle = COALESCE(authors.handle, EXCLUDED.handle),
    name = COALESCE(EXCLUDED.name, authors.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, authors.avatar_url),
    github = COALESCE(EXCLUDED.github, authors.github),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_author_profile_on_auth_user_insert ON auth.users;
CREATE TRIGGER create_author_profile_on_auth_user_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_author_profile_for_auth_user();

-- Trigger Function: Initialize Prompt Metrics
CREATE OR REPLACE FUNCTION public.initialize_prompt_metrics()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.prompt_metrics (prompt_id, views, copies, bookmarks, rating_count, rating_average)
  VALUES (NEW.id, 0, 0, 0, 0, 0)
  ON CONFLICT (prompt_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_initialize_prompt_metrics ON public.prompts;
CREATE TRIGGER trigger_initialize_prompt_metrics
  AFTER INSERT ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.initialize_prompt_metrics();

-- Trigger Function: Audit Prompt Changes
CREATE OR REPLACE FUNCTION public.audit_prompt_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    table_name, record_id, action, old_data, new_data, user_id, ip_address, user_agent
  ) VALUES (
    TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    auth.uid(), inet_client_addr(),
    CASE WHEN current_setting('request.headers', true) IS NOT NULL AND current_setting('request.headers', true) != '' THEN current_setting('request.headers', true)::json->>'user-agent' ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_prompts_trigger ON public.prompts;
CREATE TRIGGER audit_prompts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.audit_prompt_changes();

-- Trigger Function: Tag & Platform Usage Counters
CREATE OR REPLACE FUNCTION public.update_tag_usage_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = OLD.tag_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS update_tag_usage_on_insert ON public.prompt_tags;
CREATE TRIGGER update_tag_usage_on_insert AFTER INSERT ON public.prompt_tags FOR EACH ROW EXECUTE FUNCTION public.update_tag_usage_count();
DROP TRIGGER IF EXISTS update_tag_usage_on_delete ON public.prompt_tags;
CREATE TRIGGER update_tag_usage_on_delete AFTER DELETE ON public.prompt_tags FOR EACH ROW EXECUTE FUNCTION public.update_tag_usage_count();

CREATE OR REPLACE FUNCTION public.update_platform_usage_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.ai_platforms SET usage_count = usage_count + 1 WHERE id = NEW.ai_platform_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.ai_platforms SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = OLD.ai_platform_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS update_platform_usage_on_insert ON public.prompt_ai_platforms;
CREATE TRIGGER update_platform_usage_on_insert AFTER INSERT ON public.prompt_ai_platforms FOR EACH ROW EXECUTE FUNCTION public.update_platform_usage_count();
DROP TRIGGER IF EXISTS update_platform_usage_on_delete ON public.prompt_ai_platforms;
CREATE TRIGGER update_platform_usage_on_delete AFTER DELETE ON public.prompt_ai_platforms FOR EACH ROW EXECUTE FUNCTION public.update_platform_usage_count();

-- Trigger Function: Prompt Quality Score
CREATE OR REPLACE FUNCTION public.update_prompt_quality_score()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  rating_avg NUMERIC;
  is_prompt_verified BOOLEAN := false;
BEGIN
  SELECT avg(rating_value) INTO rating_avg FROM public.ratings WHERE prompt_id = NEW.prompt_id;
  SELECT coalesce(verified, false) INTO is_prompt_verified FROM public.prompts WHERE id = NEW.prompt_id;

  UPDATE public.prompts 
  SET quality_score = LEAST(
    coalesce(rating_avg::numeric(3, 2), 0) * 0.4 +
    LEAST(1.0, coalesce((SELECT count(*) FROM public.prompt_examples WHERE prompt_id = NEW.prompt_id), 0) * 0.2) +
    LEAST(1.0, coalesce((SELECT count(*) FROM public.prompt_tags WHERE prompt_id = NEW.prompt_id), 0) * 0.2) +
    CASE WHEN is_prompt_verified THEN 1.0 ELSE 0 END * 0.2,
    5.0
  )
  WHERE id = NEW.prompt_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_quality_score_on_rating ON public.ratings;
CREATE TRIGGER update_quality_score_on_rating AFTER INSERT OR UPDATE ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.update_prompt_quality_score();

-- ============================================================================
-- PHASE 8: RPC FUNCTIONS & REPUTATION ENGINE
-- ============================================================================

-- Function: Recalculate Author Reputation
CREATE OR REPLACE FUNCTION public.recalculate_author_reputation(p_user_id_input UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_author_id UUID;
  v_user_id UUID;
  v_is_verified BOOLEAN := false;
  v_approved_count INT := 0;
  v_5star_count INT := 0;
  v_4star_count INT := 0;
  v_admin_adjustments INT := 0;
  v_total INT := 0;
BEGIN
  IF p_user_id_input IS NULL THEN RETURN 0; END IF;

  SELECT id, user_id, coalesce(verified, false)
  INTO v_author_id, v_user_id, v_is_verified
  FROM public.authors
  WHERE user_id = p_user_id_input OR id = p_user_id_input
  LIMIT 1;

  IF v_author_id IS NULL THEN RETURN 0; END IF;

  SELECT count(*) INTO v_approved_count FROM public.prompts WHERE author_id = v_author_id AND moderation_status = 'approved';

  SELECT count(*) INTO v_5star_count
  FROM public.ratings r JOIN public.prompts p ON p.id = r.prompt_id
  WHERE p.author_id = v_author_id AND p.moderation_status = 'approved' AND r.rating_value = 5 AND r.user_id != v_user_id;

  SELECT count(*) INTO v_4star_count
  FROM public.ratings r JOIN public.prompts p ON p.id = r.prompt_id
  WHERE p.author_id = v_author_id AND p.moderation_status = 'approved' AND r.rating_value = 4 AND r.user_id != v_user_id;

  SELECT coalesce(sum(points), 0) INTO v_admin_adjustments
  FROM public.author_reputation_logs
  WHERE author_id = v_author_id AND event_type = 'admin_adjustment';

  v_total := (v_approved_count * 50) + (v_5star_count * 10) + (v_4star_count * 5) + (CASE WHEN v_is_verified THEN 100 ELSE 0 END) + v_admin_adjustments;
  IF v_total < 0 THEN v_total := 0; END IF;

  UPDATE public.authors SET reputation = v_total, updated_at = now() WHERE id = v_author_id;
  RETURN v_total;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_author_reputation(user_id_input UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN public.recalculate_author_reputation(user_id_input);
END;
$$;

-- RPC: Rate Prompt
CREATE OR REPLACE FUNCTION public.rate_prompt(prompt_id_input UUID, rating_input INT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_author_id UUID;
  v_count INT;
  v_avg NUMERIC;
  v_existing_id UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Must be authenticated to rate prompts'; END IF;
  IF rating_input < 1 OR rating_input > 5 THEN RAISE EXCEPTION 'Rating must be an integer between 1 and 5'; END IF;

  SELECT id INTO v_author_id FROM public.authors WHERE user_id = v_user_id LIMIT 1;
  SELECT id INTO v_existing_id FROM public.ratings WHERE prompt_id = prompt_id_input AND user_id = v_user_id LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.ratings SET rating_value = rating_input, updated_at = now() WHERE id = v_existing_id;
  ELSE
    INSERT INTO public.ratings (prompt_id, user_id, rating_value, created_at, updated_at)
    VALUES (prompt_id_input, v_user_id, rating_input, now(), now());
  END IF;

  SELECT count(*), round(avg(rating_value)::numeric, 1) INTO v_count, v_avg FROM public.ratings WHERE prompt_id = prompt_id_input;

  UPDATE public.prompt_metrics
  SET rating_count = coalesce(v_count, 0), rating_average = coalesce(v_avg, 0), updated_at = now()
  WHERE prompt_id = prompt_id_input;

  RETURN jsonb_build_object('success', true, 'rating_average', coalesce(v_avg, 0), 'rating_count', coalesce(v_count, 0), 'user_rating', rating_input);
END;
$$;

-- RPC: Get Prompt Rating Summary
CREATE OR REPLACE FUNCTION public.get_prompt_rating_summary(p_prompt_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_count INT := 0;
  v_avg NUMERIC := NULL;
  v_user_rating INT := NULL;
  v_c5 INT := 0; v_c4 INT := 0; v_c3 INT := 0; v_c2 INT := 0; v_c1 INT := 0;
BEGIN
  SELECT count(*), round(avg(rating_value)::numeric, 1) INTO v_count, v_avg FROM public.ratings WHERE prompt_id = p_prompt_id;
  IF v_user_id IS NOT NULL THEN
    SELECT rating_value INTO v_user_rating FROM public.ratings WHERE prompt_id = p_prompt_id AND user_id = v_user_id LIMIT 1;
  END IF;

  SELECT count(*) FILTER (WHERE rating_value = 5), count(*) FILTER (WHERE rating_value = 4),
         count(*) FILTER (WHERE rating_value = 3), count(*) FILTER (WHERE rating_value = 2),
         count(*) FILTER (WHERE rating_value = 1)
  INTO v_c5, v_c4, v_c3, v_c2, v_c1 FROM public.ratings WHERE prompt_id = p_prompt_id;

  RETURN jsonb_build_object(
    'rating_count', v_count,
    'average_rating', CASE WHEN v_count > 0 THEN v_avg ELSE NULL END,
    'user_rating', v_user_rating,
    'distribution', jsonb_build_object('5', v_c5, '4', v_c4, '3', v_c3, '2', v_c2, '1', v_c1)
  );
END;
$$;

-- RPC: Increment Copy Counter with Deduplication
CREATE OR REPLACE FUNCTION public.increment_prompt_copy(prompt_id_input UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_new_copies INT := 0;
  v_last_event TIMESTAMPTZ;
BEGIN
  IF prompt_id_input IS NULL THEN RAISE EXCEPTION 'prompt_id_input cannot be null'; END IF;

  IF v_user_id IS NOT NULL THEN
    SELECT created_at INTO v_last_event FROM public.prompt_events
    WHERE prompt_id = prompt_id_input AND user_id = v_user_id AND event_type = 'copy'
    ORDER BY created_at DESC LIMIT 1;

    IF v_last_event IS NOT NULL AND v_last_event > (now() - INTERVAL '5 seconds') THEN
      SELECT copies INTO v_new_copies FROM public.prompt_metrics WHERE prompt_id = prompt_id_input;
      RETURN jsonb_build_object('success', true, 'copies', coalesce(v_new_copies, 0), 'deduplicated', true);
    END IF;
  END IF;

  INSERT INTO public.prompt_events (prompt_id, user_id, event_type, event_metadata, created_at)
  VALUES (prompt_id_input, v_user_id, 'copy', jsonb_build_object('timestamp', now()), now());

  INSERT INTO public.prompt_metrics (prompt_id, views, copies, bookmarks, rating_count, rating_average, updated_at)
  VALUES (prompt_id_input, 0, 1, 0, 0, 0, now())
  ON CONFLICT (prompt_id) DO UPDATE SET copies = coalesce(prompt_metrics.copies, 0) + 1, updated_at = now();

  SELECT copies INTO v_new_copies FROM public.prompt_metrics WHERE prompt_id = prompt_id_input;
  RETURN jsonb_build_object('success', true, 'copies', coalesce(v_new_copies, 1), 'deduplicated', false);
END;
$$;

-- RPC: Increment View Counter
CREATE OR REPLACE FUNCTION public.increment_prompt_view(prompt_id_input UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.prompt_events(prompt_id, user_id, event_type, created_at)
  VALUES (prompt_id_input, auth.uid(), 'view', now());

  INSERT INTO public.prompt_metrics(prompt_id, views, updated_at)
  VALUES (prompt_id_input, 1, now())
  ON CONFLICT (prompt_id) DO UPDATE SET views = prompt_metrics.views + 1, updated_at = now();
END;
$$;

-- RPC: Increment Bookmark Counter
CREATE OR REPLACE FUNCTION public.increment_prompt_bookmark(prompt_id_input UUID, delta_input INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.prompt_events(prompt_id, user_id, event_type, event_metadata, created_at)
  VALUES (prompt_id_input, auth.uid(), 'bookmark', jsonb_build_object('delta', delta_input), now());

  INSERT INTO public.prompt_metrics(prompt_id, bookmarks, updated_at)
  VALUES (prompt_id_input, GREATEST(delta_input, 0), now())
  ON CONFLICT (prompt_id) DO UPDATE SET bookmarks = GREATEST(prompt_metrics.bookmarks + delta_input, 0), updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.rate_prompt(uuid, int) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_prompt_rating_summary(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.increment_prompt_copy(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.increment_prompt_view(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.increment_prompt_bookmark(uuid, int) TO authenticated, anon;

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

-- ============================================================================
-- PHASE 9: DATABASE VIEWS
-- ============================================================================

-- VIEW: prompt_details
DROP VIEW IF EXISTS public.prompt_details CASCADE;
CREATE VIEW public.prompt_details AS
SELECT
  p.id,
  p.slug,
  p.title,
  p.short_description,
  p.description,
  p.category_id,
  c.name AS category_name,
  p.subcategory_id,
  sc.name AS subcategory_name,
  p.author_id,
  a.name AS author_name,
  a.handle AS author_handle,
  a.avatar_url AS author_avatar_url,
  a.bio AS author_bio,
  a.website AS author_website,
  a.github AS author_github,
  a.verified AS author_verified,
  a.reputation AS author_reputation,
  coalesce(a_prompt_counts.total_prompts, 0) AS author_total_prompts,
  p.difficulty,
  pt.name AS prompt_type,
  p.license_type,
  p.commercial_use,
  p.attribution_required,
  p.featured,
  p.verified,
  p.community_validated,
  p.current_version,
  p.meta_title,
  p.meta_description,
  p.seo_keywords,
  p.moderation_status,
  p.approved_by AS reviewed_by,
  p.approved_at AS reviewed_at,
  p.created_at,
  p.updated_at,
  pm.views,
  pm.copies,
  pm.likes,
  pm.bookmarks,
  pm.shares,
  pm.comments,
  pm.downloads,
  pm.rating_average AS rating,
  pm.rating_count,
  pm.popularity_rank,
  pm.trending_score,
  pm.weekly_growth,
  pm.has_proof,
  pm.success_rate,
  pm.tested_models,
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
  p.system_prompt,
  p.user_prompt,
  p.expected_output,
  p.prompt_mode,
  p.creator_mode,
  p.pipeline_type,
  p.temperature,
  p.max_tokens,
  p.output_format,
  p.structured_output_schema
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

-- VIEW: prompt_card_rows
CREATE OR REPLACE VIEW public.prompt_card_rows AS
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
  COALESCE(pm.views, 0) AS views,
  COALESCE(pm.copies, 0) AS copies,
  COALESCE(pm.bookmarks, 0) AS bookmarks,
  COALESCE(pm.rating_average, 0)::NUMERIC(10,2) AS rating,
  COALESCE(pm.rating_count, 0) AS rating_count,
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
GROUP BY
  p.id, p.slug, p.title, p.short_description, c.name, sc.name, p.featured, p.verified, p.community_validated,
  pm.views, pm.copies, pm.bookmarks, pm.rating_average, pm.rating_count, pm.has_proof, pm.success_rate,
  a.name, a.handle, a.avatar_url, a.verified, pm.trending_score, pm.weekly_growth, p.prompt_mode, p.updated_at, p.created_at;

-- VIEW: category_summaries
CREATE OR REPLACE VIEW public.category_summaries AS
SELECT 
  c.id, c.slug, c.name, c.description, c.icon_name, c.is_trending, c.sort_order,
  COUNT(DISTINCT p.id) as prompt_count, c.created_at, c.updated_at
FROM public.categories c
LEFT JOIN public.prompts p ON c.id = p.category_id AND p.moderation_status = 'approved'
GROUP BY c.id, c.slug, c.name, c.description, c.icon_name, c.is_trending, c.sort_order, c.created_at, c.updated_at
ORDER BY c.sort_order ASC;

-- VIEW: collection_summaries
CREATE OR REPLACE VIEW public.collection_summaries AS
SELECT 
  c.id, c.slug, c.name, c.description, c.icon_name, c.featured, c.category_id,
  COUNT(DISTINCT cp.prompt_id) as prompt_count, c.created_at, c.updated_at
FROM public.collections c
LEFT JOIN public.collection_prompts cp ON c.id = cp.collection_id
LEFT JOIN public.prompts p ON cp.prompt_id = p.id AND p.moderation_status = 'approved'
GROUP BY c.id, c.slug, c.name, c.description, c.icon_name, c.featured, c.category_id, c.created_at, c.updated_at
ORDER BY COUNT(DISTINCT cp.prompt_id) DESC;

-- VIEW: author_summaries
CREATE OR REPLACE VIEW public.author_summaries AS
SELECT 
  a.id, a.user_id, a.handle, a.name, a.avatar_url, a.bio, a.verified, a.reputation,
  COUNT(DISTINCT p.id) as prompt_count, a.created_at, a.updated_at
FROM public.authors a
LEFT JOIN public.prompts p ON a.id = p.author_id AND p.moderation_status = 'approved'
GROUP BY a.id, a.user_id, a.handle, a.name, a.avatar_url, a.bio, a.verified, a.reputation, a.created_at, a.updated_at
ORDER BY a.reputation DESC;

-- VIEW: prompt_filter_options
CREATE OR REPLACE VIEW public.prompt_filter_options AS
SELECT
  COALESCE(array_agg(DISTINCT pt.name ORDER BY pt.name), '{}') AS prompt_types,
  COALESCE(array_agg(DISTINCT p.difficulty ORDER BY p.difficulty), '{}') AS difficulties
FROM public.prompts p
LEFT JOIN public.prompt_types pt ON pt.id = p.prompt_type_id;

GRANT SELECT ON public.prompt_filter_options TO authenticated, anon;

NOTIFY pgrst, 'reload schema';

COMMIT;
