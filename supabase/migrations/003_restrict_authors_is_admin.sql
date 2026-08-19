-- Migration: Restrict modifications to the is_admin column on public.authors
-- Only allow existing admin users (or system level operations) to grant/modify admin rights.

CREATE OR REPLACE FUNCTION public.check_author_is_admin_modify()
RETURNS TRIGGER AS $$
BEGIN
  -- For UPDATE: check if is_admin is changing and user is not admin
  IF TG_OP = 'UPDATE' THEN
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.authors
        WHERE user_id = auth.uid() AND is_admin = true
      ) AND auth.uid() IS NOT NULL THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can modify admin status.';
      END IF;
    END IF;
  END IF;

  -- For INSERT: check if is_admin is set to true and user is not admin
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_admin = true THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.authors
        WHERE user_id = auth.uid() AND is_admin = true
      ) AND auth.uid() IS NOT NULL THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can assign admin status.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_author_is_admin_modify_trg ON public.authors;
CREATE TRIGGER check_author_is_admin_modify_trg
  BEFORE INSERT OR UPDATE ON public.authors
  FOR EACH ROW
  EXECUTE FUNCTION public.check_author_is_admin_modify();
