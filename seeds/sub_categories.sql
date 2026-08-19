-- ============================================================================
-- SUBCATEGORIES DATA POPULATION (PRODUCTION READY)
-- ============================================================================
-- Complete seed script for PromptHub subcategories.
-- Maintains explicit UUIDs to ensure foreign key relations to the 
-- categories table remain perfectly intact.
-- ============================================================================

INSERT INTO subcategories (
  id,
  category_id,
  slug,
  name,
  description,
  sort_order
) VALUES 
  -- Marketing & Sales (Category 10)
  ('fe47205c-9bfd-463f-a44d-c49aa6afcd0c', '97c5e27a-8f85-4521-88f5-442ef5ea631a', 'advertising-copy', 'Advertising Copy', 'Advertising Copy prompts for marketing & sales.', 101),
  ('342eefee-08f9-40a2-a70c-8de9bf632a1f', '97c5e27a-8f85-4521-88f5-442ef5ea631a', 'seo-content', 'SEO Content', 'SEO Content prompts for marketing & sales.', 102),
  ('582c8de6-2464-4c2e-a3a0-9319774f5db2', '97c5e27a-8f85-4521-88f5-442ef5ea631a', 'email-marketing', 'Email Marketing', 'Email Marketing prompts for marketing & sales.', 103),
  ('6814d597-cd36-4fad-8741-722dde18d6a8', '97c5e27a-8f85-4521-88f5-442ef5ea631a', 'sales-outreach', 'Sales Outreach', 'Sales Outreach prompts for marketing & sales.', 104),
  ('946f094f-0edb-49f1-a519-0d840bbf1125', '97c5e27a-8f85-4521-88f5-442ef5ea631a', 'lead-generation', 'Lead Generation', 'Lead Generation prompts for marketing & sales.', 105),
  ('8acb3351-c8e5-41cc-b2ad-e832d44b7547', '97c5e27a-8f85-4521-88f5-442ef5ea631a', 'landing-pages', 'Landing Pages', 'Landing Pages prompts for marketing & sales.', 106),
  ('8b2e5cea-dad6-43fb-ac63-7d1b3da7d6ee', '97c5e27a-8f85-4521-88f5-442ef5ea631a', 'product-marketing', 'Product Marketing', 'Product Marketing prompts for marketing & sales.', 107),
  ('3a459307-d0f8-4f8a-8ef1-d9a258230407', '97c5e27a-8f85-4521-88f5-442ef5ea631a', 'brand-strategy', 'Brand Strategy', 'Brand Strategy prompts for marketing & sales.', 108),

  -- Business Operations (Category 20)
  ('5c07fb00-7640-4043-a262-a9271652aafa', '3f8b1c4e-9d2a-4a7b-8f1e-2c3d4e5f6a7b', 'meeting-summaries', 'Meeting Summaries', 'Meeting Summaries prompts for business operations.', 201),
  ('e50b57bb-b984-45d9-ac88-6af2e810ac27', '3f8b1c4e-9d2a-4a7b-8f1e-2c3d4e5f6a7b', 'sop-creation', 'SOP Creation', 'SOP Creation prompts for business operations.', 202),
  ('5bc4a147-6b40-4353-939d-61c97025b960', '3f8b1c4e-9d2a-4a7b-8f1e-2c3d4e5f6a7b', 'business-reports', 'Business Reports', 'Business Reports prompts for business operations.', 203),
  ('74b93b51-5638-43ce-943a-dc1f99e77df1', '3f8b1c4e-9d2a-4a7b-8f1e-2c3d4e5f6a7b', 'process-documentation', 'Process Documentation', 'Process Documentation prompts for business operations.', 204),
  ('c1d96ca5-cadf-4d53-a1a9-ab70e5131efb', '3f8b1c4e-9d2a-4a7b-8f1e-2c3d4e5f6a7b', 'internal-communications', 'Internal Communications', 'Internal Communications prompts for business operations.', 205),
  ('f1646f1f-7341-4de3-aa32-935a8b8b5f17', '3f8b1c4e-9d2a-4a7b-8f1e-2c3d4e5f6a7b', 'workflow-automation', 'Workflow Automation', 'Workflow Automation prompts for business operations.', 206),
  ('9fbfe1e2-905c-40ef-a984-3af7f98220e6', '3f8b1c4e-9d2a-4a7b-8f1e-2c3d4e5f6a7b', 'project-management', 'Project Management', 'Project Management prompts for business operations.', 207),
  ('7f222a9d-12c6-43ae-9337-7768b345d244', '3f8b1c4e-9d2a-4a7b-8f1e-2c3d4e5f6a7b', 'knowledge-management', 'Knowledge Management', 'Knowledge Management prompts for business operations.', 208),

  -- Software Development (Category 30)
  ('7bb98a72-4d7d-4a63-97a1-ee6d7c8cb2c9', '2f1a0f2d-7d18-4c8d-a4a5-16a8f8b9c1d1', 'code-generation', 'Code Generation', 'Code Generation prompts for software development.', 301),
  ('403bf16b-7144-4453-9a8c-96885e99c4cb', '2f1a0f2d-7d18-4c8d-a4a5-16a8f8b9c1d1', 'code-review', 'Code Review', 'Code Review prompts for software development.', 302),
  ('36c52fb1-1bc7-47e9-804d-819e294c099f', '2f1a0f2d-7d18-4c8d-a4a5-16a8f8b9c1d1', 'debugging', 'Debugging', 'Debugging prompts for software development.', 303),
  ('20191103-4630-4dc5-af88-7d03b0893b10', '2f1a0f2d-7d18-4c8d-a4a5-16a8f8b9c1d1', 'refactoring', 'Refactoring', 'Refactoring prompts for software development.', 304),
  ('7ca20e08-444c-453e-b2bb-b9257018922b', '2f1a0f2d-7d18-4c8d-a4a5-16a8f8b9c1d1', 'api-development', 'API Development', 'API Development prompts for software development.', 305),
  ('8dd47add-4bf2-459e-9dfa-54c9f8fa0fee', '2f1a0f2d-7d18-4c8d-a4a5-16a8f8b9c1d1', 'database-design', 'Database Design', 'Database Design prompts for software development.', 306),
  ('a7bb2dd3-aa1d-4e14-b734-3d9464803411', '2f1a0f2d-7d18-4c8d-a4a5-16a8f8b9c1d1', 'frontend-development', 'Frontend Development', 'Frontend Development prompts for software development.', 307),
  ('b2765aef-0068-4542-be30-40636d71cca6', '2f1a0f2d-7d18-4c8d-a4a5-16a8f8b9c1d1', 'backend-development', 'Backend Development', 'Backend Development prompts for software development.', 308),

  -- Content Writing (Category 40)
  ('b66f848d-a623-4de6-b183-cdda59334260', '8f9a3f3d-6c4b-45e8-a0c4-bfd5d6e0c5e2', 'blog-posts', 'Blog Posts', 'Blog Posts prompts for content writing.', 401),
  ('c09aff4c-afe5-4dea-be04-291f3ee96889', '8f9a3f3d-6c4b-45e8-a0c4-bfd5d6e0c5e2', 'articles', 'Articles', 'Articles prompts for content writing.', 402),
  ('1311bea7-8252-47a5-bef4-eb0f0acc06cc', '8f9a3f3d-6c4b-45e8-a0c4-bfd5d6e0c5e2', 'newsletters', 'Newsletters', 'Newsletters prompts for content writing.', 403),
  ('409885f3-b193-4236-8a41-5c3812d80c6c', '8f9a3f3d-6c4b-45e8-a0c4-bfd5d6e0c5e2', 'website-copy', 'Website Copy', 'Website Copy prompts for content writing.', 404),
  ('f451f8c4-71fd-41a3-b529-82ac0e2d12b3', '8f9a3f3d-6c4b-45e8-a0c4-bfd5d6e0c5e2', 'technical-writing', 'Technical Writing', 'Technical Writing prompts for content writing.', 405),
  ('1a5305b9-767c-4b11-af6c-7df1b56b23a6', '8f9a3f3d-6c4b-45e8-a0c4-bfd5d6e0c5e2', 'product-descriptions', 'Product Descriptions', 'Product Descriptions prompts for content writing.', 406),
  ('b3a5ea85-d7cb-44a0-8043-952b470079d1', '8f9a3f3d-6c4b-45e8-a0c4-bfd5d6e0c5e2', 'case-studies', 'Case Studies', 'Case Studies prompts for content writing.', 407),
  ('b8d56cc2-7cde-4559-b818-63270530155a', '8f9a3f3d-6c4b-45e8-a0c4-bfd5d6e0c5e2', 'whitepapers', 'Whitepapers', 'Whitepapers prompts for content writing.', 408),

  -- Social Media (Category 50)
  ('28d37874-fe6a-48f0-b25b-b534a89856d9', '6a2e4d55-3f7c-43b1-8b2e-3b5e4a2d8f4f', 'instagram-content', 'Instagram Content', 'Instagram Content prompts for social media.', 501),
  ('7372b612-fec1-4eb1-960f-631fe1ef9955', '6a2e4d55-3f7c-43b1-8b2e-3b5e4a2d8f4f', 'linkedin-posts', 'LinkedIn Posts', 'LinkedIn Posts prompts for social media.', 502),
  ('f01cfd30-1a2a-4e7a-82fc-e0924bab5e76', '6a2e4d55-3f7c-43b1-8b2e-3b5e4a2d8f4f', 'x-twitter-posts', 'X/Twitter Posts', 'X/Twitter Posts prompts for social media.', 503),
  ('c7be8fd9-0e93-4fad-a38d-7cb562484088', '6a2e4d55-3f7c-43b1-8b2e-3b5e4a2d8f4f', 'tiktok-scripts', 'TikTok Scripts', 'TikTok Scripts prompts for social media.', 504),
  ('4dd2423a-9c38-4cef-be03-0f68d977c721', '6a2e4d55-3f7c-43b1-8b2e-3b5e4a2d8f4f', 'content-calendars', 'Content Calendars', 'Content Calendars prompts for social media.', 505),
  ('1e866118-15fe-472f-b769-9e83037908ef', '6a2e4d55-3f7c-43b1-8b2e-3b5e4a2d8f4f', 'influencer-campaigns', 'Influencer Campaigns', 'Influencer Campaigns prompts for social media.', 506),
  ('ce7b4a4d-9c94-421c-8856-2203a5d5be80', '6a2e4d55-3f7c-43b1-8b2e-3b5e4a2d8f4f', 'community-management', 'Community Management', 'Community Management prompts for social media.', 507),
  ('366c5010-2a52-4c06-8c47-fc52078f0b27', '6a2e4d55-3f7c-43b1-8b2e-3b5e4a2d8f4f', 'viral-content-ideas', 'Viral Content Ideas', 'Viral Content Ideas prompts for social media.', 508),

  -- Education (Category 60)
  ('ada09686-d66a-4f0b-9e0a-c1425fb59fcf', '4f2d8c3b-9a1f-4c5e-a4d2-7f3b2e8c5d1a', 'lesson-plans', 'Lesson Plans', 'Lesson Plans prompts for education & learning.', 601),
  ('21269b03-0e05-4027-8a24-2add7666545b', '4f2d8c3b-9a1f-4c5e-a4d2-7f3b2e8c5d1a', 'quizzes', 'Quizzes', 'Quizzes prompts for education & learning.', 602),
  ('4151ed3f-d363-462a-b233-ada74ad0c114', '4f2d8c3b-9a1f-4c5e-a4d2-7f3b2e8c5d1a', 'study-guides', 'Study Guides', 'Study Guides prompts for education & learning.', 603),
  ('ee2b7e7d-bb42-4f6c-be94-8301c115c712', '4f2d8c3b-9a1f-4c5e-a4d2-7f3b2e8c5d1a', 'tutoring', 'Tutoring', 'Tutoring prompts for education & learning.', 604),
  ('bc93876d-ff59-49b5-b407-20d6a25736a8', '4f2d8c3b-9a1f-4c5e-a4d2-7f3b2e8c5d1a', 'curriculum-design', 'Curriculum Design', 'Curriculum Design prompts for education & learning.', 605),
  ('d6c5e29d-8241-42df-8a2e-5b5fc8bec031', '4f2d8c3b-9a1f-4c5e-a4d2-7f3b2e8c5d1a', 'educational-content', 'Educational Content', 'Educational Content prompts for education & learning.', 606),
  ('160d2677-af00-4e48-8b45-15c71e4dc423', '4f2d8c3b-9a1f-4c5e-a4d2-7f3b2e8c5d1a', 'flashcards', 'Flashcards', 'Flashcards prompts for education & learning.', 607),
  ('309407ba-30de-42b8-bdc0-5193da404ed3', '4f2d8c3b-9a1f-4c5e-a4d2-7f3b2e8c5d1a', 'exam-preparation', 'Exam Preparation', 'Exam Preparation prompts for education & learning.', 608),

  -- Research & Analysis (Category 70)
  ('0c5cedcf-62fc-4b6c-bf63-cb49d524b115', '5b4c7d8e-2f1a-4e5d-9a3c-8f1d2e4b5c6d', 'market-research', 'Market Research', 'Market Research prompts for research & analysis.', 701),
  ('8eec4276-3560-4bac-9ede-e21d5dfeeafe', '5b4c7d8e-2f1a-4e5d-9a3c-8f1d2e4b5c6d', 'competitor-analysis', 'Competitor Analysis', 'Competitor Analysis prompts for research & analysis.', 702),
  ('991308ea-6d15-4dd2-a4c2-aae8f0250445', '5b4c7d8e-2f1a-4e5d-9a3c-8f1d2e4b5c6d', 'industry-reports', 'Industry Reports', 'Industry Reports prompts for research & analysis.', 703),
  ('c7da3b59-384c-4c7a-a546-80a158d18312', '5b4c7d8e-2f1a-4e5d-9a3c-8f1d2e4b5c6d', 'data-analysis', 'Data Analysis', 'Data Analysis prompts for research & analysis.', 704),
  ('c7f7aeb1-1bf9-48d4-b0c6-2e1abd31f53c', '5b4c7d8e-2f1a-4e5d-9a3c-8f1d2e4b5c6d', 'trend-research', 'Trend Research', 'Trend Research prompts for research & analysis.', 705),
  ('dd80e0d3-ae57-4054-8bb8-5fa0e6aed0c8', '5b4c7d8e-2f1a-4e5d-9a3c-8f1d2e4b5c6d', 'user-research', 'User Research', 'User Research prompts for research & analysis.', 706),
  ('f5bcfa0a-ed23-4e50-9aeb-13101264d98d', '5b4c7d8e-2f1a-4e5d-9a3c-8f1d2e4b5c6d', 'survey-analysis', 'Survey Analysis', 'Survey Analysis prompts for research & analysis.', 707),
  ('d4500df6-fa16-4d98-9330-2d16cc6a2a8b', '5b4c7d8e-2f1a-4e5d-9a3c-8f1d2e4b5c6d', 'literature-reviews', 'Literature Reviews', 'Literature Reviews prompts for research & analysis.', 708),

  -- Customer Support (Category 80)
  ('99388d2c-f75a-4d0b-893c-689e0dd37024', '7d3e1f5a-6b4c-4a2d-9c7e-1f3a5b7d9c2e', 'faq-generation', 'FAQ Generation', 'FAQ Generation prompts for customer support.', 801),
  ('e3569ffa-67a8-4af7-8207-f8bd39bf5595', '7d3e1f5a-6b4c-4a2d-9c7e-1f3a5b7d9c2e', 'ticket-responses', 'Ticket Responses', 'Ticket Responses prompts for customer support.', 802),
  ('2221cd0a-1eb3-45b1-bd26-71907c73a881', '7d3e1f5a-6b4c-4a2d-9c7e-1f3a5b7d9c2e', 'chat-support', 'Chat Support', 'Chat Support prompts for customer support.', 803),
  ('1280783a-61af-4dd8-b81c-195170b7c14f', '7d3e1f5a-6b4c-4a2d-9c7e-1f3a5b7d9c2e', 'knowledge-base-articles', 'Knowledge Base Articles', 'Knowledge Base Articles prompts for customer support.', 804),
  ('7f311ff0-830f-4215-8241-da062a550ada', '7d3e1f5a-6b4c-4a2d-9c7e-1f3a5b7d9c2e', 'customer-onboarding', 'Customer Onboarding', 'Customer Onboarding prompts for customer support.', 805),
  ('c0503a7c-edfb-477c-89c1-c0e125a413cc', '7d3e1f5a-6b4c-4a2d-9c7e-1f3a5b7d9c2e', 'escalation-handling', 'Escalation Handling', 'Escalation Handling prompts for customer support.', 806),
  ('d740ec4f-38f4-4748-b33c-76bf33f3b3e3', '7d3e1f5a-6b4c-4a2d-9c7e-1f3a5b7d9c2e', 'service-scripts', 'Service Scripts', 'Service Scripts prompts for customer support.', 807),
  ('8405f815-65fd-47e4-b40e-adc1041ac359', '7d3e1f5a-6b4c-4a2d-9c7e-1f3a5b7d9c2e', 'feedback-analysis', 'Feedback Analysis', 'Feedback Analysis prompts for customer support.', 808),

  -- Productivity (Category 90)
  ('725d6232-e4e2-4165-a03d-6038f7bb34ea', '1c7d5e3f-4b2a-4d6c-8f9a-2b5e7d3f1c8a', 'task-planning', 'Task Planning', 'Task Planning prompts for productivity.', 901),
  ('2be0b1c5-2e5d-442c-9f20-f843f4a478f2', '1c7d5e3f-4b2a-4d6c-8f9a-2b5e7d3f1c8a', 'time-management', 'Time Management', 'Time Management prompts for productivity.', 902),
  ('bcd92e73-1b6b-4df3-8672-e825b548bc2b', '1c7d5e3f-4b2a-4d6c-8f9a-2b5e7d3f1c8a', 'goal-setting', 'Goal Setting', 'Goal Setting prompts for productivity.', 903),
  ('0c0402fb-60b9-4864-bcf1-a4cac4d4f6b3', '1c7d5e3f-4b2a-4d6c-8f9a-2b5e7d3f1c8a', 'note-taking', 'Note Taking', 'Note Taking prompts for productivity.', 904),
  ('f476d41b-1e35-4902-94d2-ea873dc9fa22', '1c7d5e3f-4b2a-4d6c-8f9a-2b5e7d3f1c8a', 'daily-planning', 'Daily Planning', 'Daily Planning prompts for productivity.', 905),
  ('ac514ca4-9f70-4c75-9079-310c84bbc664', '1c7d5e3f-4b2a-4d6c-8f9a-2b5e7d3f1c8a', 'personal-knowledge-management', 'Personal Knowledge Management', 'Personal Knowledge Management prompts for productivity.', 906),
  ('b7226cad-630d-441b-89e6-f234fafd74e3', '1c7d5e3f-4b2a-4d6c-8f9a-2b5e7d3f1c8a', 'meeting-notes', 'Meeting Notes', 'Meeting Notes prompts for productivity.', 907),
  ('bb751ccd-0cbb-43d3-af02-4251cc35fa40', '1c7d5e3f-4b2a-4d6c-8f9a-2b5e7d3f1c8a', 'productivity-systems', 'Productivity Systems', 'Productivity Systems prompts for productivity.', 908),

  -- Design & Creativity (Category 100)
  ('ecca97b9-13fa-43cb-a9b3-78349bbab86f', '9a4c7d2e-5f3b-4e1a-8d6c-7f2a5b4e3d1c', 'ui-design', 'UI Design', 'UI Design prompts for design & creativity.', 1001),
  ('f2a82ab1-7f36-4ced-8cd8-42679badb1cd', '9a4c7d2e-5f3b-4e1a-8d6c-7f2a5b4e3d1c', 'ux-research', 'UX Research', 'UX Research prompts for design & creativity.', 1002),
  ('54ff8024-0e33-4e49-a25e-17be4dbe5b29', '9a4c7d2e-5f3b-4e1a-8d6c-7f2a5b4e3d1c', 'branding', 'Branding', 'Branding prompts for design & creativity.', 1003),
  ('6a60dd1a-8064-4651-84c0-c387ce4a223f', '9a4c7d2e-5f3b-4e1a-8d6c-7f2a5b4e3d1c', 'logo-concepts', 'Logo Concepts', 'Logo Concepts prompts for design & creativity.', 1004),
  ('aea2d097-3ec8-46d4-aa15-68426e9d74db', '9a4c7d2e-5f3b-4e1a-8d6c-7f2a5b4e3d1c', 'graphic-design', 'Graphic Design', 'Graphic Design prompts for design & creativity.', 1005),
  ('a1c27a37-8ee6-4f9a-817e-f60c110e270e', '9a4c7d2e-5f3b-4e1a-8d6c-7f2a5b4e3d1c', 'creative-ideation', 'Creative Ideation', 'Creative Ideation prompts for design & creativity.', 1006),
  ('4c0f7d5f-ac0d-4b17-b345-9762c8e0ddfb', '9a4c7d2e-5f3b-4e1a-8d6c-7f2a5b4e3d1c', 'design-systems', 'Design Systems', 'Design Systems prompts for design & creativity.', 1007),
  ('5506196c-b5be-4d14-afe6-86a173ba83c2', '9a4c7d2e-5f3b-4e1a-8d6c-7f2a5b4e3d1c', 'color-palettes', 'Color Palettes', 'Color Palettes prompts for design & creativity.', 1008),

  -- Video & YouTube (Category 110)
  ('f17fe5f5-5d1c-45e2-9789-9dd981abfc74', '3e5a7d9c-2b4f-4c1d-8a6e-5f7d3b2a1c9e', 'youtube-scripts', 'YouTube Scripts', 'YouTube Scripts prompts for video & youtube.', 1101),
  ('f4cc0cb0-aad0-4ef9-9c0d-9068bc9028d8', '3e5a7d9c-2b4f-4c1d-8a6e-5f7d3b2a1c9e', 'youtube-shorts', 'YouTube Shorts', 'YouTube Shorts prompts for video & youtube.', 1102),
  ('718146f6-bd65-4a99-af7a-af4650c106e3', '3e5a7d9c-2b4f-4c1d-8a6e-5f7d3b2a1c9e', 'video-hooks', 'Video Hooks', 'Video Hooks prompts for video & youtube.', 1103),
  ('f6d31233-9365-4926-a793-97b5db50117f', '3e5a7d9c-2b4f-4c1d-8a6e-5f7d3b2a1c9e', 'thumbnail-ideas', 'Thumbnail Ideas', 'Thumbnail Ideas prompts for video & youtube.', 1104),
  ('29802d40-a86a-439d-8f60-f806a4d3aeaa', '3e5a7d9c-2b4f-4c1d-8a6e-5f7d3b2a1c9e', 'video-seo', 'Video SEO', 'Video SEO prompts for video & youtube.', 1105),
  ('dbc1c773-7804-4b9a-a46e-350e47b3c491', '3e5a7d9c-2b4f-4c1d-8a6e-5f7d3b2a1c9e', 'podcast-scripts', 'Podcast Scripts', 'Podcast Scripts prompts for video & youtube.', 1106),
  ('e323ad19-3309-414e-89b4-1c5de8b08cbb', '3e5a7d9c-2b4f-4c1d-8a6e-5f7d3b2a1c9e', 'storytelling', 'Storytelling', 'Storytelling prompts for video & youtube.', 1107),
  ('72419033-d524-4bce-8deb-ac1cde9b7281', '3e5a7d9c-2b4f-4c1d-8a6e-5f7d3b2a1c9e', 'reels-content', 'Reels Content', 'Reels Content prompts for video & youtube.', 1108),

  -- Career & Recruiting (Category 120)
  ('d6fea4ac-9972-4535-89fe-efdb66d0a478', '2d4f6a8c-1b3e-4d7a-9c5f-6a8d2b4e1c7f', 'resume-writing', 'Resume Writing', 'Resume Writing prompts for career & recruiting.', 1201),
  ('1cb9cc5c-bb43-42ee-ac96-89f60d5a51bb', '2d4f6a8c-1b3e-4d7a-9c5f-6a8d2b4e1c7f', 'cover-letters', 'Cover Letters', 'Cover Letters prompts for career & recruiting.', 1202),
  ('f17cadb5-422e-4cff-902a-a661f4a1965c', '2d4f6a8c-1b3e-4d7a-9c5f-6a8d2b4e1c7f', 'interview-preparation', 'Interview Preparation', 'Interview Preparation prompts for career & recruiting.', 1203),
  ('dcf36215-5f3c-4545-9197-0d1412e60485', '2d4f6a8c-1b3e-4d7a-9c5f-6a8d2b4e1c7f', 'job-descriptions', 'Job Descriptions', 'Job Descriptions prompts for career & recruiting.', 1204),
  ('65564baa-3a9b-45aa-ab0b-d3e5b247044e', '2d4f6a8c-1b3e-4d7a-9c5f-6a8d2b4e1c7f', 'candidate-screening', 'Candidate Screening', 'Candidate Screening prompts for career & recruiting.', 1205),
  ('9530859f-48f4-43dc-9d4a-2e94854169fa', '2d4f6a8c-1b3e-4d7a-9c5f-6a8d2b4e1c7f', 'career-coaching', 'Career Coaching', 'Career Coaching prompts for career & recruiting.', 1206),
  ('b0f4e7c6-7ff7-42e1-9179-816051624c06', '2d4f6a8c-1b3e-4d7a-9c5f-6a8d2b4e1c7f', 'linkedin-optimization', 'LinkedIn Optimization', 'LinkedIn Optimization prompts for career & recruiting.', 1207),
  ('60a67ac5-4d58-4f29-8388-d311d7498461', '2d4f6a8c-1b3e-4d7a-9c5f-6a8d2b4e1c7f', 'hiring-workflows', 'Hiring Workflows', 'Hiring Workflows prompts for career & recruiting.', 1208),

  -- Finance & Investing (Category 130)
  ('70282fcb-b540-48f8-a809-65c7b27aa475', '6e8c1d3f-4a5b-4c7d-9e2f-1d3c5b7a9e4f', 'budget-planning', 'Budget Planning', 'Budget Planning prompts for finance & investing.', 1301),
  ('431adc97-bef7-4a93-b710-fd67c570a174', '6e8c1d3f-4a5b-4c7d-9e2f-1d3c5b7a9e4f', 'investment-analysis', 'Investment Analysis', 'Investment Analysis prompts for finance & investing.', 1302),
  ('a9058545-5bc1-4661-b16d-3f3820805ed1', '6e8c1d3f-4a5b-4c7d-9e2f-1d3c5b7a9e4f', 'financial-reports', 'Financial Reports', 'Financial Reports prompts for finance & investing.', 1303),
  ('39d43f6c-5005-4d88-9acd-c2c81d4aa2a5', '6e8c1d3f-4a5b-4c7d-9e2f-1d3c5b7a9e4f', 'stock-research', 'Stock Research', 'Stock Research prompts for finance & investing.', 1304),
  ('b075b424-9aa6-403a-b5c5-4f7c1915adfb', '6e8c1d3f-4a5b-4c7d-9e2f-1d3c5b7a9e4f', 'risk-assessment', 'Risk Assessment', 'Risk Assessment prompts for finance & investing.', 1305),
  ('b3292e04-7b92-49c8-9c3d-56a288e64b8f', '6e8c1d3f-4a5b-4c7d-9e2f-1d3c5b7a9e4f', 'financial-forecasting', 'Financial Forecasting', 'Financial Forecasting prompts for finance & investing.', 1306),
  ('3371a6b1-a468-4848-b882-a43d5ba80bec', '6e8c1d3f-4a5b-4c7d-9e2f-1d3c5b7a9e4f', 'personal-finance', 'Personal Finance', 'Personal Finance prompts for finance & investing.', 1307),
  ('0ff9a6a2-adcb-4d67-8eb0-7ca304071b34', '6e8c1d3f-4a5b-4c7d-9e2f-1d3c5b7a9e4f', 'business-finance', 'Business Finance', 'Business Finance prompts for finance & investing.', 1308),

  -- Healthcare (Category 140)
  ('9d864cd2-78bc-4dc5-89ef-d3393dd46594', '5d7a9c2e-3b1f-4e6d-8c4a-7d2f5b1e3c9a', 'clinical-documentation', 'Clinical Documentation', 'Clinical Documentation prompts for healthcare.', 1401),
  ('797bf12c-8bdc-4aeb-b4a8-375bdd4e76a0', '5d7a9c2e-3b1f-4e6d-8c4a-7d2f5b1e3c9a', 'patient-communication', 'Patient Communication', 'Patient Communication prompts for healthcare.', 1402),
  ('52841772-b59b-43a3-9f8d-be61fe0a10a0', '5d7a9c2e-3b1f-4e6d-8c4a-7d2f5b1e3c9a', 'medical-research', 'Medical Research', 'Medical Research prompts for healthcare.', 1403),
  ('8de4f625-c58e-4ab0-ba16-6998f3c155d2', '5d7a9c2e-3b1f-4e6d-8c4a-7d2f5b1e3c9a', 'healthcare-administration', 'Healthcare Administration', 'Healthcare Administration prompts for healthcare.', 1404),
  ('2ccfa17f-5793-4a95-b0ec-2ce34e562745', '5d7a9c2e-3b1f-4e6d-8c4a-7d2f5b1e3c9a', 'medical-education', 'Medical Education', 'Medical Education prompts for healthcare.', 1405),
  ('a4278e96-c410-4f79-badc-4238c3f377fc', '5d7a9c2e-3b1f-4e6d-8c4a-7d2f5b1e3c9a', 'compliance-documentation', 'Compliance Documentation', 'Compliance Documentation prompts for healthcare.', 1406),
  ('dd1ccc5b-2bbd-4f90-a284-03c0afd2d8ca', '5d7a9c2e-3b1f-4e6d-8c4a-7d2f5b1e3c9a', 'treatment-planning', 'Treatment Planning', 'Treatment Planning prompts for healthcare.', 1407),
  ('3ac711de-3ccc-4eb2-b043-b9e2a0d30e22', '5d7a9c2e-3b1f-4e6d-8c4a-7d2f5b1e3c9a', 'health-coaching', 'Health Coaching', 'Health Coaching prompts for healthcare.', 1408),

  -- Legal (Category 150)
  ('fdff179e-467e-4ff9-89c0-93d6fb525a5f', '8c2f4a6d-1e3b-4d7c-9a5f-2c4e6d8b1a3f', 'contract-drafting', 'Contract Drafting', 'Contract Drafting prompts for legal.', 1501),
  ('88a67a4e-f3f1-4b70-98da-45df8d1fabcd', '8c2f4a6d-1e3b-4d7c-9a5f-2c4e6d8b1a3f', 'legal-research', 'Legal Research', 'Legal Research prompts for legal.', 1502),
  ('eab12946-e96e-4f80-9dc7-8dd0e0d88995', '8c2f4a6d-1e3b-4d7c-9a5f-2c4e6d8b1a3f', 'compliance', 'Compliance', 'Compliance prompts for legal.', 1503),
  ('0a011ff3-9031-47da-b594-a8bd55ac8e6a', '8c2f4a6d-1e3b-4d7c-9a5f-2c4e6d8b1a3f', 'policy-writing', 'Policy Writing', 'Policy Writing prompts for legal.', 1504),
  ('6626944d-a0ec-44d6-b31e-d40bd2ca0a56', '8c2f4a6d-1e3b-4d7c-9a5f-2c4e6d8b1a3f', 'risk-assessment', 'Risk Assessment', 'Risk Assessment prompts for legal.', 1505),
  ('577f4ba9-2866-4940-8448-9b8a72fdb778', '8c2f4a6d-1e3b-4d7c-9a5f-2c4e6d8b1a3f', 'case-summaries', 'Case Summaries', 'Case Summaries prompts for legal.', 1506),
  ('46cfdbce-6bcd-4c56-8c3a-716dbcfbb677', '8c2f4a6d-1e3b-4d7c-9a5f-2c4e6d8b1a3f', 'regulatory-analysis', 'Regulatory Analysis', 'Regulatory Analysis prompts for legal.', 1507),
  ('5128832c-0ab2-4ede-ae9a-3674b6473408', '8c2f4a6d-1e3b-4d7c-9a5f-2c4e6d8b1a3f', 'legal-documentation', 'Legal Documentation', 'Legal Documentation prompts for legal.', 1508),

  -- E-commerce (Category 160)
  ('643bc995-8f22-482c-b745-7b4ce1425ff9', '4a6d8c1f-2b3e-4d5a-9f7c-6a1d3e5b7c9f', 'product-descriptions', 'Product Descriptions', 'Product Descriptions prompts for e-commerce.', 1601),
  ('662c2f31-6fb0-4681-85b5-a3a22af56c56', '4a6d8c1f-2b3e-4d5a-9f7c-6a1d3e5b7c9f', 'marketplace-listings', 'Marketplace Listings', 'Marketplace Listings prompts for e-commerce.', 1602),
  ('efc4b673-b950-46bd-b09a-b0e58af6ebd7', '4a6d8c1f-2b3e-4d5a-9f7c-6a1d3e5b7c9f', 'conversion-optimization', 'Conversion Optimization', 'Conversion Optimization prompts for e-commerce.', 1603),
  ('499e9940-248a-4585-9ece-b77c1bb7eaac', '4a6d8c1f-2b3e-4d5a-9f7c-6a1d3e5b7c9f', 'customer-retention', 'Customer Retention', 'Customer Retention prompts for e-commerce.', 1604),
  ('3d9b8b7c-3048-4b32-820c-5a582572f729', '4a6d8c1f-2b3e-4d5a-9f7c-6a1d3e5b7c9f', 'email-campaigns', 'Email Campaigns', 'Email Campaigns prompts for e-commerce.', 1605),
  ('edc6711c-5aed-4480-ac80-15273cf61531', '4a6d8c1f-2b3e-4d5a-9f7c-6a1d3e5b7c9f', 'product-research', 'Product Research', 'Product Research prompts for e-commerce.', 1606),
  ('53f133f0-dabf-4c0c-b7dd-c467cc12b60e', '4a6d8c1f-2b3e-4d5a-9f7c-6a1d3e5b7c9f', 'pricing-strategy', 'Pricing Strategy', 'Pricing Strategy prompts for e-commerce.', 1607),
  ('eb1e8440-268f-444c-ad68-6e465efd3ed7', '4a6d8c1f-2b3e-4d5a-9f7c-6a1d3e5b7c9f', 'store-management', 'Store Management', 'Store Management prompts for e-commerce.', 1608),

  -- Human Resources (Category 170)
  ('6f4a49ac-dc7c-4d69-8476-ef093550b758', '7b9d1e3f-4c5a-4d8e-9a2f-3e5b7c1d4a6f', 'employee-onboarding', 'Employee Onboarding', 'Employee Onboarding prompts for human resources.', 1701),
  ('4da94c43-4cc0-4e0a-b208-0f5b7e4e562c', '7b9d1e3f-4c5a-4d8e-9a2f-3e5b7c1d4a6f', 'performance-reviews', 'Performance Reviews', 'Performance Reviews prompts for human resources.', 1702),
  ('57c31ada-00d3-4efa-b6e3-ba6dbd5000e6', '7b9d1e3f-4c5a-4d8e-9a2f-3e5b7c1d4a6f', 'hr-policies', 'HR Policies', 'HR Policies prompts for human resources.', 1703),
  ('8e5a4bdd-5b70-4349-866d-2e0b276e0c54', '7b9d1e3f-4c5a-4d8e-9a2f-3e5b7c1d4a6f', 'internal-communications', 'Internal Communications', 'Internal Communications prompts for human resources.', 1704),
  ('ae40ee99-bc61-4875-972d-1248a7576bfa', '7b9d1e3f-4c5a-4d8e-9a2f-3e5b7c1d4a6f', 'training-programs', 'Training Programs', 'Training Programs prompts for human resources.', 1705),
  ('a61af588-7ae6-40ae-af50-2c3a014ed71e', '7b9d1e3f-4c5a-4d8e-9a2f-3e5b7c1d4a6f', 'employee-engagement', 'Employee Engagement', 'Employee Engagement prompts for human resources.', 1706),
  ('2786d6c4-2d2f-4c80-8e15-1e6fe605a19e', '7b9d1e3f-4c5a-4d8e-9a2f-3e5b7c1d4a6f', 'recruitment', 'Recruitment', 'Recruitment prompts for human resources.', 1707),
  ('b3cef807-62e4-415b-8f7b-7a2c596f67da', '7b9d1e3f-4c5a-4d8e-9a2f-3e5b7c1d4a6f', 'workforce-planning', 'Workforce Planning', 'Workforce Planning prompts for human resources.', 1708),

  -- AI Agents & Automation (Category 180)
  ('4b5da3bf-078b-4e6a-92f5-7797b809266b', '1e3c5a7d-9b2f-4d6a-8c4e-5a7d1b3c9f2e', 'agent-planning', 'Agent Planning', 'Agent Planning prompts for ai agents & automation.', 1801),
  ('7e30a973-89d3-41d5-a166-38e8a09ec614', '1e3c5a7d-9b2f-4d6a-8c4e-5a7d1b3c9f2e', 'multi-agent-systems', 'Multi-Agent Systems', 'Multi-Agent Systems prompts for ai agents & automation.', 1802),
  ('888138e5-8f43-4e6d-8aef-2adc815ff9bd', '1e3c5a7d-9b2f-4d6a-8c4e-5a7d1b3c9f2e', 'workflow-automation', 'Workflow Automation', 'Workflow Automation prompts for ai agents & automation.', 1803),
  ('34e80b30-ebd1-401c-a09b-9bb6c501ea02', '1e3c5a7d-9b2f-4d6a-8c4e-5a7d1b3c9f2e', 'research-agents', 'Research Agents', 'Research Agents prompts for ai agents & automation.', 1804),
  ('a164f0fd-6c55-4495-bd31-42d9cc6326a1', '1e3c5a7d-9b2f-4d6a-8c4e-5a7d1b3c9f2e', 'coding-agents', 'Coding Agents', 'Coding Agents prompts for ai agents & automation.', 1805),
  ('39468b3e-ad1d-42a1-9c77-405c50efa548', '1e3c5a7d-9b2f-4d6a-8c4e-5a7d1b3c9f2e', 'sales-agents', 'Sales Agents', 'Sales Agents prompts for ai agents & automation.', 1806),
  ('02555421-a4b9-4f88-a249-961530c41db1', '1e3c5a7d-9b2f-4d6a-8c4e-5a7d1b3c9f2e', 'customer-service-agents', 'Customer Service Agents', 'Customer Service Agents prompts for ai agents & automation.', 1807),
  ('338f7cd6-09c9-4789-950d-02817e3ed7ed', '1e3c5a7d-9b2f-4d6a-8c4e-5a7d1b3c9f2e', 'autonomous-workflows', 'Autonomous Workflows', 'Autonomous Workflows prompts for ai agents & automation.', 1808),

  -- Prompt Engineering (Category 190)
  ('213569e9-16e9-4230-80cf-6412e74ce0b4', '5a7d9c1e-3b4f-4d6c-8a2e-7d1c3b5f9a4e', 'system-prompts', 'System Prompts', 'System Prompts prompts for prompt engineering.', 1901),
  ('b5eecf5e-e571-41cb-98fa-f60157105d86', '5a7d9c1e-3b4f-4d6c-8a2e-7d1c3b5f9a4e', 'few-shot-prompting', 'Few-Shot Prompting', 'Few-Shot Prompting prompts for prompt engineering.', 1902),
  ('31ae7143-eddb-4bc3-9d9a-d0fec10fe864', '5a7d9c1e-3b4f-4d6c-8a2e-7d1c3b5f9a4e', 'chain-of-thought', 'Chain of Thought', 'Chain of Thought prompts for prompt engineering.', 1903),
  ('b56087ba-67c0-4bd2-8c4c-c4e53a812bee', '5a7d9c1e-3b4f-4d6c-8a2e-7d1c3b5f9a4e', 'tree-of-thoughts', 'Tree of Thoughts', 'Tree of Thoughts prompts for prompt engineering.', 1904),
  ('09604b62-06bc-48e5-80aa-32c6b5f50152', '5a7d9c1e-3b4f-4d6c-8a2e-7d1c3b5f9a4e', 'react', 'ReAct', 'ReAct prompts for prompt engineering.', 1905),
  ('5820a248-3b1c-484c-bf4d-c254e0561269', '5a7d9c1e-3b4f-4d6c-8a2e-7d1c3b5f9a4e', 'structured-outputs', 'Structured Outputs', 'Structured Outputs prompts for prompt engineering.', 1906),
  ('f2730005-84e3-4ea4-9b8e-f2af94ba85a9', '5a7d9c1e-3b4f-4d6c-8a2e-7d1c3b5f9a4e', 'prompt-testing', 'Prompt Testing', 'Prompt Testing prompts for prompt engineering.', 1907),
  ('b5123816-bbda-4daa-8db3-52c5cb38c218', '5a7d9c1e-3b4f-4d6c-8a2e-7d1c3b5f9a4e', 'prompt-optimization', 'Prompt Optimization', 'Prompt Optimization prompts for prompt engineering.', 1908),

  -- General Purpose (Category 200)
  ('93d6aa90-0b8a-4c8d-99ff-fd8f59b135e4', '9d1f3b5c-7a4e-4d8c-2f6a-1b3e5c7d9a4f', 'brainstorming', 'Brainstorming', 'Brainstorming prompts for general purpose.', 2001),
  ('04ffbc14-55da-49a7-804c-f00bbe471e2c', '9d1f3b5c-7a4e-4d8c-2f6a-1b3e5c7d9a4f', 'decision-making', 'Decision Making', 'Decision Making prompts for general purpose.', 2002),
  ('39e13b72-8d8f-4e63-bb20-c66adecc56c9', '9d1f3b5c-7a4e-4d8c-2f6a-1b3e5c7d9a4f', 'summarization', 'Summarization', 'Summarization prompts for general purpose.', 2003),
  ('5037ee72-cf1a-472a-b091-188659243df5', '9d1f3b5c-7a4e-4d8c-2f6a-1b3e5c7d9a4f', 'translation', 'Translation', 'Translation prompts for general purpose.', 2004),
  ('60105c4e-d13c-45b7-b40f-a5fce673ea34', '9d1f3b5c-7a4e-4d8c-2f6a-1b3e5c7d9a4f', 'writing-assistance', 'Writing Assistance', 'Writing Assistance prompts for general purpose.', 2005),
  ('5ce1bc0b-7aba-4535-856b-1823972732ef', '9d1f3b5c-7a4e-4d8c-2f6a-1b3e5c7d9a4f', 'idea-generation', 'Idea Generation', 'Idea Generation prompts for general purpose.', 2006),
  ('3d5dfb98-faa0-44ec-8b94-cd9ce0c13005', '9d1f3b5c-7a4e-4d8c-2f6a-1b3e5c7d9a4f', 'problem-solving', 'Problem Solving', 'Problem Solving prompts for general purpose.', 2007),
  ('d706ec23-1f21-44fa-88a2-7bee404c5dab', '9d1f3b5c-7a4e-4d8c-2f6a-1b3e5c7d9a4f', 'everyday-productivity', 'Everyday Productivity', 'Everyday Productivity prompts for general purpose.', 2008)

ON CONFLICT (id) DO UPDATE SET 
  category_id = EXCLUDED.category_id,
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;
