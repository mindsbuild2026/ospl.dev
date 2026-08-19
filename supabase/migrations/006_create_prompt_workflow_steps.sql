-- ============================================================================
-- PROMPTHUB MIGRATION 006: CREATE PROMPT_WORKFLOW_STEPS TABLE
-- ============================================================================
-- Creates the relational table for storing multi-step workflow prompts.
-- ============================================================================

BEGIN;

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

-- Index for ordering steps by prompt
CREATE INDEX IF NOT EXISTS idx_prompt_workflow_steps_prompt_id 
  ON public.prompt_workflow_steps(prompt_id, step_order);

-- Enable RLS
ALTER TABLE public.prompt_workflow_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Workflow steps viewable by everyone' AND tablename = 'prompt_workflow_steps') THEN
    CREATE POLICY "Workflow steps viewable by everyone" ON public.prompt_workflow_steps FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert workflow steps' AND tablename = 'prompt_workflow_steps') THEN
    CREATE POLICY "Authenticated users can insert workflow steps" ON public.prompt_workflow_steps FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authors can update workflow steps' AND tablename = 'prompt_workflow_steps') THEN
    CREATE POLICY "Authors can update workflow steps" ON public.prompt_workflow_steps FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM public.prompts p
        JOIN public.authors a ON p.author_id = a.id
        WHERE p.id = prompt_workflow_steps.prompt_id
        AND a.user_id = auth.uid()
      )
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authors can delete workflow steps' AND tablename = 'prompt_workflow_steps') THEN
    CREATE POLICY "Authors can delete workflow steps" ON public.prompt_workflow_steps FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM public.prompts p
        JOIN public.authors a ON p.author_id = a.id
        WHERE p.id = prompt_workflow_steps.prompt_id
        AND a.user_id = auth.uid()
      )
    );
  END IF;
END $$;

COMMIT;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
