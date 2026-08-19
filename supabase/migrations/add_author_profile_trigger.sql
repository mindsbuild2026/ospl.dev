-- Migration: Automatically create a public.author profile for every new auth.users account
-- Includes a one-time backfill for existing auth.users without author profiles

-- Allow authenticated users to insert their own author profile if needed.
CREATE POLICY IF NOT EXISTS "Authors can insert their own profile" ON public.authors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Generate a unique handle while preserving a readable base value.
CREATE OR REPLACE FUNCTION public.generate_unique_author_handle(candidate TEXT, user_uuid UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  normalized TEXT;
  candidate_handle TEXT;
  suffix INTEGER := 0;
BEGIN
  normalized := lower(regexp_replace(coalesce(candidate, 'user'), '[^a-z0-9_.-]', '_', 'g'));
  normalized := regexp_replace(normalized, '_+', '_', 'g');
  normalized := trim(both '_' FROM normalized);

  IF normalized = '' THEN
    normalized := concat('user_', left(user_uuid::text, 8));
  END IF;

  candidate_handle := normalized;

  LOOP
    IF suffix > 0 THEN
      candidate_handle := left(normalized, greatest(1, 48 - length('_' || suffix))) || '_' || suffix;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.authors WHERE handle = candidate_handle) THEN
      RETURN candidate_handle;
    END IF;

    suffix := suffix + 1;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_author_profile_for_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  raw_metadata JSONB := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
  user_metadata JSONB := coalesce(NEW.user_metadata, '{}'::jsonb);
  candidate_handle TEXT;
  author_name TEXT;
  github_profile TEXT;
  avatar_url TEXT;
  github_id TEXT;
BEGIN
  PERFORM set_config('row_security', 'off', true);

  author_name := coalesce(
    raw_metadata->>'name',
    user_metadata->>'name',
    user_metadata->>'full_name',
    split_part(NEW.email, '@', 1),
    concat('User ', left(NEW.id::text, 8))
  );

  candidate_handle := coalesce(
    raw_metadata->>'login',
    user_metadata->>'login',
    user_metadata->>'username',
    split_part(NEW.email, '@', 1),
    concat('user_', left(NEW.id::text, 8))
  );

  github_profile := coalesce(
    raw_metadata->>'html_url',
    raw_metadata->>'url',
    user_metadata->>'profile_url',
    NULL
  );

  avatar_url := coalesce(raw_metadata->>'avatar_url', user_metadata->>'avatar_url', NULL);
  github_id := coalesce(raw_metadata->>'id', NULL);

  INSERT INTO public.authors (
    user_id,
    github_id,
    handle,
    name,
    avatar_url,
    bio,
    website,
    github,
    verified,
    reputation
  ) VALUES (
    NEW.id,
    github_id,
    public.generate_unique_author_handle(candidate_handle, NEW.id),
    author_name,
    avatar_url,
    NULL,
    NULL,
    github_profile,
    FALSE,
    0
  );

  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  -- If a concurrent profile already exists, ignore and continue.
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_author_profile_on_auth_user_insert ON auth.users;
CREATE TRIGGER create_author_profile_on_auth_user_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_author_profile_for_auth_user();

-- Backfill any existing auth.users records that are missing a public.authors row.
INSERT INTO public.authors (
  user_id,
  github_id,
  handle,
  name,
  avatar_url,
  bio,
  website,
  github,
  verified,
  reputation
)
SELECT
  u.id,
  coalesce(u.raw_user_meta_data->>'id', NULL),
  public.generate_unique_author_handle(
    coalesce(
      u.raw_user_meta_data->>'login',
      u.user_metadata->>'login',
      u.user_metadata->>'username',
      split_part(u.email, '@', 1),
      concat('user_', left(u.id::text, 8))
    ),
    u.id
  ),
  coalesce(
    u.raw_user_meta_data->>'name',
    u.user_metadata->>'name',
    u.user_metadata->>'full_name',
    split_part(u.email, '@', 1),
    concat('User ', left(u.id::text, 8))
  ),
  coalesce(u.raw_user_meta_data->>'avatar_url', u.user_metadata->>'avatar_url', NULL),
  NULL,
  NULL,
  coalesce(
    u.raw_user_meta_data->>'html_url',
    u.raw_user_meta_data->>'url',
    u.user_metadata->>'profile_url',
    NULL
  ),
  FALSE,
  0
FROM auth.users u
LEFT JOIN public.authors a ON a.user_id = u.id
WHERE a.user_id IS NULL;
