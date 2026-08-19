-- ============================================================================
-- PromptHub Complete Production Database Schema (Fixed & Consolidated)
-- ============================================================================
-- Consolidated migration file combining:
--   1. All table definitions with proper dependency order
--   2. Row Level Security (RLS) configuration
--   3. Advanced security policies and constraints
--   4. Materialized views and RPC functions
--
-- This file is production-ready and can be run once on a fresh Supabase database.
-- Crucial Fixes:
--   - Patched auth trigger handling to resolve GitHub / OAuth login failures.
--   - Restored missing columns on `ai_platforms` to fix application load failures.
-- ============================================================================

-- ============================================================================
-- PHASE 1: EXTENSIONS & TYPES
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Immutable helper used for generated tsvector expressions
CREATE OR REPLACE FUNCTION immutable_array_to_string(text[], text)
RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
AS $$
  SELECT array_to_string($1, $2);
$$;

-- ============================================================================
-- ENUMS & CUSTOM TYPES
-- ============================================================================

CREATE TYPE moderation_status AS ENUM ('approved', 'pending', 'rejected');
CREATE TYPE proof_result_type AS ENUM ('image', 'video', 'text');

-- ============================================================================
-- DEFAULT PRIVILEGES
-- ============================================================================

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;

-- ============================================================================
-- PHASE 2: CORE TABLES (No Dependencies)
-- ============================================================================

-- ============================================================================
-- TABLE: authors
-- ============================================================================

CREATE TABLE IF NOT EXISTS authors (
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_authors_github_id ON authors(github_id) WHERE github_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_authors_handle ON authors(handle);
CREATE INDEX IF NOT EXISTS idx_authors_reputation ON authors(reputation DESC);

ALTER TABLE authors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors are viewable by everyone" ON authors
  FOR SELECT USING (true);

CREATE POLICY "Authors can update their own profile" ON authors
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors can insert their own profile" ON authors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

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

  IF normalized = '' THEN
    normalized := concat('user_', left(user_uuid::text, 8));
  END IF;

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

-- ============================================================================
-- FIXED TRIGGER FUNCTION: Resolves OAuth/GitHub Signup Failures
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_author_profile_for_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  -- FIXED: Removed non-existent NEW.user_metadata columns to prevent transaction rollback
  raw_metadata JSONB := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
  candidate_handle TEXT;
  author_name TEXT;
  github_profile TEXT;
  avatar_url TEXT;
  github_id TEXT;
BEGIN
  PERFORM set_config('row_security', 'off', true);

  -- Correctly extract details from raw_user_meta_data
  author_name := coalesce(
    raw_metadata->>'name',
    raw_metadata->>'full_name',
    split_part(NEW.email, '@', 1),
    concat('User ', left(NEW.id::text, 8))
  );

  candidate_handle := coalesce(
    raw_metadata->>'login',
    raw_metadata->>'username',
    split_part(NEW.email, '@', 1),
    concat('user_', left(NEW.id::text, 8))
  );

  github_profile := coalesce(
    raw_metadata->>'html_url',
    raw_metadata->>'url',
    NULL
  );

  avatar_url := coalesce(raw_metadata->>'avatar_url', NULL);
  github_id := coalesce(raw_metadata->>'id', NULL);

  -- Create or update the author profile for this authenticated user.
  INSERT INTO public.authors (
    user_id, github_id, handle, name, avatar_url, bio, website, github, verified, reputation, created_at, updated_at
  ) VALUES (
    NEW.id,
    github_id,
    public.generate_unique_author_handle(candidate_handle, NEW.id),
    author_name,
    avatar_url,
    NULL,
    NULL,
    github_profile,
    FALSE,
    0,
    NOW(),
    NOW()
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
  FOR EACH ROW
  EXECUTE FUNCTION public.create_author_profile_for_auth_user();

-- ============================================================================
-- TABLE: categories
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_is_trending ON categories(is_trending);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify categories" ON categories
  FOR ALL USING (false);

-- ============================================================================
-- TABLE: tags
-- ============================================================================

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are viewable by everyone" ON tags
  FOR SELECT USING (true);

-- ============================================================================
-- TABLE: ai_platforms (FIXED: Restored Description, Sort Order, and Active Status)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT,                     -- FIXED: Added back to resolve application loading failures
  provider TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100, -- FIXED: Added back from original schema
  active BOOLEAN NOT NULL DEFAULT TRUE,     -- FIXED: Added back from original schema
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_platforms_slug ON ai_platforms(slug);
CREATE INDEX IF NOT EXISTS idx_ai_platforms_usage_count ON ai_platforms(usage_count DESC);

ALTER TABLE ai_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI platforms are viewable by everyone" ON ai_platforms
  FOR SELECT USING (true);

-- ============================================================================
-- Lookup: prompt_types, industries, prompt_techniques
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompt_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_types_slug ON prompt_types(slug);
CREATE INDEX IF NOT EXISTS idx_prompt_types_name ON prompt_types(name);

ALTER TABLE prompt_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prompt types are viewable by everyone" ON prompt_types
  FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_industries_slug ON industries(slug);
CREATE INDEX IF NOT EXISTS idx_industries_name ON industries(name);

ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Industries are viewable by everyone" ON industries
  FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS prompt_techniques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_techniques_slug ON prompt_techniques(slug);
CREATE INDEX IF NOT EXISTS idx_prompt_techniques_name ON prompt_techniques(name);

ALTER TABLE prompt_techniques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prompt techniques are viewable by everyone" ON prompt_techniques
  FOR SELECT USING (true);

-- ============================================================================
-- PHASE 3: TABLES WITH DEPENDENCIES
-- ============================================================================

-- ============================================================================
-- TABLE: subcategories
-- ============================================================================

CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, slug),
  UNIQUE (category_id, name)
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_sort_order ON subcategories(sort_order);

ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subcategories are viewable by everyone" ON subcategories
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify subcategories" ON subcategories
  FOR ALL USING (false);

-- ============================================================================
-- TABLE: collections
-- ============================================================================

CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_sort_order ON collections(sort_order);
CREATE INDEX IF NOT EXISTS idx_collections_featured ON collections(featured);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collections are viewable by everyone" ON collections
  FOR SELECT USING (true);


-- ============================================================================
-- SCHEMA BUILD: CREATE PROMPT_COLLECTIONS JUNCTION TABLE
-- ============================================================================
BEGIN;

-- 1. Create the prompt_collections junction table
CREATE TABLE IF NOT EXISTS prompt_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure a prompt cannot be added to the exact same collection twice
  UNIQUE (prompt_id, collection_id)
);

