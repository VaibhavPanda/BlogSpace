-- Add categories array column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS categories text[];

-- Update existing posts to populate categories array from category field
UPDATE posts SET categories = string_to_array(category, ',') WHERE categories IS NULL;