-- Add web audio MIME types (webm/ogg) to chat-media bucket
-- Web browsers record voice via MediaRecorder in webm/ogg format,
-- while mobile records in m4a. Without these, web voice uploads are rejected.
UPDATE storage.buckets
SET allowed_mime_types = array_cat(
  allowed_mime_types,
  ARRAY['audio/webm', 'audio/ogg']
)
WHERE id = 'chat-media';