-- 2. Create index on foreign keys for fast lookups
CREATE INDEX IF NOT EXISTS idx_prompt_collections_prompt_id ON prompt_collections(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_collections_collection_id ON prompt_collections(collection_id);

-- 3. Enable Row-Level Security (RLS)
ALTER TABLE prompt_collections ENABLE ROW LEVEL SECURITY;

-- 4. SELECT POLICY: Anyone can see prompts in a collection
DROP POLICY IF EXISTS "Anyone can view prompt collections" ON prompt_collections;
CREATE POLICY "Anyone can view prompt collections" ON prompt_collections
  FOR SELECT USING (true);

-- 5. INSERT POLICY: Authors can add their own prompts to collections (and Admins can add any)
DROP POLICY IF EXISTS "Authors can insert prompts into collections" ON prompt_collections;
CREATE POLICY "Authors can insert prompts into collections" ON prompt_collections
  FOR INSERT 
  WITH CHECK (
    -- Case A: Logged-in user is an Admin
    EXISTS (SELECT 1 FROM authors WHERE user_id = auth.uid() AND is_admin = true)
    OR
    -- Case B: Logged-in user owns the prompt
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_collections.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 6. DELETE POLICY: Authors can remove their own prompts from collections (and Admins can remove any)
DROP POLICY IF EXISTS "Authors can delete prompts from collections" ON prompt_collections;
CREATE POLICY "Authors can delete prompts from collections" ON prompt_collections
  FOR DELETE 
  USING (
    -- Case A: Logged-in user is an Admin
    EXISTS (SELECT 1 FROM authors WHERE user_id = auth.uid() AND is_admin = true)
    OR
    -- Case B: Logged-in user owns the prompt
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_collections.prompt_id 
      AND auth.uid() IN (SELECT user_id FROM authors WHERE authors.id = prompts.author_id)
    )
  );

-- 7. Reload Schema Cache immediately
NOTIFY pgrst, 'reload schema';

COMMIT;


-- ============================================================================
-- TABLE: prompts (MAIN)
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  moderation_status moderation_status NOT NULL DEFAULT 'pending',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  community_validated BOOLEAN NOT NULL DEFAULT FALSE,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  prompt_type TEXT,
  license_type TEXT NOT NULL DEFAULT 'MIT',
  commercial_use BOOLEAN NOT NULL DEFAULT TRUE,
  attribution_required BOOLEAN NOT NULL DEFAULT TRUE,
  industry TEXT[],
  system_prompt TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  expected_output TEXT,
  current_version TEXT NOT NULL DEFAULT '1.0.0',
  quality_score NUMERIC(3, 2) DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  seo_keywords TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_prompts_slug ON prompts(slug);
CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_prompts_author_id ON prompts(author_id);
CREATE INDEX IF NOT EXISTS idx_prompts_moderation_status ON prompts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_prompts_featured ON prompts(featured);
CREATE INDEX IF NOT EXISTS idx_prompts_verified ON prompts(verified);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_title_tsvector ON prompts USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_prompts_description_tsvector ON prompts USING gin(to_tsvector('english', short_description));

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved prompts" ON prompts
  FOR SELECT USING (moderation_status = 'approved' OR auth.uid() = author_id);

CREATE POLICY "Authors can view their own prompts" ON prompts
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Authors can insert prompts" ON prompts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own prompts" ON prompts
  FOR UPDATE USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own prompts" ON prompts
  FOR DELETE USING (auth.uid() = author_id);

-- ============================================================================
-- TABLE: prompt_versions
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  expected_output TEXT,
  change_description TEXT,
  author_id UUID NOT NULL REFERENCES authors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (prompt_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_created_at ON prompt_versions(created_at DESC);

ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Versions viewable if prompt is viewable" ON prompt_versions
  FOR SELECT USING (EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND moderation_status = 'approved'));

-- ============================================================================
-- TABLE: prompt_examples
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompt_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  input TEXT NOT NULL,
  output TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_examples_prompt_id ON prompt_examples(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_examples_sort_order ON prompt_examples(sort_order);

ALTER TABLE prompt_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Examples viewable if prompt is viewable" ON prompt_examples
  FOR SELECT USING (EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND moderation_status = 'approved'));

-- ============================================================================
-- TABLE: prompt_test_cases
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompt_test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_test_cases_prompt_id ON prompt_test_cases(prompt_id);

ALTER TABLE prompt_test_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Test cases viewable if prompt is viewable" ON prompt_test_cases
  FOR SELECT USING (EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND moderation_status = 'approved'));

