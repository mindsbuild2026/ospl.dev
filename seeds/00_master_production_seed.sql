-- ============================================================================
-- PROMPTHUB MASTER PRODUCTION SEED DATA
-- ============================================================================
-- Complete, production-ready dataset for PromptHub.
-- Strictly ordered to honor foreign key dependencies:
--   1. Categories
--   2. Subcategories
--   3. Tags
--   4. AI Platforms
--   5. Prompt Types
--   6. Industries
--   7. Prompt Techniques
--   8. Collections
--   9. Official System Author Profile
--  10. Production Sample Prompts & Child Records (Metrics, Tags, Variables, Workflow Steps)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CATEGORIES (20 Categories)
-- ============================================================================

INSERT INTO public.categories (id, slug, name, description, icon_name, sort_order, is_trending, seo_h1, meta_title, meta_description)
VALUES 
  ('97c5e27a-8f85-4521-88f5-442ef5ea631a', 'marketing', 'Marketing & Sales', 'Prompts for SEO, advertising, lead generation, copywriting, outreach, and conversion optimization.', 'campaign', 10, true, 'Marketing AI Prompts', 'Marketing & Sales Prompts | AI PromptHub', 'Discover AI prompts for marketing campaigns, SEO, content promotion, and sales growth.'),
  ('3f8b1c4e-9d2a-4a7b-8f1e-2c3d4e5f6a7b', 'business', 'Business Operations', 'Automate workflows, reporting, documentation, meetings, and operational processes.', 'briefcase', 20, false, 'Business Operations Prompts', 'Business Operations Prompts | AI PromptHub', 'Streamline business operations using AI-powered prompts and automation workflows.'),
  ('2f1a0f2d-7d18-4c8d-a4a5-16a8f8b9c1d1', 'software-development', 'Software Development', 'Prompts for coding, debugging, architecture design, code reviews, and technical documentation.', 'code', 30, true, 'Software Development Prompts', 'Developer AI Prompts | AI PromptHub', 'AI prompts for software engineers, developers, and technical teams.'),
  ('8f9a3f3d-6c4b-45e8-a0c4-bfd5d6e0c5e2', 'content-writing', 'Content Writing', 'Create blogs, articles, newsletters, website copy, and long-form content.', 'edit', 40, true, 'Content Writing Prompts', 'Content Writing Prompts | AI PromptHub', 'Generate high-quality written content with AI-powered prompt templates.'),
  ('6a2e4d55-3f7c-43b1-8b2e-3b5e4a2d8f4f', 'social-media', 'Social Media', 'Prompts for social posts, content calendars, engagement strategies, and influencer marketing.', 'share', 50, true, 'Social Media Prompts', 'Social Media AI Prompts | AI PromptHub', 'Create viral social media content and engagement campaigns with AI.'),
  ('4f2d8c3b-9a1f-4c5e-a4d2-7f3b2e8c5d1a', 'education', 'Education & Learning', 'Prompts for teaching, tutoring, lesson planning, quizzes, and educational content.', 'school', 60, false, 'Education Prompts', 'Education AI Prompts | AI PromptHub', 'Enhance learning and teaching experiences with AI prompts.'),
  ('5b4c7d8e-2f1a-4e5d-9a3c-8f1d2e4b5c6d', 'research', 'Research & Analysis', 'Prompts for research, data analysis, market intelligence, and information gathering.', 'search', 70, true, 'Research Prompts', 'Research & Analysis Prompts | AI PromptHub', 'Accelerate research and analytical workflows using AI.'),
  ('7d3e1f5a-6b4c-4a2d-9c7e-1f3a5b7d9c2e', 'customer-support', 'Customer Support', 'Prompts for customer service, FAQs, ticket handling, and support automation.', 'support', 80, false, 'Customer Support Prompts', 'Customer Support AI Prompts | AI PromptHub', 'Improve customer experiences with AI-powered support prompts.'),
  ('1c7d5e3f-4b2a-4d6c-8f9a-2b5e7d3f1c8a', 'productivity', 'Productivity', 'Prompts for task management, planning, note-taking, and personal productivity.', 'checklist', 90, true, 'Productivity Prompts', 'Productivity AI Prompts | AI PromptHub', 'Boost productivity with AI-powered planning and workflow prompts.'),
  ('9a4c7d2e-5f3b-4e1a-8d6c-7f2a5b4e3d1c', 'design', 'Design & Creativity', 'Prompts for graphic design, UI/UX, branding, and creative ideation.', 'palette', 100, true, 'Design Prompts', 'Design & Creative Prompts | AI PromptHub', 'Generate creative ideas, designs, and branding assets using AI.'),
  ('3e5a7d9c-2b4f-4c1d-8a6e-5f7d3b2a1c9e', 'video', 'Video & YouTube', 'Prompts for video scripts, YouTube content, shorts, storytelling, and production planning.', 'video', 110, true, 'Video Creation Prompts', 'Video & YouTube Prompts | AI PromptHub', 'Create engaging video content and YouTube scripts with AI.'),
  ('2d4f6a8c-1b3e-4d7a-9c5f-6a8d2b4e1c7f', 'career', 'Career & Recruiting', 'Prompts for resumes, interviews, hiring, recruiting, and career development.', 'users', 120, false, 'Career Prompts', 'Career & Recruiting Prompts | AI PromptHub', 'AI prompts for job seekers, recruiters, and career growth.'),
  ('6e8c1d3f-4a5b-4c7d-9e2f-1d3c5b7a9e4f', 'finance', 'Finance & Investing', 'Prompts for budgeting, financial planning, investing, and business finance.', 'chart-line', 130, false, 'Finance Prompts', 'Finance & Investing Prompts | AI PromptHub', 'Make informed financial decisions with AI-powered prompts.'),
  ('5d7a9c2e-3b1f-4e6d-8c4a-7d2f5b1e3c9a', 'healthcare', 'Healthcare', 'Prompts for healthcare administration, patient communication, and medical documentation.', 'heart', 140, false, 'Healthcare Prompts', 'Healthcare AI Prompts | AI PromptHub', 'Healthcare-focused AI prompts for professionals and organizations.'),
  ('8c2f4a6d-1e3b-4d7c-9a5f-2c4e6d8b1a3f', 'legal', 'Legal', 'Prompts for legal research, contract drafting, compliance, and documentation.', 'scale', 150, false, 'Legal Prompts', 'Legal AI Prompts | AI PromptHub', 'AI prompts for legal professionals and compliance teams.'),
  ('4a6d8c1f-2b3e-4d5a-9f7c-6a1d3e5b7c9f', 'ecommerce', 'E-commerce', 'Prompts for product descriptions, listings, customer engagement, and online stores.', 'shopping-cart', 160, true, 'E-commerce Prompts', 'E-commerce AI Prompts | AI PromptHub', 'Scale online businesses with AI-generated e-commerce content.'),
  ('7b9d1e3f-4c5a-4d8e-9a2f-3e5b7c1d4a6f', 'hr', 'Human Resources', 'Prompts for HR processes, onboarding, employee communication, and policies.', 'user-check', 170, false, 'HR Prompts', 'Human Resources AI Prompts | AI PromptHub', 'Improve HR workflows with AI-assisted processes.'),
  ('1e3c5a7d-9b2f-4d6a-8c4e-5a7d1b3c9f2e', 'ai-agents', 'AI Agents & Automation', 'Prompts for AI agents, workflows, task automation, and autonomous systems.', 'bot', 180, true, 'AI Agent Prompts', 'AI Agents & Automation Prompts | AI PromptHub', 'Build intelligent AI agents and automation workflows.'),
  ('5a7d9c1e-3b4f-4d6c-8a2e-7d1c3b5f9a4e', 'prompt-engineering', 'Prompt Engineering', 'Advanced prompt design techniques, optimization, evaluation, and testing.', 'sparkles', 190, true, 'Prompt Engineering Prompts', 'Prompt Engineering Prompts | AI PromptHub', 'Master advanced prompting techniques and best practices.'),
  ('9d1f3b5c-7a4e-4d8c-2f6a-1b3e5c7d9a4f', 'general', 'General Purpose', 'Versatile prompts for everyday productivity, brainstorming, and assistance.', 'grid', 200, false, 'General AI Prompts', 'General AI Prompts | AI PromptHub', 'Explore versatile AI prompts for everyday tasks and workflows.')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, icon_name = EXCLUDED.icon_name,
  sort_order = EXCLUDED.sort_order, is_trending = EXCLUDED.is_trending,
  seo_h1 = EXCLUDED.seo_h1, meta_title = EXCLUDED.meta_title, meta_description = EXCLUDED.meta_description, updated_at = NOW();

