-- Create storage bucket for shared food product images (from Open Food Facts)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('food-images', 'food-images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "food_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'food-images');

-- Allow public read (shared foods are public)
CREATE POLICY "food_images_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'food-images');

-- Add image_url column to custom_foods
ALTER TABLE custom_foods ADD COLUMN image_url TEXT;