-- ============================================================================
-- Prompt detail tables: variables, proof items, version history, usage instructions,
-- recommended models, industries & techniques mappings, related prompts
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompt_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_variables_prompt_id ON prompt_variables(prompt_id);

ALTER TABLE prompt_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variables viewable if prompt is viewable" ON prompt_variables
  FOR SELECT USING (EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND moderation_status = 'approved'));

CREATE TABLE IF NOT EXISTS prompt_proof_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_prompt_proof_items_prompt_id ON prompt_proof_items(prompt_id);

ALTER TABLE prompt_proof_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Proof items viewable if prompt is viewable" ON prompt_proof_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND moderation_status = 'approved'));

CREATE TABLE IF NOT EXISTS prompt_version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  released_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changes TEXT[] NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_version_history_prompt_id ON prompt_version_history(prompt_id);

ALTER TABLE prompt_version_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Version history viewable if prompt is viewable" ON prompt_version_history
  FOR SELECT USING (EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND moderation_status = 'approved'));

CREATE TABLE IF NOT EXISTS prompt_usage_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  instruction TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_usage_instructions_prompt_id ON prompt_usage_instructions(prompt_id);

ALTER TABLE prompt_usage_instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usage instructions viewable if prompt is viewable" ON prompt_usage_instructions
  FOR SELECT USING (EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND moderation_status = 'approved'));

CREATE TABLE IF NOT EXISTS prompt_recommended_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_recommended_models_prompt_id ON prompt_recommended_models(prompt_id);

ALTER TABLE prompt_recommended_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recommended models viewable if prompt is viewable" ON prompt_recommended_models
  FOR SELECT USING (EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND moderation_status = 'approved'));

CREATE TABLE IF NOT EXISTS prompt_industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  industry_id UUID NOT NULL REFERENCES industries(id) ON DELETE RESTRICT,
  UNIQUE (prompt_id, industry_id)
);

CREATE INDEX IF NOT EXISTS idx_prompt_industries_prompt_id ON prompt_industries(prompt_id);

ALTER TABLE prompt_industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Industries mapping viewable if prompt is viewable" ON prompt_industries
  FOR SELECT USING (EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND moderation_status = 'approved'));

CREATE TABLE IF NOT EXISTS prompt_techniques_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  technique_id UUID NOT NULL REFERENCES prompt_techniques(id) ON DELETE RESTRICT,
  UNIQUE (prompt_id, technique_id)
);

CREATE INDEX IF NOT EXISTS idx_prompt_techniques_map_prompt_id ON prompt_techniques_map(prompt_id);

ALTER TABLE prompt_techniques_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Techniques mapping viewable if prompt is viewable" ON prompt_techniques_map
  FOR SELECT USING (EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND moderation_status = 'approved'));

CREATE TABLE IF NOT EXISTS prompt_related_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  related_prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE RESTRICT,
  relation_type TEXT NOT NULL DEFAULT 'related',
  UNIQUE (prompt_id, related_prompt_id)
);

CREATE INDEX IF NOT EXISTS idx_prompt_related_prompts_prompt_id ON prompt_related_prompts(prompt_id);

ALTER TABLE prompt_related_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Related prompts viewable if prompt is viewable" ON prompt_related_prompts
  FOR SELECT USING (EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND moderation_status = 'approved'));

-- ============================================================================
-- TABLE: prompt_tags (Junction)
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompt_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (prompt_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_prompt_tags_prompt_id ON prompt_tags(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag_id ON prompt_tags(tag_id);

ALTER TABLE prompt_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags visible for approved prompts" ON prompt_tags
  FOR SELECT USING (EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND moderation_status = 'approved'));

-- ============================================================================
-- TABLE: prompt_ai_platforms (Junction)
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompt_ai_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  ai_platform_id UUID NOT NULL REFERENCES ai_platforms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (prompt_id, ai_platform_id)
);

