-- The content check constraint blocks soft-delete because it requires
-- content IS NOT NULL for text messages. Allow NULL content when deleted_at is set.

ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_content_check;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_content_check
  CHECK (
    deleted_at IS NOT NULL
    OR (message_type = 'text' AND content IS NOT NULL AND char_length(content) BETWEEN 1 AND 2000)
    OR (message_type IN ('image', 'video', 'voice') AND media_storage_path IS NOT NULL)
  );
