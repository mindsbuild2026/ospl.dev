-- ============================================================================
-- AI PLATFORMS DATA POPULATION (UPDATED SCHEMA)
-- ============================================================================
-- SQL Script to insert AI platforms with exact schema compatibility
-- Automatically handles ID generation, timestamps, and usage counts.
-- ============================================================================

INSERT INTO ai_platforms (
  id, 
  slug, 
  name, 
  description, 
  provider,
  sort_order, 
  active
) VALUES 
  (gen_random_uuid(), 'chatgpt', 'ChatGPT', 'OpenAI ChatGPT (GPT-4o, o3, o4)', 'OpenAI', 10, true),
  (gen_random_uuid(), 'claude', 'Claude', 'Anthropic Claude (Opus, Sonnet, Haiku)', 'Anthropic', 20, true),
  (gen_random_uuid(), 'gemini', 'Gemini', 'Google Gemini AI models', 'Google', 30, true),
  (gen_random_uuid(), 'grok', 'Grok', 'xAI Grok assistant', 'xAI', 40, true),
  (gen_random_uuid(), 'perplexity', 'Perplexity', 'AI-powered answer engine', 'Perplexity', 50, true),
  (gen_random_uuid(), 'copilot', 'Microsoft Copilot', 'Microsoft AI assistant', 'Microsoft', 60, true),
  (gen_random_uuid(), 'meta-ai', 'Meta AI', 'Meta AI assistant', 'Meta', 70, true),
  (gen_random_uuid(), 'deepseek', 'DeepSeek', 'DeepSeek reasoning models', 'DeepSeek', 80, true),
  (gen_random_uuid(), 'mistral', 'Mistral AI', 'Mistral AI models', 'Mistral AI', 90, true),
  (gen_random_uuid(), 'le-chat', 'Le Chat', 'Mistral AI assistant', 'Mistral AI', 100, true),
  (gen_random_uuid(), 'character-ai', 'Character.AI', 'Character-based AI conversations', 'Character.AI', 110, true),
  (gen_random_uuid(), 'poe', 'Poe', 'Multi-model AI platform', 'Quora', 120, true),
  (gen_random_uuid(), 'you-com', 'You.com', 'AI search and productivity assistant', 'You.com', 130, true),
  (gen_random_uuid(), 'phind', 'Phind', 'Developer-focused AI search', 'Phind', 140, true),
  (gen_random_uuid(), 'pi', 'Pi', 'Personal AI assistant', 'Inflection AI', 150, true),
  (gen_random_uuid(), 'notebooklm', 'NotebookLM', 'Google AI research notebook', 'Google', 160, true),
  (gen_random_uuid(), 'qwen', 'Qwen', 'Alibaba Qwen AI models', 'Alibaba', 170, true),
  (gen_random_uuid(), 'kimi', 'Kimi', 'Moonshot AI assistant', 'Moonshot AI', 180, true),
  (gen_random_uuid(), 'github-copilot', 'GitHub Copilot', 'AI coding assistant', 'GitHub', 190, true),
  (gen_random_uuid(), 'cursor', 'Cursor', 'AI-native code editor', 'Anysphere', 200, true),
  (gen_random_uuid(), 'windsurf', 'Windsurf', 'AI development environment', 'Codeium', 210, true),
  (gen_random_uuid(), 'cline', 'Cline', 'Open-source coding agent', 'Cline', 220, true),
  (gen_random_uuid(), 'amazon-q', 'Amazon Q', 'AWS AI assistant', 'Amazon Web Services', 230, true),
  (gen_random_uuid(), 'replit-ai', 'Replit AI', 'AI-powered software development', 'Replit', 240, true),
  (gen_random_uuid(), 'bolt-new', 'Bolt.new', 'AI full-stack application builder', 'StackBlitz', 250, true),
  (gen_random_uuid(), 'lovable', 'Lovable', 'AI web application builder', 'Lovable', 260, true),
  (gen_random_uuid(), 'v0', 'v0', 'AI UI generation platform', 'Vercel', 270, true),
  (gen_random_uuid(), 'blackbox-ai', 'Blackbox AI', 'AI coding assistant and search', 'Blackbox AI', 280, true),
  (gen_random_uuid(), 'open-webui', 'Open WebUI', 'Self-hosted AI interface', 'Open WebUI', 290, true),
  (gen_random_uuid(), 'anythingllm', 'AnythingLLM', 'Private AI workspace platform', 'Mintplex Labs', 300, true)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  provider = EXCLUDED.provider,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active,
  updated_at = NOW();
