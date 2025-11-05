-- Create post status enum
CREATE TYPE post_status AS ENUM ('draft', 'published');

-- Add status column to posts (default to published for existing posts)
ALTER TABLE posts ADD COLUMN status post_status DEFAULT 'published' NOT NULL;

-- Add views column to posts
ALTER TABLE posts ADD COLUMN views INTEGER DEFAULT 0 NOT NULL;

-- Create post_views table to track individual views
CREATE TABLE post_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  ip_address TEXT
);

-- Create follows table for user following system
CREATE TABLE follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS on new tables
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_views
CREATE POLICY "Anyone can view post views" ON post_views FOR SELECT USING (true);
CREATE POLICY "Anyone can insert post views" ON post_views FOR INSERT WITH CHECK (true);

-- RLS Policies for follows
CREATE POLICY "Anyone can view follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Update posts RLS policies to handle drafts
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
CREATE POLICY "Anyone can view published posts" ON posts 
  FOR SELECT 
  USING (status = 'published' OR auth.uid() = author_id);

-- Create indexes for performance
CREATE INDEX idx_post_views_post_id ON post_views(post_id);
CREATE INDEX idx_post_views_viewer_id ON post_views(viewer_id);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_posts_status ON posts(status);

-- Function to increment post views
CREATE OR REPLACE FUNCTION increment_post_views(post_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts SET views = views + 1 WHERE id = post_uuid;
END;
$$;