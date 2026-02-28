-- Create media-videos storage bucket and policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-videos',
  'media-videos',
  false,
  524288000, -- 500 MB
  ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg']
);

CREATE POLICY "Users can upload own media videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own media videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own media videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
