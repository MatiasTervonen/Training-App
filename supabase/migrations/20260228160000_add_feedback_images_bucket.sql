-- Create feedback-images storage bucket and policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-images',
  'feedback-images',
  false,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

CREATE POLICY "Users can upload own feedback images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'feedback-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own feedback images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'feedback-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own feedback images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'feedback-images' AND auth.uid()::text = (storage.foldername(name))[1]);
