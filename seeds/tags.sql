-- ============================================================================
-- TAGS / CATEGORIES DATA POPULATION (PRODUCTION READY)
-- ============================================================================
-- Comprehensive list of tags for a prompt management application.
-- Automatically manages UUIDs and timestamps.
-- ============================================================================

INSERT INTO tags (
  id, 
  slug, 
  name, 
  description
) VALUES 
  -- Original Core Tags
  (gen_random_uuid(), 'email', 'Email', 'Email writing and response prompts.'),
  (gen_random_uuid(), 'copywriting', 'Copywriting', 'Creative copy and messaging prompts.'),
  (gen_random_uuid(), 'automation', 'Automation', 'Automate workflows and repetitive tasks.'),
  (gen_random_uuid(), 'debugging', 'Debugging', 'Fix code issues and identify errors.'),
  (gen_random_uuid(), 'planning', 'Planning', 'Strategy, project, and task planning prompts.'),

  -- Software Engineering & Tech
  (gen_random_uuid(), 'web-development', 'Web Development', 'Frontend and backend web development tasks.'),
  (gen_random_uuid(), 'data-analysis', 'Data Analysis', 'Data science, SQL, pandas, and data visualization.'),
  (gen_random_uuid(), 'devops', 'DevOps', 'Infrastructure, CI/CD, Docker, and server management.'),
  (gen_random_uuid(), 'prompt-engineering', 'Prompt Engineering', 'Meta-prompts to build, refine, or optimize other AI prompts.'),
  
  -- Marketing & Sales
  (gen_random_uuid(), 'seo', 'SEO', 'Search engine optimization and keyword research.'),
  (gen_random_uuid(), 'social-media', 'Social Media', 'Content for Twitter, LinkedIn, Instagram, and TikTok.'),
  (gen_random_uuid(), 'sales', 'Sales', 'Cold outreach, pitching, and objection handling.'),
  (gen_random_uuid(), 'e-commerce', 'E-commerce', 'Product descriptions, store optimization, and Shopify.'),
  
  -- Content Creation
  (gen_random_uuid(), 'blogging', 'Blogging', 'Article outlines, writing, and formatting.'),
  (gen_random_uuid(), 'storytelling', 'Storytelling', 'Creative writing, character development, and world-building.'),
  (gen_random_uuid(), 'video-production', 'Video Production', 'YouTube scripts, storyboards, and video ideas.'),
  
  -- Business & Operations
  (gen_random_uuid(), 'business-strategy', 'Business Strategy', 'Business models, market research, and competitive analysis.'),
  (gen_random_uuid(), 'customer-support', 'Customer Support', 'Help desk templates, issue resolution, and FAQs.'),
  (gen_random_uuid(), 'hr-recruiting', 'HR & Recruiting', 'Job descriptions, interview questions, and onboarding.'),
  (gen_random_uuid(), 'finance', 'Finance & Accounting', 'Financial modeling, budgeting, and tax summaries.'),
  
  -- Design & Product
  (gen_random_uuid(), 'ui-ux', 'UI/UX Design', 'User interface, user experience, and usability prompts.'),
  (gen_random_uuid(), 'product-management', 'Product Management', 'PRDs, user stories, and feature prioritization.'),
  (gen_random_uuid(), 'graphic-design', 'Graphic Design', 'Midjourney/DALL-E image generation prompts and design critique.'),
  
  -- Productivity & Personal
  (gen_random_uuid(), 'productivity', 'Productivity', 'Time management, goal setting, and habit tracking.'),
  (gen_random_uuid(), 'education', 'Education & Learning', 'Study guides, flashcards, and concept explanations.'),
  (gen_random_uuid(), 'language-learning', 'Language Learning', 'Translation, grammar practice, and conversation simulation.'),
  (gen_random_uuid(), 'health-wellness', 'Health & Wellness', 'Workout plans, meal prep, and mental health tracking.'),
  (gen_random_uuid(), 'travel', 'Travel', 'Itinerary planning, local guides, and budget travel.'),
  
  -- Fun & Gaming
  (gen_random_uuid(), 'gaming', 'Gaming', 'Game design, RPG mechanics, and lore generation.'),
  (gen_random_uuid(), 'roleplay', 'Roleplay', 'Persona adoption and conversational roleplay.')

ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
