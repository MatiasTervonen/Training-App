-- 1. Create tutorial-images public storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tutorial-images',
  'tutorial-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Public read access (no auth needed)
CREATE POLICY "Anyone can read tutorial images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tutorial-images');

-- 2. Update handle_new_user() to insert tutorial feed item + pin
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  random_suffix text;
  generated_name text;
  max_retries int := 10;
  attempt int := 0;
  v_feed_id uuid;
begin
  loop
    attempt := attempt + 1;
    random_suffix := lpad(floor(random() * 10000000000)::bigint::text, 10, '0');
    generated_name := 'user_' || random_suffix;

    begin
      if new.email is null then
        insert into public.users (id, email, display_name, role)
        values (new.id, null, generated_name, 'guest');
      else
        insert into public.users (id, email, display_name, role)
        values (new.id, new.email, generated_name, 'user');
      end if;

      insert into public.user_settings(user_id)
      values (new.id);

      -- Insert tutorial feed item (self-referencing source_id)
      v_feed_id := gen_random_uuid();

      insert into public.feed_items (id, user_id, title, type, source_id, occurred_at)
      values (v_feed_id, new.id, 'Welcome to MyTrack!', 'tutorial', v_feed_id, now());

      insert into public.pinned_items (user_id, feed_item_id, type, pinned_context)
      values (new.id, v_feed_id, 'tutorial', 'main');

      return new;
    exception when unique_violation then
      if attempt >= max_retries then
        raise exception 'Could not generate unique username after % attempts', max_retries;
      end if;
    end;
  end loop;
end;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Update feed_delete_session to handle tutorial type
DROP FUNCTION IF EXISTS feed_delete_session(UUID, TEXT);

CREATE FUNCTION feed_delete_session(p_id UUID, p_type TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public
AS $$
BEGIN
  IF p_type NOT IN (
    'notes',
    'weight',
    'gym_sessions',
    'todo_lists',
    'global_reminders',
    'local_reminders',
    'activity_sessions',
    'habits',
    'reports',
    'tutorial'
  ) THEN
    RAISE EXCEPTION 'invalid feed type: %', p_type;
  END IF;

  -- Delete pinned items referencing this feed item
  DELETE FROM pinned_items
  WHERE feed_item_id IN (
    SELECT id FROM feed_items
    WHERE source_id = p_id AND type = p_type
  );

  -- Delete the feed item
  DELETE FROM feed_items
  WHERE source_id = p_id AND type = p_type;

  -- Delete domain row
  IF p_type IN ('habits', 'reports', 'tutorial') THEN
    -- Reports: delete the generated_report row
    IF p_type = 'reports' THEN
      DELETE FROM generated_reports WHERE id = p_id;
    END IF;
    -- Tutorial + habits: no domain table to delete
  ELSIF p_type IN ('gym_sessions', 'activity_sessions') THEN
    DELETE FROM sessions WHERE id = p_id;
  ELSE
    EXECUTE format('DELETE FROM %I WHERE id = $1', p_type) USING p_id;
  END IF;
END;
$$;