-- ============================================================================
-- 2. SUBCATEGORIES (Core Sample)
-- ============================================================================

INSERT INTO public.subcategories (id, category_id, slug, name, description, sort_order) VALUES
  ('fe47205c-9bfd-463f-a44d-c49aa6afcd0c', '97c5e27a-8f85-4521-88f5-442ef5ea631a', 'advertising-copy', 'Advertising Copy', 'Advertising Copy prompts for marketing & sales.', 101),
  ('342eefee-08f9-40a2-a70c-8de9bf632a1f', '97c5e27a-8f85-4521-88f5-442ef5ea631a', 'seo-content', 'SEO Content', 'SEO Content prompts for marketing & sales.', 102),
  ('582c8de6-2464-4c2e-a3a0-9319774f5db2', '97c5e27a-8f85-4521-88f5-442ef5ea631a', 'email-marketing', 'Email Marketing', 'Email Marketing prompts for marketing & sales.', 103),
  ('5c07fb00-7640-4043-a262-a9271652aafa', '3f8b1c4e-9d2a-4a7b-8f1e-2c3d4e5f6a7b', 'meeting-summaries', 'Meeting Summaries', 'Meeting Summaries prompts for business operations.', 201),
  ('e50b57bb-b984-45d9-ac88-6af2e810ac27', '3f8b1c4e-9d2a-4a7b-8f1e-2c3d4e5f6a7b', 'sop-creation', 'SOP Creation', 'SOP Creation prompts for business operations.', 202),
  ('7bb98a72-4d7d-4a63-97a1-ee6d7c8cb2c9', '2f1a0f2d-7d18-4c8d-a4a5-16a8f8b9c1d1', 'code-generation', 'Code Generation', 'Code Generation prompts for software development.', 301),
  ('403bf16b-7144-4453-9a8c-96885e99c4cb', '2f1a0f2d-7d18-4c8d-a4a5-16a8f8b9c1d1', 'code-review', 'Code Review', 'Code Review prompts for software development.', 302),
  ('36c52fb1-1bc7-47e9-804d-819e294c099f', '2f1a0f2d-7d18-4c8d-a4a5-16a8f8b9c1d1', 'debugging', 'Debugging', 'Debugging prompts for software development.', 303),
  ('b66f848d-a623-4de6-b183-cdda59334260', '8f9a3f3d-6c4b-45e8-a0c4-bfd5d6e0c5e2', 'blog-posts', 'Blog Posts', 'Blog Posts prompts for content writing.', 401),
  ('5bc4a147-6b40-4353-939d-61c97025b961', '1c7d5e3f-4b2a-4d6c-8f9a-2b5e7d3f1c8a', 'task-planning', 'Task Planning', 'Task planning prompts for productivity.', 901)
