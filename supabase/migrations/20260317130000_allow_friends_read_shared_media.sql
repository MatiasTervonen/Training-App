-- Allow friends to read media files that belong to sessions shared via the social feed.
-- Only files attached to sessions with a feed_item that has visibility = 'friends' are accessible.
-- Private (unshared) files remain inaccessible.
--
-- Uses a SECURITY DEFINER helper function because the storage policy runs as the
-- authenticated user, and the tables it needs to join (session_images, feed_items,
-- friends) have their own owner-only RLS that would block the lookup.

-- ============================================================
-- Helper function: checks if the current user can read a friend's shared media file
-- ============================================================

DROP FUNCTION IF EXISTS storage_friend_can_read(text, text);
CREATE FUNCTION storage_friend_can_read(p_bucket text, p_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_bucket = 'notes-images' THEN
    RETURN EXISTS (
      SELECT 1
      FROM session_images si
      JOIN feed_items fi ON fi.source_id = si.session_id
        AND fi.type IN ('gym_sessions', 'activity_sessions')
        AND fi.visibility = 'friends'
      JOIN friends f ON (f.user1_id = auth.uid() AND f.user2_id = fi.user_id)
                     OR (f.user1_id = fi.user_id AND f.user2_id = auth.uid())
      WHERE si.storage_path = p_path
    );
  END IF;

  IF p_bucket = 'media-videos' THEN
    RETURN EXISTS (
      SELECT 1
      FROM session_videos sv
      JOIN feed_items fi ON fi.source_id = sv.session_id
        AND fi.type IN ('gym_sessions', 'activity_sessions')
        AND fi.visibility = 'friends'
      JOIN friends f ON (f.user1_id = auth.uid() AND f.user2_id = fi.user_id)
                     OR (f.user1_id = fi.user_id AND f.user2_id = auth.uid())
      WHERE sv.storage_path = p_path
         OR sv.thumbnail_storage_path = p_path
    );
  END IF;

  IF p_bucket = 'notes-voice' THEN
    RETURN EXISTS (
      SELECT 1
      FROM sessions_voice sv
      JOIN feed_items fi ON fi.source_id = sv.session_id
        AND fi.type IN ('gym_sessions', 'activity_sessions')
        AND fi.visibility = 'friends'
      JOIN friends f ON (f.user1_id = auth.uid() AND f.user2_id = fi.user_id)
                     OR (f.user1_id = fi.user_id AND f.user2_id = auth.uid())
      WHERE sv.storage_path = p_path
    );
  END IF;

  RETURN false;
END;
$$;

-- ============================================================
-- Storage policies using the helper function
-- ============================================================

CREATE POLICY "Friends can read shared session images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'notes-images'
    AND storage_friend_can_read(bucket_id, name)
  );

CREATE POLICY "Friends can read shared session videos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'media-videos'
    AND storage_friend_can_read(bucket_id, name)
  );

CREATE POLICY "Friends can read shared session voice recordings"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'notes-voice'
    AND storage_friend_can_read(bucket_id, name)
  );
