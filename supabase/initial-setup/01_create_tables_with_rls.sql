-- PromptHub Complete Database Schema with Row Level Security
-- Production-ready setup for new Supabase projects
-- Run this file FIRST to create all tables with proper security policies
-- Generated: 2024-06-10

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ============================================================================
-- ENUMS & TYPES
-- ============================================================================

create type moderation_status as enum ('approved', 'pending', 'rejected');
create type proof_result_type as enum ('image', 'video', 'text');

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;

-- ============================================================================
-- 1. AUTHORS TABLE
-- ============================================================================

create table if not exists authors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  github_id text,
  handle text not null unique check (handle ~ '^@?[A-Za-z0-9_.-]+$'),
  name text not null,
  avatar_url text,
  bio text,
  website text,
  github text,
  verified boolean not null default false,
  reputation integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_authors_github_id on authors(github_id) where github_id is not null;
create index if not exists idx_authors_handle on authors(handle);
create index if not exists idx_authors_reputation on authors(reputation desc);

alter table authors enable row level security;

create policy "Authors are viewable by everyone" on authors
  for select using (true);

create policy "Authors can update their own profile" on authors
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Authors can insert their own profile" on authors
  for insert with check (auth.uid() = user_id);

-- ============================================================================
-- 2. CATEGORIES TABLE
-- ============================================================================

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text,
  icon_name text not null default 'auto_awesome',
  is_trending boolean not null default false,
  sort_order integer not null default 100,
  seo_h1 text,
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_categories_slug on categories(slug);
create index if not exists idx_categories_sort_order on categories(sort_order);
create index if not exists idx_categories_is_trending on categories(is_trending);

alter table categories enable row level security;

create policy "Categories are viewable by everyone" on categories
  for select using (true);

create policy "Only admins can modify categories" on categories
  for all using (false);

-- ============================================================================
-- 3. SUBCATEGORIES TABLE
-- ============================================================================

create table if not exists subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, slug),
  unique (category_id, name)
);

create index if not exists idx_subcategories_category_id on subcategories(category_id);
create index if not exists idx_subcategories_sort_order on subcategories(sort_order);

alter table subcategories enable row level security;

create policy "Subcategories are viewable by everyone" on subcategories
  for select using (true);

create policy "Only admins can modify subcategories" on subcategories
  for all using (false);

-- ============================================================================
-- 4. TAGS TABLE
-- ============================================================================

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text,
  usage_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_tags_slug on tags(slug);
create index if not exists idx_tags_usage_count on tags(usage_count desc);

alter table tags enable row level security;

create policy "Tags are viewable by everyone" on tags
  for select using (true);

-- ============================================================================
-- 5. AI PLATFORMS TABLE
-- ============================================================================

create table if not exists ai_platforms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  provider text,
  usage_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_ai_platforms_slug on ai_platforms(slug);
create index if not exists idx_ai_platforms_usage_count on ai_platforms(usage_count desc);

alter table ai_platforms enable row level security;

create policy "AI platforms are viewable by everyone" on ai_platforms
  for select using (true);

-- ============================================================================
-- 6. COLLECTIONS TABLE
-- ============================================================================

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon_name text,
  category_id uuid references categories(id) on delete set null,
  featured boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_collections_slug on collections(slug);
create index if not exists idx_collections_sort_order on collections(sort_order);
create index if not exists idx_collections_featured on collections(featured);

alter table collections enable row level security;

create policy "Collections are viewable by everyone" on collections
  for select using (true);

-- ============================================================================
-- 7. PROMPTS TABLE (MAIN)
-- ============================================================================

