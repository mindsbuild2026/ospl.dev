-- ============================================================================
-- PROMPT TYPES DATA POPULATION
-- ============================================================================
-- Seed script for prompt methodologies and structural types.
-- ============================================================================

INSERT INTO prompt_types (
  id,
  slug,
  name,
  description
) VALUES 
  ('18619ec4-3112-4eb4-93ff-183e29f6227b', 'zero-shot', 'Zero-Shot Prompt', 'Direct instructions or questions given to the AI without providing any prior examples.'),
  ('a5c54e0c-843e-4360-9111-92ab8d31efde', 'few-shot', 'Few-Shot Prompt', 'Includes specific examples of the desired input and output to guide the AI''s response format and accuracy.'),
  ('4914c62c-733c-41c5-8422-7729f2712f5a', 'chain-of-thought', 'Chain-of-Thought (CoT)', 'Forces the AI to explain its reasoning step-by-step before arriving at a final answer.'),
  ('22d25089-a2e1-4560-ad54-8c8872b7a950', 'template', 'Parameterized Template', 'A reusable prompt structure containing variables or placeholders (e.g., [INSERT TOPIC]) for dynamic inputs.'),
  ('91b24e65-22d7-425f-86ea-e91b61d36bb6', 'persona', 'Persona / Roleplay', 'Instructs the AI to act as a specific expert, character, or system (e.g., ''Act as a Senior DevOps Engineer'').'),
  ('e1bcba59-33b0-466f-bca8-e9f0be07223b', 'meta-prompt', 'Meta-Prompt', 'A prompt designed specifically to ask the AI to generate, optimize, or evaluate other prompts.'),
  ('66d8e20f-04df-4160-84c4-fce892eb5f98', 'data-extraction', 'Data Extraction / Formatting', 'Strictly commands the AI to extract unstructured data and output it in a rigid format like JSON, CSV, or XML.'),
  ('bbfa981e-deea-4df2-8176-79cf5cbfe978', 'negative-prompt', 'Negative Prompt', 'Focuses heavily on constraints, telling the AI exactly what NOT to do, include, or generate.'),
  ('78ca4a9b-3de8-48b4-933e-10815779c13e', 'instructional', 'Instructional / Task-Based', 'A standard, command-oriented prompt focused on executing a single, well-defined task.'),
  ('c54dbaf1-87ab-433b-85ed-ba9df9b32cb7', 'conversational', 'Conversational Starter', 'An open-ended prompt designed to initiate a continuous, multi-turn chat rather than a single task.')

ON CONFLICT (id) DO UPDATE SET 
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  description = EXCLUDED.description;