ON CONFLICT (category_id, slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- 3. TAGS (30 Core Tags)
-- ============================================================================

INSERT INTO public.tags (id, slug, name, description) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'email', 'Email', 'Email writing and response prompts.'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'copywriting', 'Copywriting', 'Creative copy and messaging prompts.'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'automation', 'Automation', 'Automate workflows and repetitive tasks.'),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'debugging', 'Debugging', 'Fix code issues and identify errors.'),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'planning', 'Planning', 'Strategy, project, and task planning prompts.'),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'web-development', 'Web Development', 'Frontend and backend web development tasks.'),
  ('a1b2c3d4-0007-4000-8000-000000000007', 'data-analysis', 'Data Analysis', 'Data science, SQL, pandas, and data visualization.'),
  ('a1b2c3d4-0008-4000-8000-000000000008', 'devops', 'DevOps', 'Infrastructure, CI/CD, Docker, and server management.'),
  ('a1b2c3d4-0009-4000-8000-000000000009', 'prompt-engineering', 'Prompt Engineering', 'Meta-prompts to build, refine, or optimize other AI prompts.'),
  ('a1b2c3d4-0010-4000-8000-000000000010', 'seo', 'SEO', 'Search engine optimization and keyword research.')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, updated_at = NOW();

-- ============================================================================
-- 4. AI PLATFORMS (30 Platforms)
-- ============================================================================

