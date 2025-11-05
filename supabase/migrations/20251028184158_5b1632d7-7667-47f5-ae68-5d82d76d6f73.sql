-- Fix function search path for increment_post_views
DROP FUNCTION IF EXISTS increment_post_views(UUID);

CREATE OR REPLACE FUNCTION increment_post_views(post_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE posts SET views = views + 1 WHERE id = post_uuid;
END;
$$;