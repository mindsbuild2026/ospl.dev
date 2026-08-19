-- ============================================================================
-- PROMPTHUB MIGRATION 005: PROMPT SUBMISSION ENHANCEMENTS
-- ============================================================================
-- Backward-compatible migration supporting:
--   1. Creator Modes (Casual vs. Developer Pro)
--   2. Pipeline & Structured Output Configurations
--   3. Advanced Variable Schema Mapping
--   4. Versioned Environmental & Water Footprint Metrics
--   5. Binary Image Asset Metadata & Supabase Storage Policies
--   6. AI Validation Audit Logs
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- STEP 1: ADD CREATOR MODE & PIPELINE FIELDS TO `prompts` TABLE
-- ----------------------------------------------------------------------------

-- Creator Mode Enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'creator_mode_type') THEN
    CREATE TYPE creator_mode_type AS ENUM ('casual', 'developer');
  END IF;
END $$;

-- Pipeline Type Enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pipeline_type_enum') THEN
    CREATE TYPE pipeline_type_enum AS ENUM ('single_shot', 'multi_prompt_chain');
  END IF;
END $$;

-- Structured Output Format Enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'structured_output_format_enum') THEN
    CREATE TYPE structured_output_format_enum AS ENUM ('markdown', 'json', 'yaml', 'xml', 'custom');
  END IF;
END $$;

-- Add Additive Columns to `prompts` Table
ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS creator_mode creator_mode_type NOT NULL DEFAULT 'casual',
  ADD COLUMN IF NOT EXISTS pipeline_type pipeline_type_enum NOT NULL DEFAULT 'single_shot',
  ADD COLUMN IF NOT EXISTS temperature NUMERIC(3, 2) DEFAULT 0.70 CHECK (temperature >= 0.0 AND temperature <= 2.0),
  ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 2048 CHECK (max_tokens IS NULL OR max_tokens > 0),
  ADD COLUMN IF NOT EXISTS output_format structured_output_format_enum DEFAULT 'markdown',
  ADD COLUMN IF NOT EXISTS structured_output_schema TEXT,
  ADD COLUMN IF NOT EXISTS ai_validation_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ai_quality_score INTEGER CHECK (ai_quality_score IS NULL OR (ai_quality_score >= 0 AND ai_quality_score <= 100));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompts_creator_mode ON public.prompts(creator_mode);
CREATE INDEX IF NOT EXISTS idx_prompts_pipeline_type ON public.prompts(pipeline_type);
CREATE INDEX IF NOT EXISTS idx_prompts_ai_validation_status ON public.prompts(ai_validation_status);


-- ----------------------------------------------------------------------------
-- STEP 2: ENHANCE `prompt_variables` TABLE FOR DEVELOPER PRO
-- ----------------------------------------------------------------------------

ALTER TABLE public.prompt_variables
  ADD COLUMN IF NOT EXISTS variable_type TEXT NOT NULL DEFAULT 'string',
  ADD COLUMN IF NOT EXISTS options TEXT[] DEFAULT '{}';