create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  short_description text not null,
  description text,
  category_id uuid not null references categories(id) on delete restrict,
  subcategory_id uuid references subcategories(id) on delete set null,
  author_id uuid not null references authors(id) on delete restrict,
  difficulty text not null default 'Intermediate',
  prompt_type text not null default 'Text Generation',
  industry text[] not null default '{}',
  prompt_engineering_techniques text[] not null default '{}',
  system_prompt text not null,
  user_prompt text,
  expected_output text,
  featured boolean not null default false,
  verified boolean not null default false,
  community_validated boolean not null default false,
  moderation_status moderation_status not null default 'pending',
  reviewed_by text,
  reviewed_at timestamptz,
  license_type text not null default 'MIT',
  commercial_use boolean not null default true,
  attribution_required boolean not null default false,
  current_version text not null default '1.0.0',
  meta_title text,
  meta_description text,
  seo_keywords text[] not null default '{}',
  trending_score numeric(10,2) not null default 0,
  weekly_growth numeric(10,2) not null default 0,
  published_at timestamptz,
  -- Metadata columns
  character_count integer,
  word_count integer,
  estimated_tokens integer,
  complexity text,
  difficulty_level text,
  structure_level text,
  reading_time_sec integer,
  quality_score integer check (quality_score between 0 and 100),
  short_summary text,
  traits text[] default '{}',
  compatible_models text[] default '{}',
  metadata_generated_at timestamptz,
  -- Multi-step columns
  is_multi_step boolean not null default false,
  steps text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_prompts_slug on prompts(slug);
create index if not exists idx_prompts_category_id on prompts(category_id, published_at desc);
create index if not exists idx_prompts_subcategory_id on prompts(subcategory_id);
create index if not exists idx_prompts_author_id on prompts(author_id);
create index if not exists idx_prompts_featured on prompts(featured) where featured = true;
create index if not exists idx_prompts_verified on prompts(verified) where verified = true;
create index if not exists idx_prompts_trending_score on prompts(trending_score desc, published_at desc);
create index if not exists idx_prompts_moderation_status on prompts(moderation_status) where moderation_status = 'approved';
create index if not exists idx_prompts_is_multi_step on prompts(is_multi_step) where is_multi_step = true;
create index if not exists idx_prompts_quality_score on prompts(quality_score desc);
create index if not exists idx_prompts_difficulty_level on prompts(difficulty_level);
create index if not exists idx_prompts_complexity on prompts(complexity);
create index if not exists idx_prompts_search_trgm on prompts using gin ((title || ' ' || short_description || ' ' || coalesce(description, '')) gin_trgm_ops);

alter table prompts enable row level security;

create policy "Approved prompts are viewable by everyone" on prompts
  for select using (moderation_status = 'approved' or auth.uid() = (select user_id from authors where id = author_id));

create policy "Authors can update own prompts" on prompts
  for update using (auth.uid() = (select user_id from authors where id = author_id))
  with check (auth.uid() = (select user_id from authors where id = author_id));

create policy "Authors can delete own prompts" on prompts
  for delete using (auth.uid() = (select user_id from authors where id = author_id));

-- ============================================================================
-- 8. PROMPT_TAGS TABLE (JUNCTION)
-- ============================================================================

