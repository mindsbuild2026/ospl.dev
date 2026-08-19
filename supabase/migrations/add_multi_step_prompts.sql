-- PromptHub: Add multi-step prompt fields
-- This migration adds multi-step workflow detection and storage fields

ALTER TABLE prompts ADD COLUMN IF NOT EXISTS is_multi_step boolean DEFAULT false;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS steps text[] DEFAULT '{}';

-- Create index for filtering multi-step prompts
CREATE INDEX IF NOT EXISTS idx_prompts_is_multi_step ON prompts(is_multi_step) WHERE is_multi_step = true;

-- Add comments for documentation
COMMENT ON COLUMN prompts.is_multi_step IS 'Whether this prompt contains multiple steps or phases';
COMMENT ON COLUMN prompts.steps IS 'Array of steps/phases for multi-step workflows';