-- ----------------------------------------------------------------------------
-- STEP 3: CREATE TABLE `prompt_assets` FOR IMAGE & REFERENCE MEDIA
-- ----------------------------------------------------------------------------

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prompt_assets_prompt_id ON public.prompt_assets(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_assets_user_id ON public.prompt_assets(user_id);

-- Enable RLS
ALTER TABLE public.prompt_assets ENABLE ROW LEVEL SECURITY;

-- Policies for `prompt_assets`
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Prompt assets are viewable by everyone' AND tablename = 'prompt_assets') THEN
    CREATE POLICY "Prompt assets are viewable by everyone" ON public.prompt_assets FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authors can insert assets for their prompts' AND tablename = 'prompt_assets') THEN
    CREATE POLICY "Authors can insert assets for their prompts" ON public.prompt_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authors can update assets for their prompts' AND tablename = 'prompt_assets') THEN
    CREATE POLICY "Authors can update assets for their prompts" ON public.prompt_assets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authors can delete assets for their prompts' AND tablename = 'prompt_assets') THEN
    CREATE POLICY "Authors can delete assets for their prompts" ON public.prompt_assets FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- STEP 4: CREATE TABLE `prompt_environmental_metrics` (VERSIONED)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.prompt_environmental_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  estimated_input_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_output_tokens INTEGER NOT NULL DEFAULT 0,
  image_count INTEGER NOT NULL DEFAULT 0,
  target_model TEXT NOT NULL DEFAULT 'gemini-3.6-flash',
  target_provider TEXT NOT NULL DEFAULT 'Google',
  energy_kwh NUMERIC(10, 6) NOT NULL DEFAULT 0.000000,
  water_ml_min NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  water_ml_max NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  co2_grams NUMERIC(10, 3) NOT NULL DEFAULT 0.000,
  confidence_score NUMERIC(3, 2) NOT NULL DEFAULT 0.90 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
  methodology_version TEXT NOT NULL DEFAULT 'v1.0',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prompt_env_metrics_prompt_id ON public.prompt_environmental_metrics(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_env_metrics_version ON public.prompt_environmental_metrics(methodology_version);

-- Enable RLS
ALTER TABLE public.prompt_environmental_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for `prompt_environmental_metrics`
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Environmental metrics are viewable by everyone' AND tablename = 'prompt_environmental_metrics') THEN
    CREATE POLICY "Environmental metrics are viewable by everyone" ON public.prompt_environmental_metrics FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert environmental metrics' AND tablename = 'prompt_environmental_metrics') THEN
    CREATE POLICY "Authenticated users can insert environmental metrics" ON public.prompt_environmental_metrics FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authors can update environmental metrics for their prompts' AND tablename = 'prompt_environmental_metrics') THEN
    CREATE POLICY "Authors can update environmental metrics for their prompts" ON public.prompt_environmental_metrics FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM public.prompts p
        JOIN public.authors a ON p.author_id = a.id
        WHERE p.id = prompt_environmental_metrics.prompt_id
        AND a.user_id = auth.uid()
      )
    );
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- STEP 5: CREATE TABLE `prompt_ai_validations` AUDIT LOG
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.prompt_ai_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pass', 'warning', 'fail')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_response JSONB,
  model_version TEXT NOT NULL DEFAULT 'gemini-3.6-flash',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_validations_prompt_id ON public.prompt_ai_validations(prompt_id);

ALTER TABLE public.prompt_ai_validations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'AI validations viewable by prompt author' AND tablename = 'prompt_ai_validations') THEN
    CREATE POLICY "AI validations viewable by prompt author" ON public.prompt_ai_validations FOR SELECT USING (
      user_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.prompts p
        JOIN public.authors a ON p.author_id = a.id
        WHERE p.id = prompt_ai_validations.prompt_id
        AND a.user_id = auth.uid()
      )
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert AI validations' AND tablename = 'prompt_ai_validations') THEN
    CREATE POLICY "Authenticated users can insert AI validations" ON public.prompt_ai_validations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- STEP 6: SUPABASE STORAGE BUCKET & RLS POLICIES FOR `prompt-assets`
-- ----------------------------------------------------------------------------

-- Create Storage Bucket if missing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prompt-assets',
  'prompt-assets',
  true,
  5242880, -- 5 MB Limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Objects Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Access for Prompt Assets Storage' AND tablename = 'objects') THEN
    CREATE POLICY "Public Read Access for Prompt Assets Storage" ON storage.objects FOR SELECT USING (bucket_id = 'prompt-assets');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Uploads for Prompt Assets Storage' AND tablename = 'objects') THEN
    CREATE POLICY "Authenticated Uploads for Prompt Assets Storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'prompt-assets' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owner Delete for Prompt Assets Storage' AND tablename = 'objects') THEN
    CREATE POLICY "Owner Delete for Prompt Assets Storage" ON storage.objects FOR DELETE USING (bucket_id = 'prompt-assets' AND auth.uid() = owner);
  END IF;
END $$;

COMMIT;