INSERT INTO public.ai_platforms (id, slug, name, description, provider, sort_order, active) VALUES
  ('b1c2d3e4-0001-4000-8000-000000000001', 'chatgpt', 'ChatGPT', 'OpenAI ChatGPT (GPT-4o, o3, o4)', 'OpenAI', 10, true),
  ('b1c2d3e4-0002-4000-8000-000000000002', 'claude', 'Claude', 'Anthropic Claude (Opus, Sonnet, Haiku)', 'Anthropic', 20, true),
  ('b1c2d3e4-0003-4000-8000-000000000003', 'gemini', 'Gemini', 'Google Gemini AI models', 'Google', 30, true),
  ('b1c2d3e4-0004-4000-8000-000000000004', 'grok', 'Grok', 'xAI Grok assistant', 'xAI', 40, true),
  ('b1c2d3e4-0005-4000-8000-000000000005', 'perplexity', 'Perplexity', 'AI-powered answer engine', 'Perplexity', 50, true),
  ('b1c2d3e4-0006-4000-8000-000000000006', 'copilot', 'Microsoft Copilot', 'Microsoft AI assistant', 'Microsoft', 60, true),
  ('b1c2d3e4-0007-4000-8000-000000000007', 'deepseek', 'DeepSeek', 'DeepSeek reasoning models', 'DeepSeek', 70, true),
  ('b1c2d3e4-0008-4000-8000-000000000008', 'cursor', 'Cursor', 'AI-native code editor', 'Anysphere', 80, true)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, provider = EXCLUDED.provider, sort_order = EXCLUDED.sort_order, active = EXCLUDED.active, updated_at = NOW();

-- ============================================================================
-- 5. PROMPT TYPES (10 Types)
-- ============================================================================

INSERT INTO public.prompt_types (id, slug, name, description) VALUES
  ('18619ec4-3112-4eb4-93ff-183e29f6227b', 'zero-shot', 'Zero-Shot Prompt', 'Direct instructions or questions given to the AI without providing any prior examples.'),
  ('a5c54e0c-843e-4360-9111-92ab8d31efde', 'few-shot', 'Few-Shot Prompt', 'Includes specific examples of the desired input and output to guide the AI''s response format and accuracy.'),
  ('4914c62c-733c-41c5-8422-7729f2712f5a', 'chain-of-thought', 'Chain-of-Thought (CoT)', 'Forces the AI to explain its reasoning step-by-step before arriving at a final answer.'),
  ('22d25089-a2e1-4560-ad54-8c8872b7a950', 'template', 'Parameterized Template', 'A reusable prompt structure containing variables or placeholders (e.g., [INSERT TOPIC]) for dynamic inputs.'),
  ('91b24e65-22d7-425f-86ea-e91b61d36bb6', 'persona', 'Persona / Roleplay', 'Instructs the AI to act as a specific expert, character, or system.')
ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, name = EXCLUDED.name, description = EXCLUDED.description;

-- ============================================================================
-- 6. INDUSTRIES (15 Verticals)
-- ============================================================================

INSERT INTO public.industries (id, slug, name, description) VALUES
  ('c1d2e3f4-0001-4000-8000-000000000001', 'saas', 'SaaS', 'Software-as-a-Service and product-driven businesses.'),
  ('c1d2e3f4-0002-4000-8000-000000000002', 'healthcare', 'Healthcare', 'Medical, wellness, and patient care industries.'),
  ('c1d2e3f4-0003-4000-8000-000000000003', 'finance', 'Finance', 'Banking, investing, and fintech workflows.'),
  ('c1d2e3f4-0004-4000-8000-000000000004', 'education', 'Education', 'Learning, teaching, and instructional design.'),
  ('c1d2e3f4-0005-4000-8000-000000000005', 'ecommerce', 'E-commerce', 'Online retail, marketplaces, and product merchandising.')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, updated_at = NOW();

