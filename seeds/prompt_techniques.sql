-- ============================================================================
-- PROMPT TECHNIQUES DATA POPULATION
-- ============================================================================
-- Seed script for advanced AI prompting techniques and cognitive strategies.
-- ============================================================================

INSERT INTO prompt_techniques (
  id,
  slug,
  name,
  description
) VALUES 
  ('c912a7a4-3721-4f1a-b3a5-e3d0c9f1a2b1', 'self-reflection', 'Self-Reflection & Critique', 'Instructs the AI to review, critique, and iteratively improve its own generated response before presenting the final output.'),
  ('e2f7b8d0-9a4c-4e8b-a1c3-5f6d7e8b9a0c', 'least-to-most', 'Least-to-Most Prompting', 'Breaks down a complex problem into a sequence of simpler sub-problems, solving them sequentially to reach the final conclusion.'),
  ('b3a4c5d6-e7f8-4a9b-c0d1-e2f3a4b5c6d7', 'step-back', 'Step-Back Prompting', 'Abstracts a specific problem into a higher-level concept or principle first, using that general understanding to solve the specific task.'),
  ('f8e7d6c5-b4a3-4921-9876-1a2b3c4d5e6f', 'context-injection', 'Context Injection (RAG)', 'Structures the prompt to strictly separate provided reference data (the context) from the instructions to minimize hallucinations.'),
  ('1a2b3c4d-5e6f-4a9b-8c7d-e8f9a0b1c2d3', 'generated-knowledge', 'Generated Knowledge', 'Forces the AI to generate relevant facts or background information about a topic before attempting to answer the main query.'),
  ('9b8a7c6d-5e4f-4321-a0b1-c2d3e4f5a6b7', 'directional-stimulus', 'Directional Stimulus', 'Provides specific hints, keywords, or a guiding trajectory within the prompt to steer the AI''s generation toward a desired angle.'),
  ('4c5d6e7f-8a9b-4123-c0d1-e2f3a4b5c6d7', 'skeleton-of-thought', 'Skeleton-of-Thought', 'Directs the AI to generate a high-level structural outline or ''skeleton'' first, before fleshing out the detailed content.'),
  ('d1c2b3a4-e5f6-4789-a0b1-c2d3e4f5a6b7', 'emotional-prompting', 'Emotional Prompting', 'Applies psychological stakes or emotional urgency (e.g., ''This is critical for my career'') to enhance the AI''s focus and output quality.'),
  ('7f8e9d0c-b1a2-4345-c6d7-e8f9a0b1c2d3', 'socratic-maieutic', 'Socratic Questioning', 'Prompts the AI to act as a tutor or interrogator, asking a series of probing questions to the user rather than providing direct answers.'),
  ('3a4b5c6d-7e8f-4901-a1b2-c3d4e5f6a7b8', 'prompt-chaining', 'Prompt Chaining', 'A technique designed for multi-step workflows where the output of this prompt is specifically formatted to serve as the input for a subsequent prompt.')

ON CONFLICT (id) DO UPDATE SET 
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  description = EXCLUDED.description;
