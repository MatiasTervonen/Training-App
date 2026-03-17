-- Fix: use client-provided UUID (temp_id) for new tasks in todo_edit_todo
-- so that auto-save doesn't create duplicate tasks on each save cycle.

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
) RETURNS feed_items
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
  v_existing_images integer;
  v_existing_videos integer;
  v_existing_voice integer;
BEGIN
  -- Validate per-task media counts for existing tasks with new media
  FOR v_task IN SELECT * FROM jsonb_array_elements(p_tasks) WHERE value->>'id' IS NOT NULL
  LOOP
    v_task_id := (v_task->>'id')::uuid;

    SELECT count(*) INTO v_existing_images FROM todo_task_images WHERE task_id = v_task_id;
    SELECT count(*) INTO v_existing_videos FROM todo_task_videos WHERE task_id = v_task_id;
    SELECT count(*) INTO v_existing_voice FROM todo_task_voice WHERE task_id = v_task_id;

    IF (v_existing_images + COALESCE(jsonb_array_length(v_task->'new_images'), 0)) > 10 THEN
      RAISE EXCEPTION 'Maximum 10 images per task';
    END IF;
    IF (v_existing_videos + COALESCE(jsonb_array_length(v_task->'new_videos'), 0)) > 3 THEN
      RAISE EXCEPTION 'Maximum 3 videos per task';
    END IF;
    IF (v_existing_voice + COALESCE(jsonb_array_length(v_task->'new_voice'), 0)) > 5 THEN
      RAISE EXCEPTION 'Maximum 5 voice recordings per task';
    END IF;
  END LOOP;

  -- Validate per-task media counts for new tasks
  FOR v_task IN SELECT * FROM jsonb_array_elements(p_tasks) WHERE value->>'id' IS NULL
  LOOP
    IF v_task->'new_images' IS NOT NULL AND jsonb_array_length(v_task->'new_images') > 10 THEN
      RAISE EXCEPTION 'Maximum 10 images per task';
    END IF;
    IF v_task->'new_videos' IS NOT NULL AND jsonb_array_length(v_task->'new_videos') > 3 THEN
      RAISE EXCEPTION 'Maximum 3 videos per task';
    END IF;
    IF v_task->'new_voice' IS NOT NULL AND jsonb_array_length(v_task->'new_voice') > 5 THEN
      RAISE EXCEPTION 'Maximum 5 voice recordings per task';
    END IF;
  END LOOP;

  UPDATE todo_lists SET title = p_title, updated_at = p_updated_at WHERE id = p_id;

  UPDATE todo_tasks t
  SET task = src.task, notes = src.notes, position = src.position,
      updated_at = CASE
        WHEN t.task IS DISTINCT FROM src.task OR t.notes IS DISTINCT FROM src.notes
        THEN p_updated_at ELSE t.updated_at
      END
  FROM (
    SELECT (elem->>'id')::uuid AS id, (elem->>'task')::text AS task,
           (elem->>'notes')::text AS notes, (elem->>'position')::integer AS position
    FROM jsonb_array_elements(p_tasks) AS elem
    WHERE elem->>'id' IS NOT NULL
  ) src
  WHERE t.id = src.id AND t.list_id = p_id;

  FOR v_task IN SELECT * FROM jsonb_array_elements(p_tasks) WHERE value->>'id' IS NULL
  LOOP
    INSERT INTO todo_tasks (id, list_id, task, notes, position)
    VALUES (
      COALESCE((v_task->>'temp_id')::uuid, gen_random_uuid()),
      p_id, v_task->>'task', v_task->>'notes', (v_task->>'position')::integer
    )
    RETURNING id INTO v_task_id;

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

  DELETE FROM todo_tasks WHERE list_id = p_id AND id = ANY(p_deleted_ids);

  IF array_length(p_deleted_voice_ids, 1) > 0 THEN
    DELETE FROM todo_task_voice WHERE id = ANY(p_deleted_voice_ids);
  END IF;
  IF array_length(p_deleted_image_ids, 1) > 0 THEN
    DELETE FROM todo_task_images WHERE id = ANY(p_deleted_image_ids);
  END IF;
  IF array_length(p_deleted_video_ids, 1) > 0 THEN
    DELETE FROM todo_task_videos WHERE id = ANY(p_deleted_video_ids);
  END IF;

  SELECT count(*) INTO v_voice_count
  FROM todo_task_voice WHERE task_id IN (SELECT id FROM todo_tasks WHERE list_id = p_id);
  SELECT count(*) INTO v_image_count
  FROM todo_task_images WHERE task_id IN (SELECT id FROM todo_tasks WHERE list_id = p_id);
  SELECT count(*) INTO v_video_count
  FROM todo_task_videos WHERE task_id IN (SELECT id FROM todo_tasks WHERE list_id = p_id);
  SELECT count(*) INTO v_completed_count FROM todo_tasks WHERE list_id = p_id AND is_completed = true;
  SELECT count(*) INTO v_total_count FROM todo_tasks WHERE list_id = p_id;

  UPDATE feed_items
  SET title = p_title,
      extra_fields = jsonb_build_object(
        'completed', v_completed_count, 'total', v_total_count,
        'voice-count', v_voice_count, 'image-count', v_image_count, 'video-count', v_video_count
      ),
      updated_at = p_updated_at
  WHERE source_id = p_id AND type = 'todo_lists'
  RETURNING * INTO v_feed_item;

  RETURN v_feed_item;
END;
$$;
