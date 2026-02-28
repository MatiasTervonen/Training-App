-- Add full media support to weight tracking

-- ============================================================
-- 1. Create weight_images table
-- ============================================================

CREATE TABLE weight_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  weight_id UUID NOT NULL REFERENCES weight(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE weight_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weight images"
  ON weight_images FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight images"
  ON weight_images FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight images"
  ON weight_images FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 2. Create weight_videos table
-- ============================================================

CREATE TABLE weight_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  weight_id UUID NOT NULL REFERENCES weight(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumbnail_storage_path TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE weight_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weight videos"
  ON weight_videos FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight videos"
  ON weight_videos FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight videos"
  ON weight_videos FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 3. Create weight_voice table
-- ============================================================

CREATE TABLE weight_voice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  weight_id UUID NOT NULL REFERENCES weight(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE weight_voice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weight voice"
  ON weight_voice FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight voice"
  ON weight_voice FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight voice"
  ON weight_voice FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 4. Update weight_save_weight — add media parameters
-- ============================================================

DROP FUNCTION IF EXISTS weight_save_weight(text, text, numeric);

CREATE FUNCTION weight_save_weight(
  p_title text,
  p_notes text,
  p_weight numeric,
  p_images jsonb DEFAULT '[]'::jsonb,
  p_videos jsonb DEFAULT '[]'::jsonb,
  p_recordings jsonb DEFAULT '[]'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  v_weight_id uuid;
BEGIN

  INSERT INTO weight (title, notes, weight)
  VALUES (p_title, p_notes, p_weight)
  RETURNING id INTO v_weight_id;

  INSERT INTO weight_voice (storage_path, weight_id, duration_ms)
  SELECT r->>'storage_path', v_weight_id, (r->>'duration_ms')::integer
  FROM jsonb_array_elements(p_recordings) AS r;

  INSERT INTO weight_images (storage_path, weight_id)
  SELECT r->>'storage_path', v_weight_id
  FROM jsonb_array_elements(p_images) AS r;

  INSERT INTO weight_videos (storage_path, thumbnail_storage_path, weight_id, duration_ms)
  SELECT r->>'storage_path', r->>'thumbnail_storage_path', v_weight_id, (r->>'duration_ms')::integer
  FROM jsonb_array_elements(p_videos) AS r;

  INSERT INTO feed_items (title, type, extra_fields, source_id, occurred_at)
  VALUES (
    p_title,
    'weight',
    jsonb_build_object(
      'notes', p_notes,
      'weight', p_weight,
      'image-count', jsonb_array_length(p_images),
      'video-count', jsonb_array_length(p_videos),
      'voice-count', jsonb_array_length(p_recordings)
    ),
    v_weight_id,
    now()
  );

  RETURN v_weight_id;
END;
$$;