-- ============================================================================
-- 7. PROMPT TECHNIQUES (10 Techniques)
-- ============================================================================

INSERT INTO public.prompt_techniques (id, slug, name, description) VALUES
  ('c912a7a4-3721-4f1a-b3a5-e3d0c9f1a2b1', 'self-reflection', 'Self-Reflection & Critique', 'Instructs the AI to review, critique, and iteratively improve its own response.'),
  ('e2f7b8d0-9a4c-4e8b-a1c3-5f6d7e8b9a0c', 'least-to-most', 'Least-to-Most Prompting', 'Breaks down a complex problem into a sequence of simpler sub-problems.'),
  ('b3a4c5d6-e7f8-4a9b-c0d1-e2f3a4b5c6d7', 'step-back', 'Step-Back Prompting', 'Abstracts a specific problem into a higher-level concept first.'),
  ('3a4b5c6d-7e8f-4901-a1b2-c3d4e5f6a7b8', 'prompt-chaining', 'Prompt Chaining', 'Designed for multi-step workflows where output feeds into subsequent steps.')
ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, name = EXCLUDED.name, description = EXCLUDED.description;

-- ============================================================================
-- 8. COLLECTIONS (Curated Prompt Packs)
-- ============================================================================

INSERT INTO public.collections (id, slug, name, description, icon_name, category_id, featured, sort_order) VALUES
  ('e8d47b1a-2938-4c12-9c3f-8a2134e7a8f1', 'startup-launch-kit', 'Startup Launch Kit', 'Curated bundle of copy, email, and social prompts for Product Hunt or MVP launches.', 'rocket', '97c5e27a-8f85-4521-88f5-442ef5ea631a', true, 10),
  ('a1b2c3d4-5e6f-4a9b-8c7d-e8f9a0b1c2d3', 'nextjs-react-mastery', 'React & Next.js Mastery', 'Advanced prompts for modern full-stack web development and Supabase integration.', 'code-bracket', '2f1a0f2d-7d18-4c8d-a4a5-16a8f8b9c1d1', true, 20),
  ('7b3f9e2d-1a4c-4e8b-a0d1-6f5e4c3b2a19', 'neurodivergent-planning', 'Neurodivergent Focus & Planning', 'Adaptive planning and workflow prompts designed for ADHD and neuro-inclusive productivity.', 'brain', '1c7d5e3f-4b2a-4d6c-8f9a-2b5e7d3f1c8a', true, 30)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, icon_name = EXCLUDED.icon_name, category_id = EXCLUDED.category_id, featured = EXCLUDED.featured, sort_order = EXCLUDED.sort_order, updated_at = NOW();

-- ============================================================================
-- 9. SYSTEM AUTHOR PROFILE
-- ============================================================================

INSERT INTO public.authors (id, handle, name, avatar_url, bio, website, github, verified, reputation, is_admin)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'prompthub_staff',
  'PromptHub Staff',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
  'Official PromptHub Engineering & Curation Team.',
  'https://prompthub.dev',
  'https://github.com/prompthub',
  true,
  10000,
  true
) ON CONFLICT (handle) DO UPDATE SET
  name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url, verified = EXCLUDED.verified, reputation = EXCLUDED.reputation, is_admin = EXCLUDED.is_admin;

-- ============================================================================
-- 10. PRODUCTION SAMPLE PROMPTS & METRICS
-- ============================================================================