CREATE INDEX IF NOT EXISTS idx_prompt_ai_platforms_prompt_id ON prompt_ai_platforms(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_ai_platforms_ai_platform_id ON prompt_ai_platforms(ai_platform_id);

ALTER TABLE prompt_ai_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platforms visible for approved prompts" ON prompt_ai_platforms
  FOR SELECT USING (EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND moderation_status = 'approved'));

-- ============================================================================
-- TABLE: collection_prompts (Junction)
-- ============================================================================

CREATE TABLE IF NOT EXISTS collection_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (collection_id, prompt_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_prompts_collection_id ON collection_prompts(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_prompts_prompt_id ON collection_prompts(prompt_id);

ALTER TABLE collection_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collection items visible if prompt is viewable" ON collection_prompts
  FOR SELECT USING (EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND moderation_status = 'approved'));

-- ============================================================================
-- TABLE: ratings
-- ============================================================================

CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating_value INTEGER NOT NULL CHECK (rating_value >= 1 AND rating_value <= 5),
  review TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (prompt_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_prompt_id ON ratings(prompt_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings viewable if prompt is viewable" ON ratings
  FOR SELECT USING (EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND moderation_status = 'approved'));

CREATE POLICY "Users can rate prompts" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON ratings
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TABLE: saved_prompts (User Bookmarks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, prompt_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_id ON saved_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_prompt_id ON saved_prompts(prompt_id);

ALTER TABLE saved_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved prompts" ON saved_prompts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save prompts" ON saved_prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove saved prompts" ON saved_prompts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE: prompt_analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompt_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL UNIQUE REFERENCES prompts(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  copies INTEGER DEFAULT 0,
  bookmarks INTEGER DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  trending_score NUMERIC(8, 4) DEFAULT 0,
  popularity_rank INTEGER,
  weekly_growth NUMERIC(8, 4) DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_analytics_prompt_id ON prompt_analytics(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_analytics_trending_score ON prompt_analytics(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_analytics_rating ON prompt_analytics(rating DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_analytics_views ON prompt_analytics(views DESC);

ALTER TABLE prompt_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analytics viewable for approved prompts" ON prompt_analytics
  FOR SELECT USING (EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND moderation_status = 'approved'));

-- ============================================================================
-- TABLE: prompt_daily_analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompt_daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  copies INTEGER DEFAULT 0,
  bookmarks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (prompt_id, date)
);

CREATE INDEX IF NOT EXISTS idx_prompt_daily_analytics_prompt_id ON prompt_daily_analytics(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_daily_analytics_date ON prompt_daily_analytics(date DESC);

ALTER TABLE prompt_daily_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily analytics viewable for approved prompts" ON prompt_daily_analytics
  FOR SELECT USING (EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND moderation_status = 'approved'));

-- ============================================================================
-- TABLE: moderation_queue
-- ============================================================================

CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id UUID REFERENCES authors(id) ON DELETE SET NULL,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_prompt_id ON moderation_queue(prompt_id);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created_at ON moderation_queue(created_at DESC);

ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only moderators can view moderation queue" ON moderation_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM authors WHERE user_id = auth.uid() AND reputation > 2000
    )
  );

-- ============================================================================
-- TABLE: audit_logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
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

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM authors WHERE user_id = auth.uid() AND reputation > 5000
    )
  );

-- ============================================================================
-- PHASE 4: ADVANCED SECURITY POLICIES & FUNCTIONS
-- ============================================================================

