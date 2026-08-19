-- ============================================================================
-- PROMPTHUB MIGRATION 009: ENSURE SAVED_PROMPTS TABLE & RLS SECURITY
-- ============================================================================
-- Establishes backend persistence for User Bookmarks / Saved Prompts with
-- strict user-level Row-Level Security (RLS) policies.
-- ============================================================================

BEGIN;

-- 1. Create saved_prompts table if not exists
CREATE TABLE IF NOT EXISTS public.saved_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, prompt_id)
);

-- 2. Indexes for efficient lookup
CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_id ON public.saved_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_prompt_id ON public.saved_prompts(prompt_id);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_created_at ON public.saved_prompts(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.saved_prompts ENABLE ROW LEVEL SECURITY;

-- 4. RLS Security Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own saved prompts' AND tablename = 'saved_prompts') THEN
    CREATE POLICY "Users can view their own saved prompts" ON public.saved_prompts
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can save prompts' AND tablename = 'saved_prompts') THEN
    CREATE POLICY "Users can save prompts" ON public.saved_prompts
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can remove saved prompts' AND tablename = 'saved_prompts') THEN
    CREATE POLICY "Users can remove saved prompts" ON public.saved_prompts
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

COMMIT;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