create table if not exists prompt_tags (
  prompt_id uuid not null references prompts(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (prompt_id, tag_id)
);

create index if not exists idx_prompt_tags_tag_id on prompt_tags(tag_id, prompt_id);
create index if not exists idx_prompt_tags_prompt_id on prompt_tags(prompt_id);

alter table prompt_tags enable row level security;

create policy "Prompt tags are viewable by everyone" on prompt_tags
  for select using (true);

-- ============================================================================
-- 9. PROMPT_AI_PLATFORMS TABLE (JUNCTION)
-- ============================================================================

create table if not exists prompt_ai_platforms (
  prompt_id uuid not null references prompts(id) on delete cascade,
  platform_id uuid not null references ai_platforms(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (prompt_id, platform_id)
);

create index if not exists idx_prompt_ai_platforms_platform_id on prompt_ai_platforms(platform_id, prompt_id);
create index if not exists idx_prompt_ai_platforms_prompt_id on prompt_ai_platforms(prompt_id);

alter table prompt_ai_platforms enable row level security;

create policy "Prompt AI platforms are viewable by everyone" on prompt_ai_platforms
  for select using (true);

-- ============================================================================
-- 10. PROMPT_RECOMMENDED_MODELS TABLE
-- ============================================================================

create table if not exists prompt_recommended_models (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  name text not null,
  provider text not null,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  unique (prompt_id, name)
);

create index if not exists idx_prompt_recommended_models_prompt_id on prompt_recommended_models(prompt_id);

alter table prompt_recommended_models enable row level security;

create policy "Recommended models are viewable by everyone" on prompt_recommended_models
  for select using (true);

-- ============================================================================
-- 11. PROMPT_VARIABLES TABLE
-- ============================================================================

create table if not exists prompt_variables (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  name text not null,
  label text not null,
  required boolean not null default false,
  description text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  unique (prompt_id, name)
);

create index if not exists idx_prompt_variables_prompt_id on prompt_variables(prompt_id);

alter table prompt_variables enable row level security;

create policy "Prompt variables are viewable by everyone" on prompt_variables
  for select using (true);

-- ============================================================================
-- 12. PROMPT_USAGE_INSTRUCTIONS TABLE
-- ============================================================================

create table if not exists prompt_usage_instructions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  instruction text not null,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create index if not exists idx_prompt_usage_instructions_prompt_id on prompt_usage_instructions(prompt_id);

alter table prompt_usage_instructions enable row level security;

create policy "Usage instructions are viewable by everyone" on prompt_usage_instructions
  for select using (true);

-- ============================================================================
-- 13. PROMPT_EXAMPLES TABLE
-- ============================================================================

create table if not exists prompt_examples (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  title text not null,
  input text,
  output text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create index if not exists idx_prompt_examples_prompt_id on prompt_examples(prompt_id);

alter table prompt_examples enable row level security;

create policy "Examples are viewable by everyone" on prompt_examples
  for select using (true);

-- ============================================================================
-- 14. PROMPT_TEST_CASES TABLE
-- ============================================================================

create table if not exists prompt_test_cases (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  name text not null,
  input text,
  result text,
  tested_model text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create index if not exists idx_prompt_test_cases_prompt_id on prompt_test_cases(prompt_id);

alter table prompt_test_cases enable row level security;

create policy "Test cases are viewable by everyone" on prompt_test_cases
  for select using (true);

-- ============================================================================
-- 15. PROOF_RESULTS TABLE
-- ============================================================================

create table if not exists proof_results (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  type proof_result_type not null,
  title text not null,
  thumbnail_url text,
  url text,
  content text,
  description text,
  duration integer,
  success_rate numeric(5,2),
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create index if not exists idx_proof_results_prompt_id on proof_results(prompt_id, sort_order);

alter table proof_results enable row level security;

create policy "Proof results are viewable by everyone" on proof_results
  for select using (true);

-- ============================================================================
-- 16. RATINGS TABLE
-- ============================================================================

create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  author_id uuid references authors(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  review text,
  created_at timestamptz not null default now(),
  unique (prompt_id, author_id)
);

create index if not exists idx_ratings_prompt_id on ratings(prompt_id);
create index if not exists idx_ratings_author_id on ratings(author_id);

alter table ratings enable row level security;

create policy "Ratings are viewable by everyone" on ratings
  for select using (true);

create policy "Authenticated users can rate" on ratings
  for insert with check (auth.role() = 'authenticated');

-- ============================================================================
-- 17. COLLECTION_PROMPTS TABLE (JUNCTION)
-- ============================================================================

create table if not exists collection_prompts (
  collection_id uuid not null references collections(id) on delete cascade,
  prompt_id uuid not null references prompts(id) on delete cascade,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  primary key (collection_id, prompt_id)
);

create index if not exists idx_collection_prompts_collection_id on collection_prompts(collection_id);
create index if not exists idx_collection_prompts_prompt_id on collection_prompts(prompt_id);

alter table collection_prompts enable row level security;

create policy "Collection prompts are viewable by everyone" on collection_prompts
  for select using (true);

-- ============================================================================
-- 18. PROMPT_VERSIONS TABLE
-- ============================================================================

create table if not exists prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  version text not null,
  released_at date not null default current_date,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  unique (prompt_id, version)
);

create index if not exists idx_prompt_versions_prompt_id on prompt_versions(prompt_id);

alter table prompt_versions enable row level security;

create policy "Prompt versions are viewable by everyone" on prompt_versions
  for select using (true);

-- ============================================================================
-- 19. PROMPT_VERSION_CHANGES TABLE
-- ============================================================================

create table if not exists prompt_version_changes (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references prompt_versions(id) on delete cascade,
  change text not null,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create index if not exists idx_prompt_version_changes_version_id on prompt_version_changes(version_id);

alter table prompt_version_changes enable row level security;

create policy "Version changes are viewable by everyone" on prompt_version_changes
  for select using (true);

-- ============================================================================
-- 20. RELATED_PROMPTS TABLE (JUNCTION)
-- ============================================================================

create table if not exists related_prompts (
  prompt_id uuid not null references prompts(id) on delete cascade,
  related_prompt_id uuid not null references prompts(id) on delete cascade,
  relationship_type text not null default 'related',
  weight numeric(6,2) not null default 1,
  created_at timestamptz not null default now(),
  primary key (prompt_id, related_prompt_id),
  check (prompt_id <> related_prompt_id)
);

create index if not exists idx_related_prompts_prompt_id on related_prompts(prompt_id);
create index if not exists idx_related_prompts_related_prompt_id on related_prompts(related_prompt_id);

alter table related_prompts enable row level security;

create policy "Related prompts are viewable by everyone" on related_prompts
  for select using (true);

-- ============================================================================
-- 21. PROMPT_ANALYTICS TABLE
-- ============================================================================

create table if not exists prompt_analytics (
  prompt_id uuid primary key references prompts(id) on delete cascade,
  views integer not null default 0,
  copies integer not null default 0,
  likes integer not null default 0,
  bookmarks integer not null default 0,
  shares integer not null default 0,
  comments integer not null default 0,
  downloads integer not null default 0,
  last_viewed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_prompt_analytics_views on prompt_analytics(views desc);
create index if not exists idx_prompt_analytics_bookmarks on prompt_analytics(bookmarks desc);

alter table prompt_analytics enable row level security;

create policy "Analytics are viewable by everyone" on prompt_analytics
  for select using (true);

-- ============================================================================
-- 22. PROMPT_DAILY_ANALYTICS TABLE
-- ============================================================================

create table if not exists prompt_daily_analytics (
  prompt_id uuid not null references prompts(id) on delete cascade,
  event_date date not null default current_date,
  views integer not null default 0,
  copies integer not null default 0,
  likes integer not null default 0,
  bookmarks integer not null default 0,
  shares integer not null default 0,
  downloads integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (prompt_id, event_date)
);

create index if not exists idx_prompt_daily_analytics_prompt_date on prompt_daily_analytics(prompt_id, event_date desc);
create index if not exists idx_prompt_daily_analytics_date on prompt_daily_analytics(event_date desc);

alter table prompt_daily_analytics enable row level security;

create policy "Daily analytics are viewable by everyone" on prompt_daily_analytics
  for select using (true);

-- ============================================================================
-- 23. SAVED_PROMPTS TABLE (FOR BOOKMARKING)
-- ============================================================================

create table if not exists saved_prompts (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  user_id uuid references auth.users(id) on delete cascade,
  prompt_id uuid not null references prompts(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (session_id is not null or user_id is not null),
  unique(session_id, prompt_id),
  unique(user_id, prompt_id)
);

create index if not exists idx_saved_prompts_session_id on saved_prompts(session_id);
create index if not exists idx_saved_prompts_user_id on saved_prompts(user_id);
create index if not exists idx_saved_prompts_prompt_id on saved_prompts(prompt_id);
create index if not exists idx_saved_prompts_created_at on saved_prompts(created_at desc);

alter table saved_prompts enable row level security;

create policy "Users can view their own saved prompts" on saved_prompts
  for select using (auth.uid() = user_id or session_id = current_setting('app.session_id', true));

create policy "Users can save prompts" on saved_prompts
  for insert with check (auth.uid() = user_id or session_id is not null);

create policy "Users can delete their saved prompts" on saved_prompts
  for delete using (auth.uid() = user_id or session_id = current_setting('app.session_id', true));

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite indexes for common queries
create index if not exists idx_prompts_category_featured_published on prompts(category_id, featured desc, published_at desc) where moderation_status = 'approved';
create index if not exists idx_prompts_trending_score_published on prompts(trending_score desc, published_at desc) where moderation_status = 'approved';
create index if not exists idx_prompts_author_published on prompts(author_id, published_at desc) where moderation_status = 'approved';

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on table authors is 'Stores prompt creators and contributors';
comment on table categories is 'Main category classifications for prompts';
comment on table subcategories is 'Sub-classifications within categories';
comment on table prompts is 'Core prompts with full metadata and multi-step support';
comment on table prompt_analytics is 'Aggregated engagement metrics for prompts';
comment on table prompt_daily_analytics is 'Daily breakdown of prompt engagement';
comment on table saved_prompts is 'Bookmarked prompts for users and guest sessions';
comment on column prompts.is_multi_step is 'Flag indicating if prompt has multiple steps';
comment on column prompts.steps is 'Array of step descriptions for multi-step workflows';
comment on column prompts.quality_score is 'Quality rating from 0-100';
comment on column prompts.complexity is 'Size classification: Small, Medium, Large, Very Large';
comment on column prompts.difficulty_level is 'Skill requirement: Beginner, Intermediate, Advanced';

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- All tables created with Row Level Security enabled
-- Ready for seed data insertion
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

  COALESCE(pan.views, 0) AS views,
  COALESCE(pan.copies, 0) AS copies,
  COALESCE(pan.bookmarks, 0) AS bookmarks,

  COALESCE(pan.rating, 0)::NUMERIC(10,2) AS rating,
  COALESCE(pan.rating_count, 0) AS rating_count,

  COALESCE(pm.has_proof, false) AS has_proof,
  COALESCE(pm.success_rate, 0)::NUMERIC(10,2) AS success_rate,

  a.name AS author_name,
  a.handle AS author_handle,
  a.avatar_url AS author_avatar_url,
  a.verified AS author_verified,

  COALESCE(pan.trending_score, 0)::NUMERIC(10,2) AS trending_score,
  COALESCE(pan.weekly_growth, 0)::NUMERIC(10,2) AS weekly_growth,

  p.updated_at,
  p.created_at
FROM public.prompts p
LEFT JOIN public.prompt_analytics pan
  ON pan.prompt_id = p.id
LEFT JOIN public.prompt_metrics pm
  ON pm.prompt_id = p.id
LEFT JOIN public.authors a
  ON a.id = p.author_id
LEFT JOIN public.categories c
  ON c.id = p.category_id
LEFT JOIN public.subcategories sc
  ON sc.id = p.subcategory_id
LEFT JOIN public.prompt_tags pt
  ON pt.prompt_id = p.id
LEFT JOIN public.tags t
  ON t.id = pt.tag_id
LEFT JOIN public.prompt_ai_platforms pap
  ON pap.prompt_id = p.id
LEFT JOIN public.ai_platforms ap
  ON ap.id = pap.ai_platform_id
GROUP BY
  p.id, p.slug, p.title, p.short_description,
  c.name, sc.name,
  p.featured, p.verified, p.community_validated,
  pan.views, pan.copies, pan.bookmarks,
  pan.rating, pan.rating_count,
  pm.has_proof, pm.success_rate,
  a.name, a.handle, a.avatar_url, a.verified,
  pan.trending_score, pan.weekly_growth,
  p.updated_at, p.created_at;