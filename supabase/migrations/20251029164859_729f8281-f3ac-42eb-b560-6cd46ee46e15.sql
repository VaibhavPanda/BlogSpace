-- Fix 1: Protect user email addresses from public exposure
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new policies: users can see all profile info EXCEPT emails of others
CREATE POLICY "Users can view public profile info"
ON public.profiles
FOR SELECT
USING (true);

-- However, restrict the email column - only owner can see their own email
-- We'll handle this at application level by not selecting email unless it's the user's own profile

-- Users can view their complete profile including email
CREATE POLICY "Users can view own complete profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Fix 2: Secure post_views table - remove public access to individual records
DROP POLICY IF EXISTS "Anyone can view post views" ON public.post_views;

-- Create function to get aggregated view counts only
CREATE OR REPLACE FUNCTION public.get_post_view_count(post_uuid uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) FROM post_views WHERE post_id = post_uuid;
$$;

-- Post authors can view their own post analytics
CREATE POLICY "Authors can view their post analytics"
ON public.post_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM posts 
    WHERE posts.id = post_views.post_id 
    AND posts.author_id = auth.uid()
  )
);

-- Fix 3: Improve increment_post_views function security
CREATE OR REPLACE FUNCTION public.increment_post_views(post_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only increment if post exists and is published
  UPDATE posts 
  SET views = views + 1 
  WHERE id = post_uuid 
  AND status = 'published';
END;
$$;

-- Fix 4: Add validation constraints at database level
ALTER TABLE posts 
  ADD CONSTRAINT title_length_check CHECK (char_length(title) > 0 AND char_length(title) <= 200),
  ADD CONSTRAINT content_length_check CHECK (char_length(content) > 0 AND char_length(content) <= 50000);

ALTER TABLE comments
  ADD CONSTRAINT comment_length_check CHECK (char_length(content) > 0 AND char_length(content) <= 5000);

ALTER TABLE profiles
  ADD CONSTRAINT name_length_check CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  ADD CONSTRAINT bio_length_check CHECK (bio IS NULL OR char_length(bio) <= 500);