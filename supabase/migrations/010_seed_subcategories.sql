-- ============================================================================
-- PROMPTHUB MIGRATION 010: SEED SUBCATEGORIES FOR ALL MAIN CATEGORIES
-- ============================================================================
-- Ensures every category in Supabase has rich subcategory classifications.
-- ============================================================================

BEGIN;

-- Function to seed default subcategories safely
DO $$
DECLARE
  cat_rec RECORD;
BEGIN
  FOR cat_rec IN SELECT id, slug, name FROM public.categories LOOP
    CASE LOWER(cat_rec.slug)
      WHEN 'coding' THEN
        INSERT INTO public.subcategories (category_id, slug, name, description)
        VALUES 
          (cat_rec.id, 'frontend', 'Frontend & UI', 'React, Vue, Tailwind, and CSS component generation'),
          (cat_rec.id, 'backend', 'Backend & APIs', 'Node.js, Python, REST APIs, and GraphQL schemas'),
          (cat_rec.id, 'devops', 'DevOps & Cloud', 'Docker, Kubernetes, CI/CD pipelines, and Terraform'),
          (cat_rec.id, 'database', 'Database & SQL', 'SQL queries, ORM models, and database migrations')
        ON CONFLICT (category_id, slug) DO NOTHING;

      WHEN 'creative' THEN
        INSERT INTO public.subcategories (category_id, slug, name, description)
        VALUES 
          (cat_rec.id, 'writing', 'Creative Writing', 'Storytelling, fiction, poetry, and character development'),
          (cat_rec.id, 'copywriting', 'Copywriting & Marketing', 'Ad copy, landing pages, email series, and headlines'),
          (cat_rec.id, 'art-prompts', 'Visual & Image Prompts', 'Midjourney, DALL-E, and Stable Diffusion prompts')
        ON CONFLICT (category_id, slug) DO NOTHING;

      WHEN 'productivity' THEN
        INSERT INTO public.subcategories (category_id, slug, name, description)
        VALUES 
          (cat_rec.id, 'automation', 'Workflow Automation', 'Zapier, Make, scripts, and email processing'),
          (cat_rec.id, 'summarization', 'Summarization & Notes', 'Meeting notes, article digests, and executive summaries'),
          (cat_rec.id, 'planning', 'Project Planning', 'Task breakdown, sprint planning, and roadmaps')
        ON CONFLICT (category_id, slug) DO NOTHING;

      ELSE
        -- Default general subcategory for any custom categories
        INSERT INTO public.subcategories (category_id, slug, name, description)
        VALUES 
          (cat_rec.id, 'general', 'General', 'General category prompts')
        ON CONFLICT (category_id, slug) DO NOTHING;
    END CASE;
  END LOOP;
END $$;

COMMIT;
