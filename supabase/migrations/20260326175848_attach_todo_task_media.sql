-- ============================================================
-- 1. Update todo_save_todo to return todo_id + task_ids
--    so the client can reliably map media to the correct task
-- ============================================================

DROP FUNCTION IF EXISTS todo_save_todo(text, jsonb);

CREATE FUNCTION todo_save_todo(
  p_title text,
  p_todo_list jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $$
DECLARE
  v_todo_id uuid;
  v_task_id uuid;
  v_task jsonb;
  v_position integer := 0;
  v_voice_count integer := 0;
  v_image_count integer := 0;
  v_video_count integer := 0;
  v_task_ids uuid[] := '{}';
BEGIN
  INSERT INTO todo_lists (title)
  VALUES (p_title)
  RETURNING id INTO v_todo_id;

  FOR v_task IN SELECT * FROM jsonb_array_elements(p_todo_list)
  LOOP
    INSERT INTO todo_tasks (list_id, task, notes, position)
    VALUES (
      v_todo_id,
      v_task->>'task',
      v_task->>'notes',
      v_position
    )
    RETURNING id INTO v_task_id;

    v_task_ids := v_task_ids || v_task_id;

    -- Insert voice recordings for this task
    IF v_task->'voice' IS NOT NULL AND jsonb_array_length(v_task->'voice') > 0 THEN
      INSERT INTO todo_task_voice (storage_path, task_id, duration_ms)
      SELECT r->>'storage_path', v_task_id, (r->>'duration_ms')::integer
      FROM jsonb_array_elements(v_task->'voice') AS r;

      v_voice_count := v_voice_count + jsonb_array_length(v_task->'voice');
    END IF;

    -- Insert images for this task
    IF v_task->'images' IS NOT NULL AND jsonb_array_length(v_task->'images') > 0 THEN
      INSERT INTO todo_task_images (storage_path, task_id)
      SELECT r->>'storage_path', v_task_id
      FROM jsonb_array_elements(v_task->'images') AS r;

      v_image_count := v_image_count + jsonb_array_length(v_task->'images');
    END IF;

    -- Insert videos for this task
    IF v_task->'videos' IS NOT NULL AND jsonb_array_length(v_task->'videos') > 0 THEN
      INSERT INTO todo_task_videos (storage_path, thumbnail_storage_path, task_id, duration_ms)
      SELECT r->>'storage_path', r->>'thumbnail_storage_path', v_task_id, (r->>'duration_ms')::integer
      FROM jsonb_array_elements(v_task->'videos') AS r;

      v_video_count := v_video_count + jsonb_array_length(v_task->'videos');
    END IF;

    v_position := v_position + 1;
  END LOOP;

  INSERT INTO feed_items (title, type, extra_fields, source_id, occurred_at)
  VALUES (
    p_title,
    'todo_lists',
    jsonb_build_object(
      'completed', 0,
      'total', jsonb_array_length(p_todo_list),
      'voice-count', v_voice_count,
      'image-count', v_image_count,
      'video-count', v_video_count
    ),
    v_todo_id,
    now()
  );

  RETURN jsonb_build_object(
    'todo_id', v_todo_id,
    'task_ids', to_jsonb(v_task_ids)
  );
END;
$$;

-- ============================================================
-- 2. Update todo_edit_todo to return real task IDs for new tasks
--    so the client can assign correct IDs and enqueue media
-- ============================================================

DROP FUNCTION IF EXISTS todo_edit_todo(uuid, text, jsonb, timestamptz, uuid[], uuid[], uuid[], uuid[]);

CREATE FUNCTION todo_edit_todo(
  p_id uuid,
  p_title text,
  p_tasks jsonb,
  p_updated_at timestamptz,
  p_deleted_ids uuid[] DEFAULT '{}',
  p_deleted_voice_ids uuid[] DEFAULT '{}',
  p_deleted_image_ids uuid[] DEFAULT '{}',
  p_deleted_video_ids uuid[] DEFAULT '{}'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $$
DECLARE
  v_feed_item feed_items;
  v_task jsonb;
  v_task_id uuid;
  v_voice_count integer;
  v_image_count integer;
  v_video_count integer;
  v_completed_count integer;
  v_total_count integer;
  v_new_task_ids jsonb := '{}'::jsonb;
BEGIN
  -- Update todo list title
  UPDATE todo_lists
  SET
    title = p_title,
    updated_at = p_updated_at
  WHERE id = p_id;

  -- Update existing tasks
  UPDATE todo_tasks t
  SET
    task = src.task,
    notes = src.notes,
    position = src.position,
    updated_at = CASE
      WHEN t.task IS DISTINCT FROM src.task
        OR t.notes IS DISTINCT FROM src.notes
      THEN p_updated_at
      ELSE t.updated_at
    END
  FROM (
    SELECT
      (elem->>'id')::uuid AS id,
      (elem->>'task')::text AS task,
      (elem->>'notes')::text AS notes,
      (elem->>'position')::integer AS position
    FROM jsonb_array_elements(p_tasks) AS elem
    WHERE elem->>'id' IS NOT NULL
  ) src
  WHERE t.id = src.id
    AND t.list_id = p_id;

  -- Insert new tasks and their media
  FOR v_task IN SELECT * FROM jsonb_array_elements(p_tasks) WHERE value->>'id' IS NULL
  LOOP
    INSERT INTO todo_tasks (list_id, task, notes, position)
    VALUES (
      p_id,
      v_task->>'task',
      v_task->>'notes',
      (v_task->>'position')::integer
    )
    RETURNING id INTO v_task_id;

    -- Record temp_id → real_id mapping
    IF v_task->>'temp_id' IS NOT NULL THEN
      v_new_task_ids := v_new_task_ids || jsonb_build_object(v_task->>'temp_id', v_task_id);
    END IF;

    -- Insert voice recordings for new task
    IF v_task->'new_voice' IS NOT NULL AND jsonb_array_length(v_task->'new_voice') > 0 THEN
      INSERT INTO todo_task_voice (storage_path, task_id, duration_ms)
      SELECT r->>'storage_path', v_task_id, (r->>'duration_ms')::integer
      FROM jsonb_array_elements(v_task->'new_voice') AS r;
    END IF;

    -- Insert images for new task
    IF v_task->'new_images' IS NOT NULL AND jsonb_array_length(v_task->'new_images') > 0 THEN
      INSERT INTO todo_task_images (storage_path, task_id)
      SELECT r->>'storage_path', v_task_id
      FROM jsonb_array_elements(v_task->'new_images') AS r;
    END IF;

    -- Insert videos for new task
    IF v_task->'new_videos' IS NOT NULL AND jsonb_array_length(v_task->'new_videos') > 0 THEN
      INSERT INTO todo_task_videos (storage_path, thumbnail_storage_path, task_id, duration_ms)
      SELECT r->>'storage_path', r->>'thumbnail_storage_path', v_task_id, (r->>'duration_ms')::integer
      FROM jsonb_array_elements(v_task->'new_videos') AS r;
    END IF;
  END LOOP;

  -- Insert new media for existing tasks
  FOR v_task IN SELECT * FROM jsonb_array_elements(p_tasks) WHERE value->>'id' IS NOT NULL
  LOOP
    v_task_id := (v_task->>'id')::uuid;

    IF v_task->'new_voice' IS NOT NULL AND jsonb_array_length(v_task->'new_voice') > 0 THEN
      INSERT INTO todo_task_voice (storage_path, task_id, duration_ms)
      SELECT r->>'storage_path', v_task_id, (r->>'duration_ms')::integer
      FROM jsonb_array_elements(v_task->'new_voice') AS r;
    END IF;

    IF v_task->'new_images' IS NOT NULL AND jsonb_array_length(v_task->'new_images') > 0 THEN
      INSERT INTO todo_task_images (storage_path, task_id)
      SELECT r->>'storage_path', v_task_id
      FROM jsonb_array_elements(v_task->'new_images') AS r;
    END IF;

    IF v_task->'new_videos' IS NOT NULL AND jsonb_array_length(v_task->'new_videos') > 0 THEN
      INSERT INTO todo_task_videos (storage_path, thumbnail_storage_path, task_id, duration_ms)
      SELECT r->>'storage_path', r->>'thumbnail_storage_path', v_task_id, (r->>'duration_ms')::integer
      FROM jsonb_array_elements(v_task->'new_videos') AS r;
    END IF;
  END LOOP;

  -- Delete todo tasks
  DELETE FROM todo_tasks
  WHERE list_id = p_id
    AND id = ANY(p_deleted_ids);

  -- Delete media by IDs
  IF array_length(p_deleted_voice_ids, 1) > 0 THEN
    DELETE FROM todo_task_voice WHERE id = ANY(p_deleted_voice_ids);
  END IF;

  IF array_length(p_deleted_image_ids, 1) > 0 THEN
    DELETE FROM todo_task_images WHERE id = ANY(p_deleted_image_ids);
  END IF;

  IF array_length(p_deleted_video_ids, 1) > 0 THEN
    DELETE FROM todo_task_videos WHERE id = ANY(p_deleted_video_ids);
  END IF;

  -- Recalculate media counts
  SELECT count(*) INTO v_voice_count
  FROM todo_task_voice WHERE task_id IN (SELECT id FROM todo_tasks WHERE list_id = p_id);

  SELECT count(*) INTO v_image_count
  FROM todo_task_images WHERE task_id IN (SELECT id FROM todo_tasks WHERE list_id = p_id);

  SELECT count(*) INTO v_video_count
  FROM todo_task_videos WHERE task_id IN (SELECT id FROM todo_tasks WHERE list_id = p_id);

  SELECT count(*) INTO v_completed_count
  FROM todo_tasks WHERE list_id = p_id AND is_completed = true;

  SELECT count(*) INTO v_total_count
  FROM todo_tasks WHERE list_id = p_id;

  -- Update feed item
  UPDATE feed_items
  SET
    title = p_title,
    extra_fields = jsonb_build_object(
      'completed', v_completed_count,
      'total', v_total_count,
      'voice-count', v_voice_count,
      'image-count', v_image_count,
      'video-count', v_video_count
    ),
    updated_at = p_updated_at
  WHERE source_id = p_id
    AND type = 'todo_lists'
  RETURNING * INTO v_feed_item;

  RETURN jsonb_build_object(
    'feed_item', row_to_json(v_feed_item),
    'new_task_ids', v_new_task_ids
  );
END;
$$;

-- ============================================================
-- 3. Attach media to an existing todo task (background upload)
-- ============================================================

DROP FUNCTION IF EXISTS attach_todo_task_media(uuid, jsonb, jsonb, jsonb);

CREATE FUNCTION attach_todo_task_media(
  p_task_id uuid,
  p_images jsonb DEFAULT '[]'::jsonb,
  p_videos jsonb DEFAULT '[]'::jsonb,
  p_recordings jsonb DEFAULT '[]'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner_id uuid;
  v_list_id uuid;
  v_current_images integer;
  v_current_videos integer;
  v_current_voice integer;
  v_total_images integer;
  v_total_videos integer;
  v_total_voice integer;
BEGIN
  -- Verify ownership via the parent task
  SELECT tt.user_id, tt.list_id
    INTO v_owner_id, v_list_id
    FROM todo_tasks tt
   WHERE tt.id = p_task_id;

  IF v_owner_id IS NULL OR v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Todo task not found or unauthorized';
  END IF;

  -- Get current counts for this task
  SELECT count(*) INTO v_current_images FROM todo_task_images WHERE task_id = p_task_id;
  SELECT count(*) INTO v_current_videos FROM todo_task_videos WHERE task_id = p_task_id;
  SELECT count(*) INTO v_current_voice FROM todo_task_voice  WHERE task_id = p_task_id;

  -- Validate limits per task
  IF v_current_images + jsonb_array_length(COALESCE(p_images, '[]'::jsonb)) > 10 THEN
    RAISE EXCEPTION 'Maximum 10 images per task';
  END IF;
  IF v_current_videos + jsonb_array_length(COALESCE(p_videos, '[]'::jsonb)) > 3 THEN
    RAISE EXCEPTION 'Maximum 3 videos per task';
  END IF;
  IF v_current_voice + jsonb_array_length(COALESCE(p_recordings, '[]'::jsonb)) > 5 THEN
    RAISE EXCEPTION 'Maximum 5 voice recordings per task';
  END IF;

  -- Insert recordings
  IF jsonb_array_length(COALESCE(p_recordings, '[]'::jsonb)) > 0 THEN
    INSERT INTO todo_task_voice (storage_path, task_id, duration_ms)
    SELECT r->>'storage_path', p_task_id, (r->>'duration_ms')::integer
    FROM jsonb_array_elements(p_recordings) AS r;
  END IF;

  -- Insert images
  IF jsonb_array_length(COALESCE(p_images, '[]'::jsonb)) > 0 THEN
    INSERT INTO todo_task_images (storage_path, task_id)
    SELECT r->>'storage_path', p_task_id
    FROM jsonb_array_elements(p_images) AS r;
  END IF;

  -- Insert videos
  IF jsonb_array_length(COALESCE(p_videos, '[]'::jsonb)) > 0 THEN
    INSERT INTO todo_task_videos (storage_path, thumbnail_storage_path, task_id, duration_ms)
    SELECT r->>'storage_path', r->>'thumbnail_storage_path', p_task_id, (r->>'duration_ms')::integer
    FROM jsonb_array_elements(p_videos) AS r;
  END IF;

  -- Recount across all tasks in this todo list and update feed_items
  SELECT count(*) INTO v_total_images
    FROM todo_task_images WHERE task_id IN (SELECT id FROM todo_tasks WHERE list_id = v_list_id);
  SELECT count(*) INTO v_total_videos
    FROM todo_task_videos WHERE task_id IN (SELECT id FROM todo_tasks WHERE list_id = v_list_id);
  SELECT count(*) INTO v_total_voice
    FROM todo_task_voice  WHERE task_id IN (SELECT id FROM todo_tasks WHERE list_id = v_list_id);

  UPDATE feed_items
  SET extra_fields = extra_fields
    || jsonb_build_object(
      'image-count', v_total_images,
      'video-count', v_total_videos,
      'voice-count', v_total_voice
    )
  WHERE source_id = v_list_id AND type = 'todo_lists';
END;
$$;