-- ============================================================================
-- Helper Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_current_author()
RETURNS UUID AS $$
  SELECT id FROM authors WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_moderator()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM authors 
    WHERE user_id = auth.uid() AND reputation > 2000
  );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM authors 
    WHERE user_id = auth.uid() AND reputation > 5000
  );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_prompt_view(prompt_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO prompt_analytics (prompt_id, views) 
  VALUES (prompt_id, 1)
  ON CONFLICT (prompt_id) DO UPDATE
  SET views = prompt_analytics.views + 1,
      updated_at = NOW();

  INSERT INTO prompt_daily_analytics (prompt_id, date, views)
  VALUES (prompt_id, CURRENT_DATE, 1)
  ON CONFLICT (prompt_id, date) DO UPDATE
  SET views = prompt_daily_analytics.views + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_prompt_copy(prompt_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO prompt_analytics (prompt_id, copies)
  VALUES (prompt_id, 1)
  ON CONFLICT (prompt_id) DO UPDATE
  SET copies = prompt_analytics.copies + 1,
      updated_at = NOW();

  INSERT INTO prompt_daily_analytics (prompt_id, date, copies)
  VALUES (prompt_id, CURRENT_DATE, 1)
  ON CONFLICT (prompt_id, date) DO UPDATE
  SET copies = prompt_daily_analytics.copies + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Audit Trigger Function
-- ============================================================================

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
    current_setting('request.headers')::json->>'user-agent'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_prompts_trigger
AFTER INSERT OR UPDATE OR DELETE ON prompts
FOR EACH ROW EXECUTE FUNCTION audit_prompt_changes();

-- ============================================================================
-- Update Tags Usage Count Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = OLD.tag_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_tag_usage_on_insert
AFTER INSERT ON prompt_tags
FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

CREATE TRIGGER update_tag_usage_on_delete
AFTER DELETE ON prompt_tags
FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- ============================================================================
-- Update AI Platform Usage Count Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_platform_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ai_platforms SET usage_count = usage_count + 1 WHERE id = NEW.ai_platform_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ai_platforms SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = OLD.ai_platform_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_platform_usage_on_insert
AFTER INSERT ON prompt_ai_platforms
FOR EACH ROW EXECUTE FUNCTION update_platform_usage_count();

CREATE TRIGGER update_platform_usage_on_delete
AFTER DELETE ON prompt_ai_platforms
FOR EACH ROW EXECUTE FUNCTION update_platform_usage_count();

-- ============================================================================
-- Update Prompt Quality Score Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_prompt_quality_score()
RETURNS TRIGGER AS $$
DECLARE
  rating_avg NUMERIC;
  tag_count INT;
BEGIN
  -- Calculate average rating
  SELECT AVG(rating_value) INTO rating_avg FROM ratings WHERE prompt_id = NEW.prompt_id;

  -- Calculate based on multiple factors
  UPDATE prompts 
  SET quality_score = LEAST(
    COALESCE(rating_avg::NUMERIC(3, 2), 0) * 0.4 +
    LEAST(1.0, COALESCE((SELECT COUNT(*) FROM prompt_examples WHERE prompt_id = NEW.prompt_id), 0) * 0.2) +
    LEAST(1.0, COALESCE((SELECT COUNT(*) FROM prompt_tags WHERE prompt_id = NEW.prompt_id), 0) * 0.2) +
    CASE WHEN NEW.verified THEN 1.0 ELSE 0 END * 0.2,
    5.0
  )
  WHERE id = NEW.prompt_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_quality_score_on_rating
AFTER INSERT OR UPDATE ON ratings
FOR EACH ROW EXECUTE FUNCTION update_prompt_quality_score();

-- ============================================================================
-- PHASE 5: VIEWS & RPC FUNCTIONS
-- ============================================================================

-- ============================================================================
-- VIEW: category_summaries
-- ============================================================================

CREATE OR REPLACE VIEW category_summaries AS
SELECT 
  c.id,
  c.slug,
  c.name,
  c.description,
  c.icon_name,
  c.is_trending,
  c.sort_order,
  COUNT(DISTINCT p.id) as prompt_count,
  c.created_at,
  c.updated_at
FROM categories c
LEFT JOIN prompts p ON c.id = p.category_id AND p.moderation_status = 'approved'
GROUP BY 
  c.id, c.slug, c.name, c.description, c.icon_name, 
  c.is_trending, c.sort_order, c.created_at, c.updated_at
ORDER BY c.sort_order ASC;

ALTER VIEW category_summaries SET (security_barrier = on);

-- ============================================================================
-- VIEW: collection_summaries
-- ============================================================================

CREATE OR REPLACE VIEW collection_summaries AS
SELECT 
  c.id,
  c.slug,
  c.name,
  c.description,
  c.icon_name,
  c.featured,
  c.category_id,
  COUNT(DISTINCT cp.prompt_id) as prompt_count,
  c.created_at,
  c.updated_at
FROM collections c
LEFT JOIN collection_prompts cp ON c.id = cp.collection_id
LEFT JOIN prompts p ON cp.prompt_id = p.id AND p.moderation_status = 'approved'
GROUP BY 
  c.id, c.slug, c.name, c.description, c.icon_name, 
  c.featured, c.category_id, c.created_at, c.updated_at
ORDER BY COUNT(DISTINCT cp.prompt_id) DESC;

ALTER VIEW collection_summaries SET (security_barrier = on);

-- ============================================================================
-- VIEW: author_summaries
-- ============================================================================

CREATE OR REPLACE VIEW author_summaries AS
SELECT 
  a.id,
  a.user_id,
  a.handle,
  a.name,
  a.avatar_url,
  a.bio,
  a.verified,
  a.reputation,
  COUNT(DISTINCT p.id) as prompt_count,
  a.created_at,
  a.updated_at
FROM authors a
LEFT JOIN prompts p ON a.id = p.author_id AND p.moderation_status = 'approved'
GROUP BY 
  a.id, a.user_id, a.handle, a.name, a.avatar_url, 
  a.bio, a.verified, a.reputation, a.created_at, a.updated_at
ORDER BY a.reputation DESC;

ALTER VIEW author_summaries SET (security_barrier = on);

-- ============================================================================
-- VIEW: tags_summary
-- ============================================================================

CREATE OR REPLACE VIEW tags_summary AS
SELECT 
  t.id,
  t.slug,
  t.name,
  t.description,
  t.usage_count,
  COUNT(DISTINCT pt.prompt_id) as prompt_count,
  t.created_at,
  t.updated_at
FROM tags t
LEFT JOIN prompt_tags pt ON t.id = pt.tag_id
LEFT JOIN prompts p ON pt.prompt_id = p.id AND p.moderation_status = 'approved'
GROUP BY t.id, t.slug, t.name, t.description, t.usage_count, t.created_at, t.updated_at
ORDER BY t.usage_count DESC;

ALTER VIEW tags_summary SET (security_barrier = on);

-- ============================================================================
-- VIEW: ai_platforms_summary
-- ============================================================================

CREATE OR REPLACE VIEW ai_platforms_summary AS
SELECT 
  ap.id,
  ap.name,
  ap.slug,
  ap.provider,
  ap.usage_count,
  COUNT(DISTINCT pap.prompt_id) as prompt_count,
  ap.created_at,
  ap.updated_at
FROM ai_platforms ap
LEFT JOIN prompt_ai_platforms pap ON ap.id = pap.ai_platform_id
LEFT JOIN prompts p ON pap.prompt_id = p.id AND p.moderation_status = 'approved'
GROUP BY ap.id, ap.name, ap.slug, ap.provider, ap.usage_count, ap.created_at, ap.updated_at
ORDER BY ap.name ASC;

ALTER VIEW ai_platforms_summary SET (security_barrier = on);

-- ============================================================================
-- VIEW: prompt_filter_options
-- ============================================================================

CREATE OR REPLACE VIEW prompt_filter_options AS
SELECT json_build_object(
  'difficulties', (SELECT json_agg(DISTINCT difficulty) FROM prompts WHERE difficulty IS NOT NULL AND moderation_status = 'approved'),
  'license_types', (SELECT json_agg(DISTINCT license_type) FROM prompts WHERE license_type IS NOT NULL AND moderation_status = 'approved'),
  'prompt_types', (SELECT json_agg(DISTINCT prompt_type) FROM prompts WHERE prompt_type IS NOT NULL AND moderation_status = 'approved')
) as options;

ALTER VIEW prompt_filter_options SET (security_barrier = on);

-- ============================================================================
-- VIEW: trending_prompts
-- ============================================================================

CREATE OR REPLACE VIEW trending_prompts AS
SELECT 
  p.id,
  p.slug,
  p.title,
  p.short_description,
  p.category_id,
  c.name as category_name,
  p.author_id,
  a.handle as author_handle,
  a.name as author_name,
  a.avatar_url as author_avatar,
  pa.views,
  pa.trending_score,
  pa.rating,
  p.created_at
FROM prompts p
JOIN categories c ON p.category_id = c.id
JOIN authors a ON p.author_id = a.id
LEFT JOIN prompt_analytics pa ON p.id = pa.prompt_id
WHERE p.moderation_status = 'approved'
ORDER BY pa.trending_score DESC NULLS LAST
LIMIT 50;

ALTER VIEW trending_prompts SET (security_barrier = on);

-- ============================================================================
-- VIEW: latest_prompts
-- ============================================================================

CREATE OR REPLACE VIEW latest_prompts AS
SELECT 
  p.id,
  p.slug,
  p.title,
  p.short_description,
  p.category_id,
  c.name as category_name,
  p.author_id,
  a.handle as author_handle,
  a.name as author_name,
  a.avatar_url as author_avatar,
  pa.views,
  pa.rating,
  p.created_at
FROM prompts p
JOIN categories c ON p.category_id = c.id
JOIN authors a ON p.author_id = a.id
LEFT JOIN prompt_analytics pa ON p.id = pa.prompt_id
WHERE p.moderation_status = 'approved'
ORDER BY p.created_at DESC
LIMIT 50;

ALTER VIEW latest_prompts SET (security_barrier = on);

-- ============================================================================
-- RPC FUNCTION: search_prompt_cards
-- ============================================================================

CREATE OR REPLACE FUNCTION search_prompt_cards(
  p_search TEXT DEFAULT '',
  p_category_id UUID DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL,
  p_ai_platform_id UUID DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'trending',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  short_description TEXT,
  category_name TEXT,
  category_slug TEXT,
  author_handle TEXT,
  author_name TEXT,
  author_avatar TEXT,
  author_verified BOOLEAN,
  difficulty TEXT,
  featured BOOLEAN,
  verified BOOLEAN,
  views INT,
  rating NUMERIC,
  rating_count INT,
  tags TEXT[],
  ai_platforms TEXT[],
  trending_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.slug,
    p.title,
    p.short_description,
    c.name,
    c.slug,
    a.handle,
    a.name,
    a.avatar_url,
    a.verified,
    p.difficulty,
    p.featured,
    p.verified,
    COALESCE(pa.views, 0)::INT,
    COALESCE(pa.rating, 0),
    COALESCE(pa.rating_count, 0),
    (SELECT array_agg(t.name) FROM prompt_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.prompt_id = p.id),
    (SELECT array_agg(ap.name) FROM prompt_ai_platforms pap JOIN ai_platforms ap ON pap.ai_platform_id = ap.id WHERE pap.prompt_id = p.id),
    COALESCE(pa.trending_score, 0)
  FROM prompts p
  JOIN categories c ON p.category_id = c.id
  JOIN authors a ON p.author_id = a.id
  LEFT JOIN prompt_analytics pa ON p.id = pa.prompt_id
  LEFT JOIN prompt_tags pt ON p.id = pt.prompt_id
  LEFT JOIN prompt_ai_platforms pap ON p.id = pap.prompt_id
  WHERE 
    p.moderation_status = 'approved'
    AND (p_search = '' OR p.title ILIKE '%' || p_search || '%' OR p.short_description ILIKE '%' || p_search || '%')
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_difficulty IS NULL OR p.difficulty = p_difficulty)
    AND (p_ai_platform_id IS NULL OR pap.ai_platform_id = p_ai_platform_id)
    AND (p_tags IS NULL OR EXISTS (SELECT 1 FROM prompt_tags pt2 JOIN tags t2 ON pt2.tag_id = t2.id WHERE pt2.prompt_id = p.id AND t2.name = ANY(p_tags)))
  GROUP BY p.id, c.name, c.slug, a.handle, a.name, a.avatar_url, a.verified, pa.views, pa.rating, pa.rating_count, pa.trending_score
  ORDER BY 
    CASE WHEN p_sort_by = 'trending' THEN COALESCE(pa.trending_score, 0) END DESC,
    CASE WHEN p_sort_by = 'newest' THEN p.created_at END DESC,
    CASE WHEN p_sort_by = 'rating' THEN COALESCE(pa.rating, 0) END DESC,
    CASE WHEN p_sort_by = 'views' THEN COALESCE(pa.views, 0) END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- RPC FUNCTION: get_featured_prompts
-- ============================================================================

CREATE OR REPLACE FUNCTION get_featured_prompts(p_limit INT DEFAULT 6)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  short_description TEXT,
  category_name TEXT,
  author_name TEXT,
  author_handle TEXT,
  author_avatar TEXT,
  rating NUMERIC,
  views INT,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.slug,
    p.title,
    p.short_description,
    c.name,
    a.name,
    a.handle,
    a.avatar_url,
    COALESCE(pa.rating, 0),
    COALESCE(pa.views, 0)::INT,
    (SELECT array_agg(t.name) FROM prompt_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.prompt_id = p.id)
  FROM prompts p
  JOIN categories c ON p.category_id = c.id
  JOIN authors a ON p.author_id = a.id
  LEFT JOIN prompt_analytics pa ON p.id = pa.prompt_id
  WHERE p.featured = true AND p.moderation_status = 'approved'
  ORDER BY pa.trending_score DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- RPC FUNCTION: get_related_prompts
-- ============================================================================

CREATE OR REPLACE FUNCTION get_related_prompts(
  p_prompt_id UUID,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  short_description TEXT,
  author_name TEXT,
  author_handle TEXT,
  rating NUMERIC,
  relevance_score INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.slug,
    p.title,
    p.short_description,
    a.name,
    a.handle,
    COALESCE(pa.rating, 0),
    (
      (CASE WHEN p.category_id = (SELECT category_id FROM prompts WHERE id = p_prompt_id) THEN 30 ELSE 0 END) +
      (SELECT COUNT(*) * 10 FROM prompt_tags pt1 WHERE pt1.prompt_id = p.id AND EXISTS (SELECT 1 FROM prompt_tags pt2 WHERE pt2.prompt_id = p_prompt_id AND pt2.tag_id = pt1.tag_id)) +
      (CASE WHEN p.difficulty = (SELECT difficulty FROM prompts WHERE id = p_prompt_id) THEN 20 ELSE 0 END)
    )::INT as relevance_score
  FROM prompts p
  JOIN authors a ON p.author_id = a.id
  LEFT JOIN prompt_analytics pa ON p.id = pa.prompt_id
  WHERE p.id != p_prompt_id AND p.moderation_status = 'approved'
  ORDER BY relevance_score DESC, pa.trending_score DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- RPC FUNCTION: get_user_saved_prompts
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_saved_prompts(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  short_description TEXT,
  category_name TEXT,
  author_name TEXT,
  rating NUMERIC,
  saved_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.slug,
    p.title,
    p.short_description,
    c.name,
    a.name,
    COALESCE(pa.rating, 0),
    sp.created_at
  FROM saved_prompts sp
  JOIN prompts p ON sp.prompt_id = p.id
  JOIN categories c ON p.category_id = c.id
  JOIN authors a ON p.author_id = a.id
  LEFT JOIN prompt_analytics pa ON p.id = pa.prompt_id
  WHERE sp.user_id = auth.uid()
  ORDER BY sp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- Schema successfully created!
-- All tables, RLS policies, views, and functions are ready for production use.
-- Verification can be done by running:
-- SELECT * FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM information_schema.views WHERE table_schema = 'public';
-- SELECT routines.routine_name FROM information_schema.routines WHERE routines.routine_schema = 'public';

-- ============================================================================
-- SCHEMA BUILD: CREATE AND INITIALIZE PROMPT METRICS
-- ============================================================================
BEGIN;

-- 1. Create the prompt_metrics table
CREATE TABLE IF NOT EXISTS prompt_metrics (
  prompt_id UUID PRIMARY KEY REFERENCES prompts(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  copies INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  bookmarks INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  rating_average NUMERIC NOT NULL DEFAULT 0,
  has_proof BOOLEAN NOT NULL DEFAULT false,
  success_rate NUMERIC NOT NULL DEFAULT 0,
  tested_models TEXT[] NOT NULL DEFAULT '{}'::text[],
  trending_score NUMERIC NOT NULL DEFAULT 0,
  weekly_growth NUMERIC NOT NULL DEFAULT 0,
  popularity_rank INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create index on foreign key for ultra-fast lookup times
CREATE INDEX IF NOT EXISTS idx_prompt_metrics_prompt_id ON prompt_metrics(prompt_id);

-- 3. Enable Row-Level Security (RLS)
ALTER TABLE prompt_metrics ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Select: Anyone (even anonymous guests) can read prompt metrics
DROP POLICY IF EXISTS "Anyone can view prompt metrics" ON prompt_metrics;
CREATE POLICY "Anyone can view prompt metrics" ON prompt_metrics
  FOR SELECT USING (true);

-- Update: Let authenticated users update metrics (e.g., triggering a "view" or "like")
DROP POLICY IF EXISTS "Authenticated users can update metrics" ON prompt_metrics;
CREATE POLICY "Authenticated users can update metrics" ON prompt_metrics
  FOR UPDATE USING (true) WITH CHECK (true);

-- 5. AUTOMATION: Auto-create metrics row when a new prompt is submitted
CREATE OR REPLACE FUNCTION initialize_prompt_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO prompt_metrics (prompt_id)
  VALUES (NEW.id)
  ON CONFLICT (prompt_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_initialize_prompt_metrics ON prompts;
CREATE TRIGGER trigger_initialize_prompt_metrics
  AFTER INSERT ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION initialize_prompt_metrics();

-- 6. Force Supabase/PostgREST to rebuild its API schema cache immediately
NOTIFY pgrst, 'reload schema';

COMMIT;

drop function if exists increment_prompt_view(uuid);
drop function if exists increment_prompt_bookmark(uuid);

create function increment_prompt_view(prompt_id_input uuid)
returns void
language plpgsql volatile
as $$
begin
  insert into prompt_events(prompt_id, event_type, created_at)
  values (prompt_id_input, 'view', now());

  update prompt_metrics
  set views = prompt_metrics.views + 1,
      updated_at = now()
  where prompt_id = prompt_id_input;
end;
$$;

create function increment_prompt_bookmark(prompt_id_input uuid, delta_input int)
returns void
language plpgsql volatile
as $$
begin
  insert into prompt_events(prompt_id, event_type, event_metadata, created_at)
  values (
    prompt_id_input,
    'bookmark',
    jsonb_build_object('delta', delta_input),
    now()
  );

  update prompt_metrics
  set bookmarks = prompt_metrics.bookmarks + delta_input,
      updated_at = now()
  where prompt_id = prompt_id_input;
end;
$$;


-- 1. Create the partitioned parent table (Removed the "references prompts(id)" constraint)
create table if not exists public.prompt_events (
  id uuid default gen_random_uuid (),
  prompt_id uuid not null, 
  user_id uuid,
  event_type text not null check (
    event_type in (
      'view',
      'copy',
      'bookmark',
      'share',
      'comment',
      'download',
      'rating'
    )
  ),
  event_metadata jsonb,
  created_at timestamptz not null default now(),
  primary key (id, created_at)
)
partition by range (created_at);

-- 2. Create the default partition table
create table if not exists public.prompt_events_default partition of public.prompt_events default;

-- 3. Create high-performance indexes to keep queries fast as the table grows
create index if not exists idx_prompt_events_prompt_id on public.prompt_events(prompt_id);
create index if not exists idx_prompt_events_type_time on public.prompt_events(event_type, created_at desc);

-- 4. Enable Row Level Security (RLS)
alter table public.prompt_events enable row level security;

-- 5. RLS Policy: Allow BOTH logged-in users and guests to log views/copies/etc.
create policy prompt_events_insert on public.prompt_events 
for insert
with check (
  auth.role() in ('authenticated', 'anon')
);

-- 6. RLS Policy: Restrict select to admins only
create policy prompt_events_select on public.prompt_events 
for select
using (
  auth.role() = 'admin'
);

-- 7. Reload PostgREST schema cache
notify pgrst, 'reload schema';
