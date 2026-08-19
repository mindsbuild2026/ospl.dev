-- ============================================================================
-- EXPANDED COLLECTIONS DATA POPULATION (PRODUCTION LEVEL)
-- ============================================================================
-- Multi-category curated prompt packs designed for homepage feature sections.
-- Fully compliant with your provided collections schema.
-- ============================================================================

INSERT INTO collections (
  id,
  slug,
  name,
  description,
  icon_name,
  category_id,
  featured,
  sort_order
) VALUES 
  -- 1. Marketing & Sales
  ('e8d47b1a-2938-4c12-9c3f-8a2134e7a8f1', 'startup-launch-kit', 'Startup Launch Kit', 'A curated bundle of copy, email, and social prompts to execute a flawless Product Hunt or MVP launch.', 'rocket', '97c5e27a-8f85-4521-88f5-442ef5ea631a', true, 10),
  ('a2f893cb-3392-410a-b8ff-cd9a218fcfd1', 'seo-domination-pack', 'SEO Domination Pack', 'Advanced keyword mapping, semantic clustering, and page-one ranking strategies.', 'globe-alt', '97c5e27a-8f85-4521-88f5-442ef5ea631a', false, 15),

  -- 2. Productivity (ADHD / Neuro-Inclusive Focused)
  ('7b3f9e2d-1a4c-4e8b-a0d1-6f5e4c3b2a19', 'neurodivergent-planning', 'Neurodivergent Focus & Planning', 'Adaptive planning and workflow prompts designed specifically for ADHD and neuro-inclusive productivity systems.', 'brain', '1c7d5e3f-4b2a-4d6c-8f9a-2b5e7d3f1c8a', true, 20),
  ('99acbdf1-d30c-4fa2-bfda-9ac32d91ca8e', 'time-blocking-mastery', 'Time-Blocking & Flow State', 'Prompts to optimize calendar structures, eliminate context switching, and trigger deep flow states.', 'clock', '1c7d5e3f-4b2a-4d6c-8f9a-2b5e7d3f1c8a', false, 25),

  -- 3. Software Development
  ('a1b2c3d4-5e6f-4a9b-8c7d-e8f9a0b1c2d3', 'nextjs-react-mastery', 'React & Next.js Mastery', 'Advanced prompts for modern full-stack web development, state management, and Supabase integration.', 'code-bracket', '2f1a0f2d-7d18-4c8d-a4a5-16a8f8b9c1d1', true, 30),
  ('f7c32b9d-41a2-4c0d-b8ef-9dac32db8ea1', 'system-architect-blueprint', 'System Architect Blueprints', 'Prompts for designing resilient microservices, system scale estimations, and database schema reviews.', 'square-3-stack-3d', '2f1a0f2d-7d18-4c8d-a4a5-16a8f8b9c1d1', true, 35),

  -- 4. Business Operations
  ('c9a8b7d6-e5f4-4321-a0b1-c2d3e4f5a6b7', 'founder-fundraising', 'Founder Fundraising', 'Pitch deck outlines, investor outreach emails, and term sheet analysis frameworks for founders raising capital.', 'currency-dollar', '3f8b1c4e-9d2a-4a7b-8f1e-2c3d4e5f6a7b', false, 40),
  ('2b89fca1-3310-4fa8-bf12-dcba98f712ba', 'sop-workflow-automation', 'Standard Operating Procedures', 'Prompts to map, draft, and optimize highly detailed SOPs and business automation workflows.', 'document-duplicate', '3f8b1c4e-9d2a-4a7b-8f1e-2c3d4e5f6a7b', false, 45),

  -- 5. Content Writing
  ('f1e2d3c4-b5a6-4789-9012-3a4b5c6d7e8f', 'seo-blog-engine', 'SEO Blog Engine', 'A complete pipeline of prompts for outlining, writing, and optimizing high-ranking, human-like SEO articles.', 'document-text', '8f9a3f3d-6c4b-45e8-a0c4-bfd5d6e0c5e2', false, 50),
  ('8fa9bd3c-1120-4fac-bf12-deac9872bc9f', 'creative-storytelling', 'Creative Storytelling & Hooks', 'Character design, dynamic dialogue frameworks, and compelling opening structures for narrative prose.', 'pencil-square', '8f9a3f3d-6c4b-45e8-a0c4-bfd5d6e0c5e2', false, 55),

  -- 6. AI Agents & Automation
  ('12345678-abcd-ef01-2345-6789abcdef01', 'autonomous-coding-agents', 'Autonomous Coding Agents', 'Workflows for setting up self-healing code loops, automated PR reviewers, and advanced agentic structures.', 'cpu-chip', '1e3c5a7d-9b2f-4d6a-8c4e-5a7d1b3c9f2e', true, 60),

  -- 7. Design & Creativity
  ('87654321-dcba-10fe-5432-10fedcba9876', 'futuristic-ui-ux', 'Advanced UI/UX Architecture', 'Prompts to brainstorm clean, futuristic, and auto-adaptive web interfaces and component systems.', 'paint-brush', '9a4c7d2e-5f3b-4e1a-8d6c-7f2a5b4e3d1c', false, 70),
  ('3b8a1c9d-4fa0-4ee1-b8fe-9da1c2b3e4f5', 'midjourney-mastery', 'Midjourney Prompt Mechanics', 'Advanced structural recipes to generate photo-realistic assets, UI mockups, and consistent vector graphics.', 'camera', '9a4c7d2e-5f3b-4e1a-8d6c-7f2a5b4e3d1c', true, 75),

  -- 8. Social Media
  ('5a4b3c2d-1e0f-4987-a6b5-c4d3e2f1a0b9', 'viral-twitter-threads', 'Viral X/Twitter Threads', 'High-engagement hooks and thread structures designed to maximize impressions and follower growth.', 'chat-bubble-left-right', '6a2e4d55-3f7c-43b1-8b2e-3b5e4a2d8f4f', false, 80),
  ('6bcfda32-1a22-4fb8-bfdc-9da3c11eaef2', 'linkedin-authority', 'LinkedIn Executive Presence', 'Writing frameworks for thought leadership posts, industry insights, and corporate branding.', 'briefcase', '6a2e4d55-3f7c-43b1-8b2e-3b5e4a2d8f4f', true, 85),

  -- 9. Video & YouTube
  ('0c91abfd-11e2-4fab-9dd3-6f1eaef234ba', 'youtube-script-engine', 'YouTube Script Engine', 'Complete video flow builders: Hooks, engagement bridges, retention mechanics, and calls to action.', 'video-camera', '3e5a7d9c-2b4f-4c1d-8a6e-5f7d3b2a1c9e', true, 90),

  -- 10. E-commerce
  ('c128bdcf-3a92-4fa1-bfda-66da2b8eaef1', 'high-conversion-listings', 'E-commerce Conversion Secrets', 'A/B tested copywriting formulas for Amazon listings, Shopify product pages, and checkout page optimizations.', 'shopping-bag', '4a6d8c1f-2b3e-4d5a-9f7c-6a1d3e5b7c9f', true, 100),

  -- 11. Career
  ('dfda923a-1a3b-4fa8-bf12-dcba9872e3a1', 'career-accelerator-pack', 'Resume & Interview Prep', 'A standard-setting bundle for reverse-engineering job specifications into powerful resume bullet points and STAR interview scripts.', 'user-circle', '2d4f6a8c-1b3e-4d7a-9c5f-6a8d2b4e1c7f', false, 110),

  -- 12. Prompt Engineering
  ('33abdf1e-3a92-4fa1-bfda-66a2b8e342af', 'meta-prompting-suite', 'Meta-Prompting Masterclass', 'Advanced systems prompts designed to help developers construct, optimize, test, and programmatically scale other LLM prompts.', 'sparkles', '5a7d9c1e-3b4f-4d6c-8a2e-7d1c3b5f9a4e', true, 120),

  -- 13. Education
  ('ee9a3fd1-d0fc-4fa1-bfda-9ac23d91b4fa', 'interactive-learning-quizzes', 'Interactive Learning Systems', 'Prompt models designed to turn textbook chapters into gamified quizzes, flashcards, and step-by-step masterclasses.', 'academic-cap', '4f2d8c3b-9a1f-4c5e-a4d2-7f3b2e8c5d1a', false, 130)

ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  category_id = EXCLUDED.category_id,
  featured = EXCLUDED.featured,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
