-- ============================================================================
-- INDUSTRIES DATA POPULATION (PRODUCTION READY)
-- ============================================================================
-- High-value business verticals for industry-specific prompt filtering.
-- Automatically manages UUIDs and timestamps.
-- ============================================================================

INSERT INTO industries (
  id, 
  slug, 
  name, 
  description
) VALUES 
  -- Original Industries
  (gen_random_uuid(), 'saas', 'SaaS', 'Software-as-a-Service and product-driven businesses.'),
  (gen_random_uuid(), 'healthcare', 'Healthcare', 'Medical, wellness, and patient care industries.'),
  (gen_random_uuid(), 'finance', 'Finance', 'Banking, investing, and fintech workflows.'),
  (gen_random_uuid(), 'education', 'Education', 'Learning, teaching, and instructional design.'),
  (gen_random_uuid(), 'ecommerce', 'E-commerce', 'Online retail, marketplaces, and product merchandising.'),

  -- Additional Production Verticals
  (gen_random_uuid(), 'legal', 'Legal & Compliance', 'Contract analysis, corporate governance, and regulatory compliance.'),
  (gen_random_uuid(), 'real-estate', 'Real Estate', 'Property management, real estate investment, and listing brokerage.'),
  (gen_random_uuid(), 'marketing-advertising', 'Marketing & Advertising', 'Digital agencies, brand development, and media buying.'),
  (gen_random_uuid(), 'consulting', 'Consulting & Advisory', 'Professional services, strategic advisory, and agency frameworks.'),
  (gen_random_uuid(), 'nonprofit', 'Nonprofit & NGO', 'Fundraising, grant writing, and community impact programs.'),
  (gen_random_uuid(), 'entertainment-media', 'Media & Entertainment', 'Journalism, broadcasting, creative production, and music.'),
  (gen_random_uuid(), 'hospitality-tourism', 'Hospitality & Tourism', 'Hotels, dining, tour planning, and travel experience curation.'),
  (gen_random_uuid(), 'logistics-supplychain', 'Logistics & Supply Chain', 'Fleet tracking, inventory management, warehousing, and procurement.'),
  (gen_random_uuid(), 'manufacturing', 'Manufacturing & Hardware', 'Industrial engineering, product design, and factory production lines.'),
  (gen_random_uuid(), 'gaming-esports', 'Gaming & Esports', 'Game development, game publishing, and competitive esports.')

ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
