-- ============================================================================
-- PROMPTHUB MIGRATION 008: FIX RLS POLICIES FOR PROMPT CHILD TABLES
-- ============================================================================
-- Adds INSERT, UPDATE, and DELETE RLS policies for prompt child tables
-- (prompt_proof_items, prompt_variables, prompt_test_cases, prompt_examples, etc.)
-- so authenticated authors can insert and manage details for their prompts.
-- ============================================================================

BEGIN;

-- 1. prompt_proof_items RLS Policies
ALTER TABLE public.prompt_proof_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Proof items viewable by everyone' AND tablename = 'prompt_proof_items') THEN
    CREATE POLICY "Proof items viewable by everyone" ON public.prompt_proof_items FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert proof items' AND tablename = 'prompt_proof_items') THEN
    CREATE POLICY "Authenticated users can insert proof items" ON public.prompt_proof_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authors can update proof items' AND tablename = 'prompt_proof_items') THEN
    CREATE POLICY "Authors can update proof items" ON public.prompt_proof_items FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM public.prompts p
        JOIN public.authors a ON p.author_id = a.id
        WHERE p.id = prompt_proof_items.prompt_id
        AND a.user_id = auth.uid()
      )
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authors can delete proof items' AND tablename = 'prompt_proof_items') THEN
    CREATE POLICY "Authors can delete proof items" ON public.prompt_proof_items FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM public.prompts p
        JOIN public.authors a ON p.author_id = a.id
        WHERE p.id = prompt_proof_items.prompt_id
        AND a.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 2. prompt_variables RLS Policies
ALTER TABLE public.prompt_variables ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Variables viewable by everyone' AND tablename = 'prompt_variables') THEN
    CREATE POLICY "Variables viewable by everyone" ON public.prompt_variables FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert variables' AND tablename = 'prompt_variables') THEN
    CREATE POLICY "Authenticated users can insert variables" ON public.prompt_variables FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- 3. prompt_test_cases RLS Policies
ALTER TABLE public.prompt_test_cases ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Test cases viewable by everyone' AND tablename = 'prompt_test_cases') THEN
    CREATE POLICY "Test cases viewable by everyone" ON public.prompt_test_cases FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert test cases' AND tablename = 'prompt_test_cases') THEN
    CREATE POLICY "Authenticated users can insert test cases" ON public.prompt_test_cases FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- 4. prompt_examples RLS Policies
ALTER TABLE public.prompt_examples ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Examples viewable by everyone' AND tablename = 'prompt_examples') THEN
    CREATE POLICY "Examples viewable by everyone" ON public.prompt_examples FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert examples' AND tablename = 'prompt_examples') THEN
    CREATE POLICY "Authenticated users can insert examples" ON public.prompt_examples FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- 5. prompt_version_history RLS Policies
ALTER TABLE public.prompt_version_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Version history viewable by everyone' AND tablename = 'prompt_version_history') THEN
    CREATE POLICY "Version history viewable by everyone" ON public.prompt_version_history FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert version history' AND tablename = 'prompt_version_history') THEN
    CREATE POLICY "Authenticated users can insert version history" ON public.prompt_version_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

COMMIT;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