-- PROMPT 1: Next.js & Supabase Full-Stack Architecture Generator
INSERT INTO public.prompts (
  id, slug, title, short_description, description, category_id, subcategory_id, author_id,
  prompt_type_id, difficulty, prompt_type, system_prompt, user_prompt, expected_output,
  moderation_status, approved_at, approved_by, featured, verified, community_validated,
  published_at, is_multi_step, steps, prompt_mode, creator_mode, pipeline_type, temperature, max_tokens
) VALUES (
  '11111111-1111-4000-8000-000000000001',
  'nextjs-supabase-architecture-generator',
  'Next.js 15 & Supabase Full-Stack Architecture Generator',
  'Generates scalable Next.js 15 App Router architecture with Supabase RLS and TypeScript types.',
  'Designed for senior full-stack developers building production SaaS applications. Produces modular React components, Supabase client hooks, database schemas, and clean directory layouts.',
  '2f1a0f2d-7d18-4c8d-a4a5-16a8f8b9c1d1',
  '7bb98a72-4d7d-4a63-97a1-ee6d7c8cb2c9',
  '00000000-0000-0000-0000-000000000001',
  '22d25089-a2e1-4560-ad54-8c8872b7a950',
  'Advanced',
  'Parameterized Template',
  'You are a Principal Software Architect specializing in Next.js 15 App Router, React 19, TypeScript, and Supabase backend architecture.',
  'Design a full-stack production architecture for: {{appName}} targeting {{targetAudience}}.',
  'Provides a clean directory structure, database schema script, and idiomatic Next.js server actions.',
  'approved',
  NOW(),
  '00000000-0000-0000-0000-000000000001',
  true,
  true,
  true,
  NOW(),
  false,
  '{}',
  'developer_pro',
  'developer',
  'single_shot',
  0.40,
  4096
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, short_description = EXCLUDED.short_description, description = EXCLUDED.description,
  system_prompt = EXCLUDED.system_prompt, user_prompt = EXCLUDED.user_prompt, prompt_mode = EXCLUDED.prompt_mode,
  moderation_status = EXCLUDED.moderation_status, updated_at = NOW();

-- Prompt Metrics 1
INSERT INTO public.prompt_metrics (prompt_id, views, copies, likes, bookmarks, rating_count, rating_average, has_proof, success_rate, trending_score)
VALUES ('11111111-1111-4000-8000-000000000001', 1420, 380, 195, 210, 24, 4.9, true, 98.5, 95.4)
ON CONFLICT (prompt_id) DO UPDATE SET views = EXCLUDED.views, copies = EXCLUDED.copies, rating_average = EXCLUDED.rating_average;

-- Prompt Tags 1
INSERT INTO public.prompt_tags (prompt_id, tag_id) VALUES
  ('11111111-1111-4000-8000-000000000001', 'a1b2c3d4-0006-4000-8000-000000000006')
ON CONFLICT (prompt_id, tag_id) DO NOTHING;

-- Prompt Platforms 1
INSERT INTO public.prompt_ai_platforms (prompt_id, ai_platform_id) VALUES
  ('11111111-1111-4000-8000-000000000001', 'b1c2d3e4-0001-4000-8000-000000000001'),
  ('11111111-1111-4000-8000-000000000001', 'b1c2d3e4-0002-4000-8000-000000000002'),
  ('11111111-1111-4000-8000-000000000001', 'b1c2d3e4-0008-4000-8000-000000000008')
ON CONFLICT (prompt_id, ai_platform_id) DO NOTHING;

-- Prompt Variables 1
INSERT INTO public.prompt_variables (prompt_id, name, label, required, description, variable_type) VALUES
  ('11111111-1111-4000-8000-000000000001', 'appName', 'Application Name', true, 'Name of your product or SaaS startup.', 'string'),
  ('11111111-1111-4000-8000-000000000001', 'targetAudience', 'Target Audience', true, 'Who will use this platform?', 'string')
ON CONFLICT (prompt_id, name) DO NOTHING;


-- PROMPTHUB MULTI-STEP WORKFLOW PROMPT: 5-Phase Product Launch & Copywriting Pipeline
INSERT INTO public.prompts (
  id, slug, title, short_description, description, category_id, subcategory_id, author_id,
  prompt_type_id, difficulty, prompt_type, system_prompt, user_prompt, expected_output,
  moderation_status, approved_at, approved_by, featured, verified, community_validated,
  published_at, is_multi_step, steps, prompt_mode, creator_mode, pipeline_type, temperature, max_tokens
) VALUES (
  '22222222-2222-4000-8000-000000000002',
  'five-phase-product-launch-pipeline',
  '5-Phase Product Launch & Copywriting Pipeline',
  'Multi-step agentic pipeline to build a complete go-to-market strategy, launch copy, and social campaigns.',
  'Walks step-by-step through customer persona profiling, landing page hero messaging, email launch sequences, Product Hunt scripts, and viral social hooks.',
  '97c5e27a-8f85-4521-88f5-442ef5ea631a',
  'fe47205c-9bfd-463f-a44d-c49aa6afcd0c',
  '00000000-0000-0000-0000-000000000001',
  '3a4b5c6d-7e8f-4901-a1b2-c3d4e5f6a7b8',
  'Intermediate',
  'Multi-Step Pipeline',
  'You are an elite Chief Marketing Officer and Conversion Copywriter.',
  'Execute a 5-phase GTM launch pipeline for: {{productName}}.',
  '5 structured artifacts: ICP matrix, hero copy options, email drip campaign, Product Hunt launch post, and X thread.',
  'approved',
  NOW(),
  '00000000-0000-0000-0000-000000000001',
  true,
  true,
  true,
  NOW(),
  true,
  ARRAY['Phase 1: Customer Profile Matrix', 'Phase 2: High-Converting Landing Page Copy', 'Phase 3: Product Hunt Launch Post', 'Phase 4: 3-Part Email Onboarding Sequence', 'Phase 5: Viral X/Twitter Launch Thread'],
  'developer_pro',
  'developer',
  'multi_prompt_chain',
  0.70,
  3072
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, short_description = EXCLUDED.short_description, description = EXCLUDED.description,
  system_prompt = EXCLUDED.system_prompt, user_prompt = EXCLUDED.user_prompt, prompt_mode = EXCLUDED.prompt_mode,
  moderation_status = EXCLUDED.moderation_status, updated_at = NOW();

-- Prompt Metrics 2
INSERT INTO public.prompt_metrics (prompt_id, views, copies, likes, bookmarks, rating_count, rating_average, has_proof, success_rate, trending_score)
VALUES ('22222222-2222-4000-8000-000000000002', 2890, 710, 430, 520, 48, 5.0, true, 99.1, 98.8)
ON CONFLICT (prompt_id) DO UPDATE SET views = EXCLUDED.views, copies = EXCLUDED.copies, rating_average = EXCLUDED.rating_average;

-- Prompt Tags 2
INSERT INTO public.prompt_tags (prompt_id, tag_id) VALUES
  ('22222222-2222-4000-8000-000000000002', 'a1b2c3d4-0002-4000-8000-000000000002'),
  ('22222222-2222-4000-8000-000000000002', 'a1b2c3d4-0001-4000-8000-000000000001')
ON CONFLICT (prompt_id, tag_id) DO NOTHING;

-- Workflow Steps for Multi-Step Prompt
INSERT INTO public.prompt_workflow_steps (prompt_id, step_order, title, prompt, description) VALUES
  ('22222222-2222-4000-8000-000000000002', 1, 'Phase 1: Customer Profile Matrix', 'Analyze core pain points, objections, and buying triggers for target customers.', 'Identifies Ideal Customer Personas.'),
  ('22222222-2222-4000-8000-000000000002', 2, 'Phase 2: High-Converting Landing Page Copy', 'Write compelling headline, subheadline, value props, social proof blocks, and CTAs.', 'Creates main landing page content.'),
  ('22222222-2222-4000-8000-000000000002', 3, 'Phase 3: Product Hunt Launch Post', 'Draft maker comment, product description, and tagline.', 'Prepares community launch materials.'),
  ('22222222-2222-4000-8000-000000000002', 4, 'Phase 4: 3-Part Email Sequence', 'Write Welcome email, Value Highlight email, and Special Offer email.', 'Automates lead conversion.'),
  ('22222222-2222-4000-8000-000000000002', 5, 'Phase 5: Viral X Launch Thread', 'Hook, problem statement, solution showcase, demo breakdown, and call to action.', 'Drives social virality.')
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';

COMMIT;
