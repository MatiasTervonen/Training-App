-- Reduce media-videos bucket limit from 100 MB to 50 MB
-- to match Supabase proxy upload limit
UPDATE storage.buckets SET file_size_limit = 52428800 WHERE id = 'media-videos'; -- 50 MB
