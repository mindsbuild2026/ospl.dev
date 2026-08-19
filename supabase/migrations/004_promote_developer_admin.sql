-- Migration: Promote developer account to admin in public.authors table
-- Run this once to grant the developer access to the moderation panel.

UPDATE public.authors
SET is_admin = true
WHERE user_id = '77ffc419-d81a-49f4-a3ee-fcd349436284';
