-- Fix Critical Issue #2: Add UPDATE policy for comments
-- This allows users to edit their own comments
CREATE POLICY "Users can update their own comments" ON comments
FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);