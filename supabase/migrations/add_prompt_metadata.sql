-- PromptHub: Add prompt metadata columns
-- This migration adds metadata fields to the prompts table for automatic metadata generation

ALTER TABLE prompts ADD COLUMN IF NOT EXISTS character_count integer DEFAULT 0;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS word_count integer DEFAULT 0;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS estimated_tokens integer DEFAULT 0;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS complexity varchar(30);
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS difficulty_level varchar(20);
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS structure_level varchar(30);
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS reading_time_sec integer DEFAULT 0;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS quality_score integer;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS short_summary text;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS traits text[] DEFAULT '{}';
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS compatible_models text[] DEFAULT '{}';
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS metadata_generated_at timestamptz;

-- Create indexes for filtering and sorting by metadata
CREATE INDEX IF NOT EXISTS idx_prompts_complexity ON prompts(complexity);
CREATE INDEX IF NOT EXISTS idx_prompts_difficulty_level ON prompts(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_prompts_quality_score ON prompts(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_structure_level ON prompts(structure_level);
CREATE INDEX IF NOT EXISTS idx_prompts_estimated_tokens ON prompts(estimated_tokens);
