

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."activities_compute_session_stats"("p_session_id" "uuid", "p_steps" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
    v_distance numeric := 0;
    v_moving_time_seconds numeric := 0;
    v_duration_seconds numeric;        
    v_base_met numeric;                
    v_user_weight_kg numeric;          
    v_calories numeric;
begin

   with ordered_points as (
        select
        recorded_at,
        latitude,
        longitude,
            lag(latitude) over w as prev_latitude,
            lag(longitude) over w as prev_longitude,
            lag(recorded_at) over w as prev_time,
            is_stationary
        from activity_gps_points
        where session_id = p_session_id
        window w as (order by recorded_at)
    ),
    deltas as (
        select
        extract(epoch from (recorded_at - prev_time)) as delta_time,
        6371000 * 2 * asin(
            sqrt(
                power(sin(radians(latitude - prev_latitude) / 2), 2) +
                cos(radians(latitude)) * cos(radians(prev_latitude)) *
                power(sin(radians(longitude - prev_longitude) / 2), 2)
            )
        ) as delta_distance,
        is_stationary
        from ordered_points
        where prev_time is not null
    ),
    moving_segments as (
        select
            delta_time,
            delta_distance
        from deltas
        where delta_time > 0
        and is_stationary = false
        )
        select 
            coalesce(sum(delta_distance), 0),
            coalesce(sum(delta_time), 0)
        into 
            v_distance, 
            v_moving_time_seconds
        from moving_segments;


        -- Calculate calories here if needed
        select 
            s.duration,
            a.base_met,
            coalesce(
            (select weight
            from weight
            where user_id = s.user_id
            order by created_at desc
            limit 1), 70    
            )
        into 
            v_duration_seconds,
            v_base_met,
            v_user_weight_kg
        from sessions s 
        join activities a on s.activity_id = a.id
        where s.id = p_session_id;       

        if v_moving_time_seconds > 0 then
            -- GPS tracked: use moving time (more accurate)
            v_calories := v_base_met * v_user_weight_kg * (v_moving_time_seconds / 3600);
        else
            -- No GPS: use total session duration
            v_calories := v_base_met * v_user_weight_kg * (v_duration_seconds / 3600);
        end if;


        insert into session_stats (
            session_id,
            distance_meters,
            moving_time_seconds,
            avg_pace,
            avg_speed,
            steps,
            calories,
            computed_at
        )
        values (
            p_session_id,
            v_distance,
            v_moving_time_seconds,
            case
                when v_distance > 0
                then v_moving_time_seconds / (v_distance / 1000)
                else null
            end,
            case
                when v_moving_time_seconds > 0
                then (v_distance / 1000) / (v_moving_time_seconds / 3600)
                else null
            end,
            p_steps,
            v_calories,
            now()
        )
        on conflict (session_id) do update
        set
            distance_meters = excluded.distance_meters,
            moving_time_seconds = excluded.moving_time_seconds,
            avg_pace = excluded.avg_pace,
            avg_speed = excluded.avg_speed,
            steps = excluded.steps,
            calories = excluded.calories,
            computed_at = excluded.computed_at;
end;
$$;


ALTER FUNCTION "public"."activities_compute_session_stats"("p_session_id" "uuid", "p_steps" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."activities_get_full_session"("p_session_id" "uuid") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$

    select jsonb_build_object(
        'session',
        to_jsonb(s) - 'geom',


        'route',
        case 
            when s.geom is not null 
            then ST_AsGeoJSON(s.geom)::jsonb
            else null
        end,

        'activity',
        to_jsonb(a),

        'stats',
        to_jsonb(st)     
    )
    from sessions s
    left join activities a on s.activity_id = a.id
    left join session_stats st on s.id = st.session_id
    where s.id = p_session_id
    group by s.id, a.id, st.id;
    $$;


ALTER FUNCTION "public"."activities_get_full_session"("p_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."activities_get_templates"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
    select coalesce(
     jsonb_agg(
        jsonb_build_object(
        'template',
        to_jsonb(t) - 'geom',

        'activity',
        jsonb_build_object(
        'id', a.id,
        'name', a.name,
        'slug', a.slug
        ),

        'route',
        case 
            when t.geom is not null 
            then ST_AsGeoJSON(t.geom)::jsonb
            else null
        end
        )
        order by t.created_at desc
    ),
     '[]'::jsonb
     )
   from activity_templates t 
   join activities a on t.activity_id = a.id
   where t.user_id = auth.uid();
$$;


ALTER FUNCTION "public"."activities_get_templates"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."activities_save_activity"("p_title" "text", "p_notes" "text", "p_duration" integer, "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_track" "jsonb", "p_activity_id" "uuid", "p_steps" integer, "p_draftrecordings" "jsonb" DEFAULT '[]'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
    v_activity_id uuid;
    v_activity_name text;
    v_activity_slug text;
    v_track jsonb;
    v_position integer;
    v_distance numeric;
begin 


  insert into sessions (
    title,
    notes,
    duration,
    start_time,
    end_time,
    activity_id
  )  
  values (
    p_title,
    p_notes,
    p_duration,
    p_start_time,
    p_end_time,
    p_activity_id
  )
  returning id into v_activity_id;

  insert into sessions_voice (
  storage_path,
  session_id,
  duration_ms
)
select
  r->>'storage_path',
  v_activity_id,
  (r->>'duration_ms')::integer
from jsonb_array_elements(p_draftRecordings) as r;

if p_track is not null then
for v_track, v_position in 
  select elem, ordinality - 1 
from jsonb_array_elements(p_track) with ordinality as t(elem, ordinality)
loop


  insert into activity_gps_points (
    session_id,
    recorded_at,
    latitude,
    longitude,
    accuracy,
    altitude,
    is_stationary,
    bad_signal
  )
  values (
    v_activity_id,
    (v_track->> 'timestamp')::timestamptz,
    (v_track->> 'latitude')::numeric,
    (v_track->> 'longitude')::numeric,
    (v_track->> 'accuracy')::numeric,
    (v_track->> 'altitude')::numeric,
    coalesce((v_track->> 'is_stationary')::boolean, false),
    coalesce((v_track->> 'bad_signal')::boolean, false)
  );

end loop;
end if;

if p_track is not null then
  update sessions s
  set geom = (
    with points_with_gaps as (
      -- Use ALL points (including stationary/bad_signal) for gap detection
      select
        p.longitude,
        p.latitude,
        p.recorded_at,
        p.is_stationary,
        p.bad_signal,
        case
          when extract(epoch from (p.recorded_at - lag(p.recorded_at) over (order by p.recorded_at))) > 60
          then 1
          else 0
        end as is_gap
      from activity_gps_points p
      where p.session_id = v_activity_id
    ),
    points_with_segments as (
      select
        longitude,
        latitude,
        recorded_at,
        is_stationary,
        bad_signal,
        sum(is_gap) over (order by recorded_at) as segment_id
      from points_with_gaps
    ),
    segment_lines as (
      -- Only include MOVING + GOOD SIGNAL points in the geometry
      select
        segment_id,
        ST_MakeLine(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
          order by recorded_at
        ) as line
      from points_with_segments
      where not is_stationary and not bad_signal
      group by segment_id
      having count(*) >= 2
    )
    select
      case
        when count(*) = 1 then (array_agg(line))[1]::geography
        else ST_Collect(line order by segment_id)::geography
      end
    from segment_lines
  )
  where s.id = v_activity_id;
end if;

perform activities_compute_session_stats(v_activity_id, p_steps);

if p_track is not null then
  select distance_meters into v_distance
  from session_stats
  where session_id = v_activity_id;
end if;

select name, slug
into v_activity_name, v_activity_slug
from activities
where id = p_activity_id;

insert into feed_items (
  title,
  type,
  extra_fields,
  source_id,
  occurred_at
)
values (
  p_title,
  'activity_sessions',
  jsonb_build_object('duration', p_duration, 'start_time', p_start_time, 'end_time', p_end_time, 'distance', v_distance, 'activity_name', v_activity_name, 'activity_slug', v_activity_slug, 'voice_count', jsonb_array_length(p_draftRecordings)),
  v_activity_id,
  p_start_time
);


return v_activity_id;
end;
$$;


ALTER FUNCTION "public"."activities_save_activity"("p_title" "text", "p_notes" "text", "p_duration" integer, "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_track" "jsonb", "p_activity_id" "uuid", "p_steps" integer, "p_draftrecordings" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."activities_save_template"("p_name" "text", "p_notes" "text", "p_session_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
    v_template_id uuid;
begin
    insert into activity_templates (
        user_id,
        activity_id,
        name,  
        notes,
        geom,
        distance_meters
    )
    select 
        s.user_id,
        s.activity_id,
        p_name,
        p_notes,
        s.geom,
        st.distance_meters
    from sessions s
    join session_stats st on st.session_id = s.id
    where s.id = p_session_id
      and s.user_id = auth.uid()
      and s.geom is not null
      returning id
    into v_template_id;

      if v_template_id is null then
    raise exception 'Session not found or not owned by user';
  end if;


update sessions s
set template_id = v_template_id
where s.id = p_session_id
 and s.user_id = auth.uid();

    return v_template_id;
end;
$$;


ALTER FUNCTION "public"."activities_save_template"("p_name" "text", "p_notes" "text", "p_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."activities_set_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug :=
      lower(
        regexp_replace(
          NEW.name,
          '[^a-zA-Z0-9]+',
          '_',
          'g'
        )
      );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."activities_set_slug"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."feed_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "title" "text" NOT NULL,
    "type" "text" NOT NULL,
    "extra_fields" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "source_id" "uuid" NOT NULL,
    "occurred_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "activity_at" timestamp with time zone GENERATED ALWAYS AS (GREATEST("updated_at", "occurred_at")) STORED,
    CONSTRAINT "title_length" CHECK (("char_length"("title") <= 5000))
);


ALTER TABLE "public"."feed_items" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."activity_edit_session"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_activity_id" "uuid", "p_updated_at" timestamp with time zone) RETURNS "public"."feed_items"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
 v_feed_item feed_items;
 v_activity_name text;
 v_activity_slug text;
begin


update sessions
set
  title = p_title,
  notes = p_notes,
  activity_id = p_activity_id,
  updated_at = p_updated_at
where id = p_id;

select name, slug
into v_activity_name, v_activity_slug
from activities
where id = p_activity_id;


update feed_items
set
  title = p_title,
  extra_fields = extra_fields || jsonb_build_object('notes', p_notes, 'activity_name', v_activity_name, 'activity_slug', v_activity_slug)
where source_id = p_id
 and type = 'activity_sessions'
 returning * into v_feed_item; 

return v_feed_item;
end;
$$;


ALTER FUNCTION "public"."activity_edit_session"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_activity_id" "uuid", "p_updated_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_user_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$begin
update public.analytics_counts
set count = count - 1,
updated_at = now()
where id = 'users';
return old;
end;$$;


ALTER FUNCTION "public"."decrement_user_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."feed_delete_session"("p_id" "uuid", "p_type" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $_$
begin

if p_type not in (
    'notes',
    'weight',
    'gym_sessions',
    'todo_lists',
    'global_reminders',
    'local_reminders',
    'activity_sessions'
) then 
 raise exception 'invalid feed type: %', p_type;
 end if;

delete from pinned_items 
 where feed_item_id in (
    select id 
    from feed_items
    where source_id = p_id
    and type = p_type
 );

 delete from feed_items 
 where source_id = p_id
 and type = p_type;

 -- Delete domain row
if p_type in ('gym_sessions', 'activity_sessions') then
  delete from sessions
  where id = p_id;

else
   -- 4. Delete domain row (dynamic table)
  execute format(
    'delete from %I where id = $1',
    p_type
  )
  using p_id;
end if;


end;
$_$;


ALTER FUNCTION "public"."feed_delete_session"("p_id" "uuid", "p_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_feed_sorted"("p_limit" integer, "p_offset" integer) RETURNS TABLE("id" "uuid", "title" "text", "type" "text", "extra_fields" "jsonb", "source_id" "uuid", "occurred_at" timestamp with time zone, "updated_at" timestamp with time zone, "activity_at" timestamp with time zone, "created_at" timestamp with time zone, "user_id" "uuid")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  -- Bump overdue reminders by setting occurred_at to notify_at (one-time)
  -- This automatically updates activity_at via the generated column
  update feed_items
  set occurred_at = (feed_items.extra_fields->>'notify_at')::timestamptz
  where feed_items.type in ('global_reminders', 'local_reminders')
    and (feed_items.extra_fields->>'notify_at')::timestamptz <= now()
    and feed_items.occurred_at < (feed_items.extra_fields->>'notify_at')::timestamptz;

  -- Return feed sorted by activity_at (no special sorting needed)
  return query
  select
    f.id,
    f.title,
    f.type,
    f.extra_fields,
    f.source_id,
    f.occurred_at,
    f.updated_at,
    f.activity_at,
    f.created_at,
    f.user_id
  from feed_items f
  order by f.activity_at desc
  limit p_limit
  offset p_offset;
end;
$$;


ALTER FUNCTION "public"."get_feed_sorted"("p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_jwt"() RETURNS "json"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  select auth.jwt();
$$;


ALTER FUNCTION "public"."get_jwt"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."gym_edit_session"("p_exercises" "jsonb", "p_notes" "text", "p_duration" integer, "p_title" "text", "p_id" "uuid", "p_updated_at" timestamp with time zone) RETURNS "public"."feed_items"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
 v_session_id uuid;
 v_session_exercise_id uuid;
 v_exercise jsonb;
 v_sets jsonb;
 v_position integer;
 v_set_number integer;
 v_feed_item feed_items;
begin


update sessions 
set 
  title = p_title,
  notes = p_notes,
  duration = p_duration,
  updated_at = p_updated_at
where id = p_id
returning id into v_session_id;

if not found then
  raise exception 'Session not found';
end if;


delete from gym_sets 
 where session_exercise_id in (
  select id
  from gym_session_exercises
  where session_id = v_session_id
 );

 -- delete from gym session exercises

delete from gym_session_exercises 
 where session_id = v_session_id;


for v_exercise, v_position in 
  select elem, ordinality - 1 
  from jsonb_array_elements(p_exercises) with ordinality as t(elem, ordinality)
loop

insert into gym_session_exercises (
  session_id,
  exercise_id,
  position,
  superset_id,
  notes
)
values (
  v_session_id,
  (v_exercise->> 'exercise_id')::uuid,
  v_position,
  nullif(v_exercise->> 'superset_id', '')::uuid,
  v_exercise->> 'notes'
)
returning id into v_session_exercise_id;



for v_sets, v_set_number in 
  select elem, ordinality - 1 
  from jsonb_array_elements(coalesce(v_exercise->'sets', '[]'::jsonb)) with ordinality as t(elem, ordinality)
loop

insert into gym_sets (
  session_exercise_id,
  weight,
  reps,
  rpe,
  set_number,
  time_min,
  distance_meters
)
values (
  v_session_exercise_id,
  (v_sets->> 'weight')::numeric,
  (v_sets->> 'reps')::integer,
  (v_sets->> 'rpe')::text,
  v_set_number,
  (v_sets->> 'time_min')::numeric,
  (v_sets->> 'distance_meters')::numeric
);

 end loop;

end loop;



update feed_items
set
  title = p_title,
  extra_fields = jsonb_build_object('duration', p_duration,'exercises_count', jsonb_array_length(p_exercises), 'sets_count', (select coalesce(sum(jsonb_array_length(e->'sets')), 0)
  from jsonb_array_elements(p_exercises) as t(e)))
where source_id = p_id
 and type = 'gym_sessions'
 returning * into v_feed_item;


return v_feed_item;
end;
$$;


ALTER FUNCTION "public"."gym_edit_session"("p_exercises" "jsonb", "p_notes" "text", "p_duration" integer, "p_title" "text", "p_id" "uuid", "p_updated_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."gym_edit_template"("p_id" "uuid", "p_exercises" "jsonb", "p_name" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
 v_template_id uuid;
 v_exercise jsonb;
 v_position integer;
begin


update gym_templates 
set 
  name = p_name,
  updated_at = now()
where id = p_id
returning id into v_template_id;

if not found then
  raise exception 'Template not found';
end if;

 -- delete from gym template exercises

delete from gym_template_exercises 
 where template_id = v_template_id;


for v_exercise, v_position in 
  select elem, ordinality - 1 
  from jsonb_array_elements(p_exercises) with ordinality as t(elem, ordinality)
loop

insert into gym_template_exercises (
  template_id,
  exercise_id,
  position,
  superset_id
)
values (
  v_template_id,
  (v_exercise->> 'exercise_id')::uuid,
  v_position,
  nullif(v_exercise->> 'superset_id', '')::uuid
);

end loop;


return v_template_id;
end;
$$;


ALTER FUNCTION "public"."gym_edit_template"("p_id" "uuid", "p_exercises" "jsonb", "p_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."gym_latest_history_per_exercise"("exercise_ids" "uuid"[]) RETURNS TABLE("exercise_id" "uuid", "created_at" timestamp with time zone, "main_group" "text", "name" "text", "equipment" "text", "sets" "jsonb")
    LANGUAGE "sql"
    AS $$
  select distinct on (se.exercise_id)
    se.exercise_id,
    s.created_at,
    e.main_group,
    e.name,
    e.equipment,
    jsonb_agg(
      jsonb_build_object(
        'set_number', gs.set_number,
        'weight', gs.weight,
        'reps', gs.reps,
        'rpe', gs.rpe,
        'time_min', gs.time_min,
        'distance_meters', gs.distance_meters
      )
      order by gs.set_number
    ) as sets
  from gym_session_exercises se
  join sessions s on s.id = se.session_id
  join gym_exercises e on e.id = se.exercise_id
  left join gym_sets gs on gs.session_exercise_id = se.id
  where se.exercise_id = any(exercise_ids)
    and s.user_id = auth.uid()
  group by
    se.exercise_id,
    s.created_at,
    e.main_group,
    e.name,
    e.equipment
  order by
    se.exercise_id,
    s.created_at desc;
$$;


ALTER FUNCTION "public"."gym_latest_history_per_exercise"("exercise_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."gym_save_session"("p_exercises" "jsonb", "p_notes" "text", "p_duration" integer, "p_title" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone) RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
 v_session_id uuid;
 v_session_exercise_id uuid;
 v_exercise jsonb;
 v_sets jsonb;
 v_position integer;
 v_set_number integer;
begin



insert into sessions (
  title,
  notes,
  duration,
  start_time,
  end_time,
  activity_id
)
values (
  p_title,
  p_notes,
  p_duration,
  p_start_time,
  p_end_time,
  (select id from activities where slug = 'gym')
)
returning id into v_session_id;


for v_exercise, v_position in 
  select elem, ordinality - 1 
  from jsonb_array_elements(p_exercises) with ordinality as t(elem, ordinality)
loop

insert into gym_session_exercises (
  session_id,
  exercise_id,
  position,
  superset_id,
  notes
)
values (
  v_session_id,
  (v_exercise->> 'exercise_id')::uuid,
  v_position,
  nullif(v_exercise->> 'superset_id', '')::uuid,
  v_exercise->> 'notes'
)
returning id into v_session_exercise_id;



for v_sets, v_set_number in 
  select elem, ordinality - 1 
  from jsonb_array_elements(coalesce(v_exercise->'sets', '[]'::jsonb)) with ordinality as t(elem, ordinality)
loop

insert into gym_sets (
  session_exercise_id,
  weight,
  reps,
  rpe,
  set_number,
  time_min,
  distance_meters
)
values (
  v_session_exercise_id,
  (v_sets->> 'weight')::numeric,
  (v_sets->> 'reps')::integer,
  (v_sets->> 'rpe')::text,
  v_set_number,
  (v_sets->> 'time_min')::numeric,
  (v_sets->> 'distance_meters')::numeric
);

 end loop;

end loop;

perform activities_compute_session_stats(v_session_id, null);



insert into feed_items (
  title,
  type,
  extra_fields,
  source_id,
  occurred_at
)
values (
  p_title,
  'gym_sessions',
  jsonb_build_object('start_time', p_start_time, 'end_time', p_end_time, 'duration', p_duration,'exercises_count', jsonb_array_length(p_exercises), 'sets_count', (select coalesce(sum(jsonb_array_length(e->'sets')), 0)
  from jsonb_array_elements(p_exercises) as t(e))),
  v_session_id,
  p_start_time
);


return v_session_id;
end;
$$;


ALTER FUNCTION "public"."gym_save_session"("p_exercises" "jsonb", "p_notes" "text", "p_duration" integer, "p_title" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."gym_save_template"("p_exercises" "jsonb", "p_name" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
 v_template_id uuid;
begin


insert into gym_templates (
  name
)
values (
  p_name
)
returning id into v_template_id;


insert into gym_template_exercises (
  template_id,
  exercise_id,
  position,
  superset_id
)
select
  v_template_id,
  (elem->> 'exercise_id')::uuid as exercise_id,
  ordinality - 1 as position,
  (elem->> 'superset_id')::uuid as superset_id
from jsonb_array_elements(p_exercises) with ordinality as t(elem, ordinality);

return v_template_id;
end;
$$;


ALTER FUNCTION "public"."gym_save_template"("p_exercises" "jsonb", "p_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$declare
  random_number int;
  display_name text;
  email_prefix text;
begin

random_number := (floor(random() * 900000) + 100000)::int;

if new.email is null then
  display_name := 'guest_' || random_number;

  insert into public.users (id, email, display_name, role)
  values
  (new.id, null, display_name, 'guest');
 else 
 
  email_prefix := split_part(new.email, '@', 1);
  display_name := email_prefix || '_' || random_number;

  insert into public.users (id, email, display_name, role)
  values
  (new.id, new.email, display_name, 'user');

  end if;

  insert into public.user_settings(user_id)
  values
  (new.id);
  
  return new;
end;$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_user_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$begin
update public.analytics_counts
set count = count + 1,
updated_at = now()
where id = 'users';
return new;
end;$$;


ALTER FUNCTION "public"."increment_user_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."last_30d_analytics"() RETURNS "jsonb"
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    AS $$
  with all_muscle_groups as (
    select unnest(array[
      'abs', 'biceps', 'calves', 'chest', 'forearms', 'front_delts',
      'glutes', 'hamstrings', 'lats', 'lower_back', 'obliques',
      'quads', 'rear_delts', 'side_delts', 'traps', 'triceps', 'upper_back'
    ]) as muscle_group
  ),
  user_sessions as (
    select id
    from sessions
    where user_id = auth.uid()
      and activity_id = '3de3db15-6b0a-4338-a276-396782c12c63'
      and created_at > now() - interval '30 days'
  ),
  exercise_counts as (
    select
      ge.muscle_group,
      count(*) as group_count
    from gym_session_exercises gse
    join gym_exercises ge on ge.id = gse.exercise_id
    where gse.session_id in (select id from user_sessions)
    group by ge.muscle_group
  ),
  set_counts as (
    select
      ge.muscle_group,
      count(*) as group_count
    from gym_session_exercises gse
    join gym_exercises ge on ge.id = gse.exercise_id
    join gym_sets gs on gs.session_exercise_id = gse.id
    where gse.session_id in (select id from user_sessions)
    group by ge.muscle_group
  )
  select jsonb_build_object(
    'total_sessions', count(*),
    'avg_duration', coalesce(avg(duration), 0),
    'muscle_groups', (
      select jsonb_agg(
        jsonb_build_object(
          'group', amg.muscle_group,
          'count', coalesce(ec.group_count, 0)
        )
      )
      from all_muscle_groups amg
      left join exercise_counts ec on ec.muscle_group = amg.muscle_group
    ),
    'sets_per_muscle_group', (
      select jsonb_agg(
        jsonb_build_object(
          'group', amg.muscle_group,
          'count', coalesce(sc.group_count, 0)
        )
      )
      from all_muscle_groups amg
      left join set_counts sc on sc.muscle_group = amg.muscle_group
    )
  )
  from sessions
  where user_id = auth.uid()
    and activity_id = '3de3db15-6b0a-4338-a276-396782c12c63'
    and created_at > now() - interval '30 days';
$$;


ALTER FUNCTION "public"."last_30d_analytics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notes_edit_note"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_updated_at" timestamp with time zone, "p_deleted_recording_ids" "uuid"[] DEFAULT '{}'::"uuid"[], "p_new_recordings" "jsonb" DEFAULT '[]'::"jsonb") RETURNS "public"."feed_items"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_feed_item feed_items;
  v_voice_count integer;
begin


update notes
set
  title = p_title,
  notes = p_notes,
  updated_at = p_updated_at
where id = p_id;

if array_length(p_deleted_recording_ids, 1) > 0 then
  delete from notes_voice
  where id = any(p_deleted_recording_ids)
    and note_id = p_id;
end if;

if jsonb_array_length(p_new_recordings) > 0 then
  insert into notes_voice (
    storage_path,
    note_id,
    duration_ms
  )
  select
    r->>'storage_path',
    p_id,
    (r->>'duration_ms')::integer
  from jsonb_array_elements(p_new_recordings) as r;
end if;

select count(*) into v_voice_count
from notes_voice
where note_id = p_id;

update feed_items
set
  title = p_title,
  extra_fields = jsonb_build_object('notes', p_notes, 'voice-count', v_voice_count),
  updated_at = p_updated_at
where source_id = p_id
  and type = 'notes'
returning * into v_feed_item;

return v_feed_item;
end;
$$;


ALTER FUNCTION "public"."notes_edit_note"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_updated_at" timestamp with time zone, "p_deleted_recording_ids" "uuid"[], "p_new_recordings" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notes_save_note"("p_title" "text", "p_notes" "text", "p_draftrecordings" "jsonb" DEFAULT '[]'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
 v_note_id uuid;
begin


insert into notes (
  title, 
  notes
)
values (
  p_title,
  p_notes
)
returning id into v_note_id;

insert into notes_voice (
  storage_path,
  note_id,
  duration_ms
)
select
  r->>'storage_path',
  v_note_id,
  (r->>'duration_ms')::integer
from jsonb_array_elements(p_draftRecordings) as r;


insert into feed_items (
  title,
  type,
  extra_fields,
  source_id,
  occurred_at
)
values (
  p_title,
  'notes',
  jsonb_build_object('notes', p_notes, 'voice-count', jsonb_array_length(p_draftRecordings)),
  v_note_id,
  now()
);

return v_note_id;
end;
$$;


ALTER FUNCTION "public"."notes_save_note"("p_title" "text", "p_notes" "text", "p_draftrecordings" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reminders_delete_global_reminder"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin


delete from global_reminders 
 where id = p_id;  


delete from feed_items 
 where source_id = p_id 
 and type = 'global_reminders';

end;
$$;


ALTER FUNCTION "public"."reminders_delete_global_reminder"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reminders_delete_local_reminder"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin


delete from local_reminders 
 where id = p_id;  


delete from feed_items 
 where source_id = p_id 
 and type = 'local_reminders';

end;
$$;


ALTER FUNCTION "public"."reminders_delete_local_reminder"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reminders_edit_global_reminder"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_notify_at" timestamp with time zone, "p_seen_at" timestamp with time zone, "p_delivered" boolean, "p_updated_at" timestamp with time zone, "p_mode" "text" DEFAULT NULL::"text") RETURNS "public"."feed_items"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
 v_feed_item feed_items;
begin


update global_reminders
set
  title = p_title,
  notes = p_notes,
  notify_at = p_notify_at,
  seen_at = p_seen_at,
  delivered = p_delivered,
  updated_at = p_updated_at,
  mode = COALESCE(p_mode, mode)
where id = p_id;


update feed_items
set
  title = p_title,
  extra_fields = jsonb_build_object('notes', p_notes, 'notify_at', p_notify_at, 'seen_at', p_seen_at, 'delivered', p_delivered, 'type', 'global', 'mode', COALESCE(p_mode, (extra_fields->>'mode'))),
  updated_at = p_updated_at
where source_id = p_id
 and type = 'global_reminders'
 returning * into v_feed_item;

return v_feed_item;
end;
$$;


ALTER FUNCTION "public"."reminders_edit_global_reminder"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_notify_at" timestamp with time zone, "p_seen_at" timestamp with time zone, "p_delivered" boolean, "p_updated_at" timestamp with time zone, "p_mode" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reminders_edit_local_reminder"("p_id" "uuid", "p_title" "text", "p_type" "text", "p_updated_at" timestamp with time zone, "p_mode" "text", "p_notes" "text" DEFAULT NULL::"text", "p_notify_at_time" time without time zone DEFAULT NULL::time without time zone, "p_notify_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_weekdays" "json" DEFAULT NULL::"json", "p_seen_at" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS "public"."feed_items"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
 v_feed_item feed_items;
begin


update local_reminders 
set 
  title = p_title,
  notes = p_notes,
  notify_at_time = p_notify_at_time,
  notify_date = p_notify_date,
  weekdays = p_weekdays,
  type = p_type,
  updated_at = p_updated_at,
  seen_at = p_seen_at,
  mode = p_mode
where id = p_id;


update feed_items 
set
  title = p_title,
  extra_fields = jsonb_build_object('notes', p_notes, 'notify_at_time', p_notify_at_time, 'notify_date', p_notify_date, 'weekdays', p_weekdays, 'type', p_type, 'mode', p_mode),
  updated_at = p_updated_at
where source_id = p_id
 and type = 'local_reminders'
 returning * into v_feed_item;

return v_feed_item;
end;
$$;


ALTER FUNCTION "public"."reminders_edit_local_reminder"("p_id" "uuid", "p_title" "text", "p_type" "text", "p_updated_at" timestamp with time zone, "p_mode" "text", "p_notes" "text", "p_notify_at_time" time without time zone, "p_notify_date" timestamp with time zone, "p_weekdays" "json", "p_seen_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reminders_get_by_tab"("p_tab" "text") RETURNS TABLE("id" "uuid", "title" "text", "notes" "text", "type" "text", "notify_at" timestamp with time zone, "notify_date" timestamp with time zone, "notify_at_time" time without time zone, "weekdays" "json", "delivered" boolean, "seen_at" timestamp with time zone, "mode" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  if p_tab = 'normal' then
    -- Upcoming one-time reminders (not yet delivered)
    return query
      select lr.id, lr.title, lr.notes, 'one-time'::text, null::timestamptz, lr.notify_date::timestamptz, null::time, null::json, lr.delivered, lr.seen_at, lr.mode, lr.created_at::timestamptz, lr.updated_at
      from local_reminders lr
      where lr.type = 'one-time' and lr.notify_date > now()
      union all
      select gr.id, gr.title, gr.notes, 'global'::text, gr.notify_at, null::timestamptz, null::time, null::json, gr.delivered, gr.seen_at, null::text, gr.created_at::timestamptz, gr.updated_at
      from global_reminders gr
      where gr.delivered = false;

  elsif p_tab = 'repeating' then
    return query
      select lr.id, lr.title, lr.notes, lr.type, null::timestamptz, null::timestamptz, lr.notify_at_time, lr.weekdays, lr.delivered, lr.seen_at, lr.mode, lr.created_at::timestamptz, lr.updated_at
      from local_reminders lr
      where lr.type in ('daily', 'weekly');

  elsif p_tab = 'delivered' then
    return query
      select lr.id, lr.title, lr.notes, 'one-time'::text, null::timestamptz, lr.notify_date::timestamptz, null::time, null::json, lr.delivered, lr.seen_at, lr.mode, lr.created_at::timestamptz, lr.updated_at
      from local_reminders lr
      where lr.type = 'one-time' and lr.notify_date <= now()
      union all
      select gr.id, gr.title, gr.notes, 'global'::text, gr.notify_at, null::timestamptz, null::time, null::json, gr.delivered, gr.seen_at, null::text, gr.created_at::timestamptz, gr.updated_at
      from global_reminders gr
      where gr.delivered = true;
  end if;
end;
$$;


ALTER FUNCTION "public"."reminders_get_by_tab"("p_tab" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reminders_save_global_reminder"("p_title" "text", "p_notes" "text", "p_notify_at" timestamp with time zone, "p_type" "text", "p_created_from_device_id" "text" DEFAULT NULL::"text", "p_mode" "text" DEFAULT 'normal'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
 v_reminder_id uuid;
begin


insert into global_reminders (
  title,
  notes,
  notify_at,
  type,
  created_from_device_id,
  mode
)
values (
  p_title,
  p_notes,
  p_notify_at,
  p_type,
  p_created_from_device_id,
  p_mode
)
returning id into v_reminder_id;


insert into feed_items (
  title,
  type,
  extra_fields,
  source_id,
  occurred_at
)
values (
  p_title,
  'global_reminders',
  jsonb_build_object('notes', p_notes, 'notify_at', p_notify_at, 'type', 'global', 'mode', p_mode),
  v_reminder_id,
  now()
);

return v_reminder_id;
end;
$$;


ALTER FUNCTION "public"."reminders_save_global_reminder"("p_title" "text", "p_notes" "text", "p_notify_at" timestamp with time zone, "p_type" "text", "p_created_from_device_id" "text", "p_mode" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reminders_save_local_reminder"("p_title" "text", "p_type" "text", "p_mode" "text", "p_notes" "text" DEFAULT NULL::"text", "p_notify_at_time" time without time zone DEFAULT NULL::time without time zone, "p_notify_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_weekdays" "json" DEFAULT NULL::"json") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
 v_reminder_id uuid;
 v_count int;
begin


insert into local_reminders (
  title, 
  notes,
  notify_at_time,
  notify_date,
  weekdays,
  type,
  mode
)
values (
  p_title,
  p_notes,
  p_notify_at_time,
  p_notify_date,
  p_weekdays,
  p_type,
  p_mode
)
returning id into v_reminder_id;


insert into feed_items (
  title,
  type,
  extra_fields,
  source_id,
  occurred_at
)
values (
  p_title,
  'local_reminders',
  jsonb_build_object('notes', p_notes, 'notify_at_time', p_notify_at_time, 'notify_date', p_notify_date, 'weekdays', p_weekdays, 'type', p_type, 'mode', p_mode),
  v_reminder_id,
  now()
);

get diagnostics v_count = row_count;

  if v_count = 0 then
    raise exception
      'feed_items insert blocked: type=%, source_id=%',
      'local_reminders',
      v_reminder_id;
  end if;


return v_reminder_id;
end;
$$;


ALTER FUNCTION "public"."reminders_save_local_reminder"("p_title" "text", "p_type" "text", "p_mode" "text", "p_notes" "text", "p_notify_at_time" time without time zone, "p_notify_date" timestamp with time zone, "p_weekdays" "json") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."todo_check_todo"("p_list_id" "uuid", "p_todo_tasks" "jsonb", "p_updated_at" timestamp with time zone) RETURNS "public"."feed_items"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
 v_feed_item feed_items;
begin


update todo_lists 
set 
  updated_at = p_updated_at
where id = p_list_id;


update todo_tasks t 
set 
is_completed = src.is_completed,
position = src.position,
updated_at = case 
    when t.is_completed is distinct from src.is_completed
    then p_updated_at
    else t.updated_at
  end
from (
    select 
    (elem->>'id')::uuid as id,
    (elem->>'is_completed')::boolean as is_completed,
    (elem->>'position')::integer as position
    from jsonb_array_elements(p_todo_tasks) as elem
) src 
where t.id = src.id 
  and t.list_id = p_list_id;



update feed_items
set
  extra_fields = jsonb_build_object('completed', (select count(*) from todo_tasks where list_id = p_list_id and is_completed = true), 'total', (select count(*) from todo_tasks where list_id = p_list_id)),
  updated_at = p_updated_at,
  occurred_at = p_updated_at
where source_id = p_list_id
 and type = 'todo_lists'
 returning * into v_feed_item;

return v_feed_item;
end;
$$;


ALTER FUNCTION "public"."todo_check_todo"("p_list_id" "uuid", "p_todo_tasks" "jsonb", "p_updated_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."todo_edit_todo"("p_id" "uuid", "p_title" "text", "p_tasks" "jsonb", "p_deleted_ids" "uuid"[], "p_updated_at" timestamp with time zone) RETURNS "public"."feed_items"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
 v_feed_item feed_items;
begin


update todo_lists 
set 
  title = p_title,
  updated_at = p_updated_at
where id = p_id;


update todo_tasks t 
set 
task = src.task,
notes = src.notes,
position = src.position,
updated_at = case 
    when t.task is distinct from src.task 
      or t.notes is distinct from src.notes
    then p_updated_at
    else t.updated_at
  end
from (
    select 
    (elem->>'id')::uuid as id,
    (elem->>'task')::text as task,
    (elem->>'notes')::text as notes,
    (elem->>'position')::integer as position
    from jsonb_array_elements(p_tasks) as elem
) src 
where t.id = src.id 
  and t.list_id = p_id;


 -- insert new todo tasks

insert into todo_tasks (
    list_id,
    task,
    notes,
    position
)
select
    p_id,
    elem->>'task',
    elem->>'notes',
    (elem->>'position')::integer
from jsonb_array_elements(p_tasks) elem
 where elem->>'id' is null;

 -- delete todo tasks

 delete from todo_tasks
 where list_id = p_id
 and id = any(p_deleted_ids);



update feed_items 
set
  title = p_title,
  extra_fields = jsonb_build_object('completed', (select count(*) from todo_tasks where list_id = p_id and is_completed = true), 'total', (select count(*) from todo_tasks where list_id = p_id)),
  updated_at = p_updated_at
where source_id = p_id
 and type = 'todo_lists'
 returning * into v_feed_item;

return v_feed_item;
end;
$$;


ALTER FUNCTION "public"."todo_edit_todo"("p_id" "uuid", "p_title" "text", "p_tasks" "jsonb", "p_deleted_ids" "uuid"[], "p_updated_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."todo_save_todo"("p_title" "text", "p_todo_list" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
 v_todo_id uuid;
begin


insert into todo_lists (
  title
)
values (
  p_title
)
returning id into v_todo_id;


insert into todo_tasks (
  list_id,
  task,
  notes,
  position
)
select
  v_todo_id,
  elem->>'task'  as task,
  elem->>'notes' as notes,
  ordinality - 1 as position
from jsonb_array_elements(p_todo_list) with ordinality as t(elem, ordinality);



insert into feed_items (
  title,
  type,
  extra_fields,
  source_id,
  occurred_at
)
values (
  p_title,
  'todo_lists',
  jsonb_build_object('completed', 0, 'total', jsonb_array_length(p_todo_list)),
  v_todo_id,
  now()
);


return v_todo_id;
end;
$$;


ALTER FUNCTION "public"."todo_save_todo"("p_title" "text", "p_todo_list" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."weight_edit_weight"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_weight" numeric, "p_updated_at" timestamp with time zone) RETURNS "public"."feed_items"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
v_feed_item feed_items;
begin


update weight 
set 
  title = p_title,
  notes = p_notes,
  weight = p_weight,
  updated_at = p_updated_at
where id = p_id;


update feed_items
set
  title = p_title,
  extra_fields = jsonb_build_object('notes', p_notes, 'weight', p_weight)
where source_id = p_id
 and type = 'weight'
 returning * into v_feed_item;

return v_feed_item;
end;
$$;


ALTER FUNCTION "public"."weight_edit_weight"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_weight" numeric, "p_updated_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."weight_save_weight"("p_title" "text", "p_notes" "text", "p_weight" numeric) RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
 v_weight_id uuid;
begin


insert into weight (
  title, 
  notes,
  weight
)
values (
  p_title,
  p_notes,
  p_weight
)
returning id into v_weight_id;


insert into feed_items (
  title,
  type,
  extra_fields,
  source_id,
  occurred_at
)
values (
  p_title,
  'weight',
  jsonb_build_object('notes', p_notes, 'weight', p_weight),
  v_weight_id,
  now()
);

return v_weight_id;
end;
$$;


ALTER FUNCTION "public"."weight_save_weight"("p_title" "text", "p_notes" "text", "p_weight" numeric) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "slug" "text",
    "category_id" "uuid" NOT NULL,
    "base_met" numeric(4,2) NOT NULL,
    CONSTRAINT "name_length" CHECK (("char_length"("name") <= 200))
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "slug" "text",
    CONSTRAINT "category_name_length" CHECK (("char_length"("name") <= 200))
);


ALTER TABLE "public"."activity_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_gps_points" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "recorded_at" timestamp with time zone NOT NULL,
    "latitude" double precision NOT NULL,
    "longitude" double precision NOT NULL,
    "altitude" double precision,
    "accuracy" double precision,
    "is_stationary" boolean DEFAULT false,
    "bad_signal" boolean DEFAULT false
);


ALTER TABLE "public"."activity_gps_points" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "geom" "extensions"."geography"(LineString,4326),
    "distance_meters" integer,
    CONSTRAINT "name_length" CHECK (("char_length"("name") <= 5000)),
    CONSTRAINT "notes_length" CHECK (("char_length"("notes") <= 500000))
);


ALTER TABLE "public"."activity_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_counts" (
    "id" "text" DEFAULT "gen_random_uuid"() NOT NULL,
    "count" integer NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics_counts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_conversation_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_conversation_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "is_group" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_message_status" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid",
    "user_id" "uuid",
    "status" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_message_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text",
    "conversation_id" "uuid",
    "sender_id" "uuid",
    "attachment_url" "text",
    "read_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."debug_session" AS
 SELECT "auth"."uid"() AS "user_id",
    ("auth"."jwt"() ->> 'role'::"text") AS "jwt_role";


ALTER TABLE "public"."debug_session" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."disc_golf_course_holes" (
    "id" bigint NOT NULL,
    "course_id" "uuid",
    "hole_number" bigint,
    "par" bigint,
    "length" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."disc_golf_course_holes" OWNER TO "postgres";


ALTER TABLE "public"."disc_golf_course_holes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."disc_golf_course_holes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."disc_golf_courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."disc_golf_courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."disc_golf_session_scores" (
    "id" bigint NOT NULL,
    "session_id" "uuid" DEFAULT "gen_random_uuid"(),
    "user_id" "uuid" DEFAULT "gen_random_uuid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "hole_number" bigint,
    "strokes" bigint,
    "fairway_hit" boolean,
    "c1_putt_made" boolean,
    "c1_putt_attempted" boolean,
    "c2_putt_made" boolean,
    "c2_putt_attempted" boolean,
    "course_name" "text",
    "is_public" boolean,
    "type" "text",
    "duration" "text"
);


ALTER TABLE "public"."disc_golf_session_scores" OWNER TO "postgres";


ALTER TABLE "public"."disc_golf_session_scores" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."disc_golf_session_scores_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."disc_golf_sessions" (
    "id" bigint NOT NULL,
    "course_id" "uuid" DEFAULT "gen_random_uuid"(),
    "played_by" "uuid" DEFAULT "gen_random_uuid"(),
    "played_at" "date" NOT NULL
);


ALTER TABLE "public"."disc_golf_sessions" OWNER TO "postgres";


ALTER TABLE "public"."disc_golf_sessions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."disc_golf_sessions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."friend_requests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "friend_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text"]))),
    CONSTRAINT "status_length" CHECK (("char_length"("status") <= 30))
);


ALTER TABLE "public"."friend_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."friends" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user1_id" "uuid",
    "user2_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."friends" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."global_reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "title" "text" NOT NULL,
    "notes" "text",
    "notify_at" timestamp with time zone NOT NULL,
    "type" "text" DEFAULT 'global'::"text" NOT NULL,
    "updated_at" timestamp with time zone,
    "seen_at" timestamp with time zone,
    "delivered" boolean DEFAULT false NOT NULL,
    "created_from_device_id" "text",
    "mode" "text" DEFAULT 'normal'::"text",
    CONSTRAINT "notes_length" CHECK (("char_length"("notes") <= 500000)),
    CONSTRAINT "title_length" CHECK (("char_length"("title") <= 5000))
);


ALTER TABLE "public"."global_reminders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gym_exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "user_id" "uuid",
    "equipment" "text" NOT NULL,
    "muscle_group" "text" NOT NULL,
    "main_group" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    CONSTRAINT "equipment_length" CHECK (("char_length"("equipment") <= 100)),
    CONSTRAINT "gym_exercises_name_length" CHECK (("char_length"("name") <= 100)),
    CONSTRAINT "main_group_length" CHECK (("char_length"("main_group") <= 100)),
    CONSTRAINT "muscle_group_length" CHECK (("char_length"("muscle_group") <= 100))
);


ALTER TABLE "public"."gym_exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gym_exercises_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "exercise_id" "uuid" NOT NULL,
    "language" "text" DEFAULT 'en'::"text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "language_length" CHECK (("char_length"("language") <= 5)),
    CONSTRAINT "name_length" CHECK (("char_length"("name") <= 100))
);


ALTER TABLE "public"."gym_exercises_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gym_session_exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "exercise_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "notes" "text",
    "superset_id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notes_length" CHECK (("char_length"("notes") <= 500000))
);


ALTER TABLE "public"."gym_session_exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gym_sessions" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "notes" "text",
    "duration" integer NOT NULL,
    "title" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    CONSTRAINT "notes_length" CHECK (("char_length"("notes") <= 500)),
    CONSTRAINT "title_length" CHECK (("char_length"("title") <= 150))
);


ALTER TABLE "public"."gym_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gym_sessions_backup" (
    "id" "uuid",
    "user_id" "uuid",
    "notes" "text",
    "duration" integer,
    "title" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."gym_sessions_backup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gym_sets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_exercise_id" "uuid" NOT NULL,
    "set_number" integer NOT NULL,
    "reps" integer,
    "weight" numeric,
    "rpe" "text",
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "time_min" numeric,
    "distance_meters" numeric,
    "updated_at" timestamp with time zone,
    CONSTRAINT "rpe_length" CHECK (("char_length"("rpe") <= 50))
);


ALTER TABLE "public"."gym_sets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gym_template_exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "exercise_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "template_id" "uuid" NOT NULL,
    "superset_id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL
);


ALTER TABLE "public"."gym_template_exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gym_template_sets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_exercise_id" "uuid" NOT NULL,
    "set_number" integer,
    "reps" integer,
    "weight" numeric,
    "rpe" "text",
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL
);


ALTER TABLE "public"."gym_template_sets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gym_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "name" "text" NOT NULL,
    "updated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "name_length" CHECK (("char_length"("name") <= 5000))
);


ALTER TABLE "public"."gym_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."local_reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "title" "text" NOT NULL,
    "notes" "text",
    "type" "text" NOT NULL,
    "notify_at_time" time without time zone,
    "weekdays" "json",
    "notify_date" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "seen_at" timestamp with time zone,
    "delivered" boolean DEFAULT false NOT NULL,
    "mode" "text" DEFAULT '''normal'''::"text",
    CONSTRAINT "notes_length" CHECK (("char_length"("notes") <= 500000)),
    CONSTRAINT "title_length" CHECK (("char_length"("title") <= 5000))
);


ALTER TABLE "public"."local_reminders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notes" (
    "title" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "updated_at" timestamp with time zone,
    "activity_at" timestamp with time zone GENERATED ALWAYS AS (GREATEST("updated_at", "created_at")) STORED NOT NULL,
    CONSTRAINT "notes_length" CHECK (("char_length"("notes") <= 500000)),
    CONSTRAINT "title_length" CHECK (("char_length"("title") <= 5000))
);


ALTER TABLE "public"."notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notes_voice" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "storage_path" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "duration_ms" integer NOT NULL,
    "note_id" "uuid" NOT NULL
);


ALTER TABLE "public"."notes_voice" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pinned_items" (
    "type" "text" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "feed_item_id" "uuid" NOT NULL,
    "pinned_context" "text"
);


ALTER TABLE "public"."pinned_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" bigint NOT NULL,
    "user_id" "uuid" DEFAULT "gen_random_uuid"(),
    "name" "text",
    "is_quest" boolean,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."players" OWNER TO "postgres";


ALTER TABLE "public"."players" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."players_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."session_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "distance_meters" integer,
    "moving_time_seconds" integer,
    "steps" integer,
    "avg_pace" integer,
    "avg_speed" numeric(6,2),
    "max_speed" numeric(6,2),
    "calories" integer,
    "elevation_gain" integer,
    "updated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "computed_at" timestamp with time zone,
    "bad_signal_time_seconds" numeric DEFAULT 0
);


ALTER TABLE "public"."session_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "duration" integer NOT NULL,
    "notes" "text",
    "title" "text" NOT NULL,
    "geom" "extensions"."geography",
    "template_id" "uuid",
    CONSTRAINT "notes_length" CHECK (("char_length"("notes") <= 500000)),
    CONSTRAINT "title_length" CHECK (("char_length"("title") <= 5000))
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions_voice" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "storage_path" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "duration_ms" integer NOT NULL,
    "session_id" "uuid" NOT NULL
);


ALTER TABLE "public"."sessions_voice" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."steps_daily" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "day" "date" NOT NULL,
    "timezone" "text" NOT NULL,
    "steps" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    CONSTRAINT "steps_daily_steps_check" CHECK (("steps" >= 0))
);


ALTER TABLE "public"."steps_daily" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."timers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "time_seconds" integer NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    "updated_at" timestamp with time zone,
    CONSTRAINT "notes_length" CHECK (("char_length"("notes") <= 500000)),
    CONSTRAINT "title_length" CHECK (("char_length"("title") <= 5000))
);


ALTER TABLE "public"."timers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."todo_lists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "title" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    CONSTRAINT "title_length" CHECK (("char_length"("title") <= 5000))
);


ALTER TABLE "public"."todo_lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."todo_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "list_id" "uuid" NOT NULL,
    "task" "text" NOT NULL,
    "notes" "text",
    "is_completed" boolean DEFAULT false NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "updated_at" timestamp with time zone,
    "position" integer,
    CONSTRAINT "notes_length" CHECK (("char_length"("notes") <= 500000)),
    CONSTRAINT "tasks_length" CHECK (("char_length"("task") <= 5000))
);


ALTER TABLE "public"."todo_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_push_mobile_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "platform" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean,
    "token" "text" NOT NULL,
    "device_id" "uuid" NOT NULL
);


ALTER TABLE "public"."user_push_mobile_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "auth" character varying,
    "endpoint" "text" NOT NULL,
    "p256dh" "text",
    "device_type" "text" NOT NULL,
    "updated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."user_push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "push_enabled" boolean DEFAULT false NOT NULL,
    "gps_tracking_enabled" boolean DEFAULT false NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "language" "text" DEFAULT 'en'::"text" NOT NULL,
    CONSTRAINT "user_settings_language_length" CHECK (("char_length"("language") = 2))
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "display_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "banned_until" timestamp with time zone,
    "ban_reason" "text",
    "weight_unit" "text" DEFAULT 'kg'::"text" NOT NULL,
    "profile_picture" "text",
    CONSTRAINT "ban_reason_length" CHECK (("char_length"("ban_reason") <= 500)),
    CONSTRAINT "display_name_length" CHECK (("char_length"("display_name") <= 30)),
    CONSTRAINT "email_length" CHECK (("char_length"("email") <= 254)),
    CONSTRAINT "profile_picturelength" CHECK (("char_length"("profile_picture") <= 200)),
    CONSTRAINT "role_length" CHECK (("char_length"("role") <= 50)),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'admin'::"text", 'super_admin'::"text", 'guest'::"text"]))),
    CONSTRAINT "weight_unit_length" CHECK (("char_length"("weight_unit") <= 15))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weight" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "weight" numeric NOT NULL,
    "notes" "text",
    "title" "text" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "updated_at" timestamp with time zone,
    CONSTRAINT "notes_length" CHECK (("char_length"("notes") <= 500000)),
    CONSTRAINT "title_length" CHECK (("char_length"("title") <= 5000))
);


ALTER TABLE "public"."weight" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_categories"
    ADD CONSTRAINT "activity_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_gps_points"
    ADD CONSTRAINT "activity_gps_points_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "activity_session_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_stats"
    ADD CONSTRAINT "activity_session_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_stats"
    ADD CONSTRAINT "activity_session_unique" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."activity_templates"
    ADD CONSTRAINT "activity_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_counts"
    ADD CONSTRAINT "analytics_counts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_conversation_participants"
    ADD CONSTRAINT "chat_conversation_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_conversations"
    ADD CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_message_status"
    ADD CONSTRAINT "chat_message_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."local_reminders"
    ADD CONSTRAINT "custom_reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."disc_golf_course_holes"
    ADD CONSTRAINT "disc_golf_course_holes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."disc_golf_courses"
    ADD CONSTRAINT "disc_golf_courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."disc_golf_session_scores"
    ADD CONSTRAINT "disc_golf_session_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."disc_golf_sessions"
    ADD CONSTRAINT "disc_golf_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gym_exercises"
    ADD CONSTRAINT "exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gym_exercises"
    ADD CONSTRAINT "exercises_user_id_name_key" UNIQUE ("user_id", "name");



ALTER TABLE ONLY "public"."feed_items"
    ADD CONSTRAINT "feed_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friend_requests"
    ADD CONSTRAINT "friend_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friends"
    ADD CONSTRAINT "friends_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gym_exercises_translations"
    ADD CONSTRAINT "gym_exercises_translations_exercise_id_language_key" UNIQUE ("exercise_id", "language");



ALTER TABLE ONLY "public"."gym_exercises_translations"
    ADD CONSTRAINT "gym_exercises_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gym_template_exercises"
    ADD CONSTRAINT "gym_template_exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gym_template_sets"
    ADD CONSTRAINT "gym_template_sets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gym_templates"
    ADD CONSTRAINT "gym_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notes_voice"
    ADD CONSTRAINT "notes_voice_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pinned_items"
    ADD CONSTRAINT "pinned_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pinned_items"
    ADD CONSTRAINT "pinned_items_user_id_type_feed_item_id_pinned_context_key" UNIQUE ("user_id", "type", "feed_item_id", "pinned_context");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."global_reminders"
    ADD CONSTRAINT "reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gym_session_exercises"
    ADD CONSTRAINT "session_exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gym_sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions_voice"
    ADD CONSTRAINT "sessions_voice_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gym_sets"
    ADD CONSTRAINT "sets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."steps_daily"
    ADD CONSTRAINT "steps_daily_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."steps_daily"
    ADD CONSTRAINT "steps_daily_user_id_day_key" UNIQUE ("user_id", "day");



ALTER TABLE ONLY "public"."timers"
    ADD CONSTRAINT "timers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."todo_lists"
    ADD CONSTRAINT "todo_lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."todo_tasks"
    ADD CONSTRAINT "todo_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_push_mobile_subscriptions"
    ADD CONSTRAINT "unique_user_device" UNIQUE ("user_id", "device_id");



ALTER TABLE ONLY "public"."user_push_mobile_subscriptions"
    ADD CONSTRAINT "user_push_mobile_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_push_subscriptions"
    ADD CONSTRAINT "user_push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_push_subscriptions"
    ADD CONSTRAINT "user_push_subscriptions_user_id_endpoint_key" UNIQUE ("user_id", "endpoint");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_display_name_key" UNIQUE ("display_name");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weight"
    ADD CONSTRAINT "weight_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "activities_slug_idx" ON "public"."activities" USING "btree" ("slug");



CREATE UNIQUE INDEX "activity_categories_name_lower_idx" ON "public"."activity_categories" USING "btree" ("lower"("name")) WHERE ("user_id" = NULL::"uuid");



CREATE UNIQUE INDEX "activity_categories_user_name_lower_idx" ON "public"."activity_categories" USING "btree" ("user_id", "lower"("name")) WHERE ("user_id" IS NOT NULL);



CREATE INDEX "feed_items_user_activity_idx" ON "public"."feed_items" USING "btree" ("user_id", "activity_at" DESC);



CREATE INDEX "idx_exercise_translations_lookup" ON "public"."gym_exercises_translations" USING "btree" ("exercise_id", "language");



CREATE INDEX "idx_gse_exercise_id" ON "public"."gym_session_exercises" USING "btree" ("exercise_id");



CREATE INDEX "idx_gse_session_id" ON "public"."gym_session_exercises" USING "btree" ("session_id");



CREATE UNIQUE INDEX "users_display_name_lower_idx" ON "public"."users" USING "btree" ("lower"("display_name"));



CREATE OR REPLACE TRIGGER "activities_set_slug_trigger" BEFORE INSERT OR UPDATE ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."activities_set_slug"();



CREATE OR REPLACE TRIGGER "trigger_decrement_user_count" AFTER DELETE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."decrement_user_count"();



CREATE OR REPLACE TRIGGER "trigger_increment_user_count" AFTER INSERT ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."increment_user_count"();



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."activity_categories"("id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_categories"
    ADD CONSTRAINT "activity_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_gps_points"
    ADD CONSTRAINT "activity_gps_points_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "activity_session_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_stats"
    ADD CONSTRAINT "activity_session_stats_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "activity_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "activity_sessions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."activity_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activity_templates"
    ADD CONSTRAINT "activity_templates_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."activity_templates"
    ADD CONSTRAINT "activity_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_conversation_participants"
    ADD CONSTRAINT "chat_conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_message_status"
    ADD CONSTRAINT "chat_message_status_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."disc_golf_course_holes"
    ADD CONSTRAINT "disc_golf_course_holes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."disc_golf_courses"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."disc_golf_sessions"
    ADD CONSTRAINT "disc_golf_sessions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."disc_golf_courses"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feed_items"
    ADD CONSTRAINT "feed_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friend_requests"
    ADD CONSTRAINT "friend_requests_receiver_id_fkey1" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friend_requests"
    ADD CONSTRAINT "friend_requests_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friends"
    ADD CONSTRAINT "friends_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friends"
    ADD CONSTRAINT "friends_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gym_exercises_translations"
    ADD CONSTRAINT "gym_exercises_translations_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."gym_exercises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gym_exercises"
    ADD CONSTRAINT "gym_exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gym_session_exercises"
    ADD CONSTRAINT "gym_session_exercises_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gym_session_exercises"
    ADD CONSTRAINT "gym_session_exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gym_sessions"
    ADD CONSTRAINT "gym_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gym_sets"
    ADD CONSTRAINT "gym_sets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gym_template_exercises"
    ADD CONSTRAINT "gym_template_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."gym_exercises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gym_template_exercises"
    ADD CONSTRAINT "gym_template_exercises_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."gym_templates"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gym_template_exercises"
    ADD CONSTRAINT "gym_template_exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gym_template_sets"
    ADD CONSTRAINT "gym_template_sets_template_exercise_id_fkey" FOREIGN KEY ("template_exercise_id") REFERENCES "public"."gym_template_exercises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gym_template_sets"
    ADD CONSTRAINT "gym_template_sets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gym_templates"
    ADD CONSTRAINT "gym_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."local_reminders"
    ADD CONSTRAINT "local_reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes_voice"
    ADD CONSTRAINT "notes_voice_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes_voice"
    ADD CONSTRAINT "notes_voice_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pinned_items"
    ADD CONSTRAINT "pinned_items_feed_item_id_fkey" FOREIGN KEY ("feed_item_id") REFERENCES "public"."feed_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pinned_items"
    ADD CONSTRAINT "pinned_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."global_reminders"
    ADD CONSTRAINT "reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gym_session_exercises"
    ADD CONSTRAINT "session_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."gym_exercises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions_voice"
    ADD CONSTRAINT "sessions_voice_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions_voice"
    ADD CONSTRAINT "sessions_voice_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gym_sets"
    ADD CONSTRAINT "sets_session_exercise_id_fkey" FOREIGN KEY ("session_exercise_id") REFERENCES "public"."gym_session_exercises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."steps_daily"
    ADD CONSTRAINT "steps_daily_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."timers"
    ADD CONSTRAINT "timers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."todo_lists"
    ADD CONSTRAINT "todo_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."todo_tasks"
    ADD CONSTRAINT "todo_tasks_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."todo_lists"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."todo_tasks"
    ADD CONSTRAINT "todo_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_push_mobile_subscriptions"
    ADD CONSTRAINT "user_push_mobile_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_push_subscriptions"
    ADD CONSTRAINT "user_push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weight"
    ADD CONSTRAINT "weight_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow CRUD user own records" ON "public"."notes_voice" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow Update for auth users" ON "public"."timers" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow all for admins" ON "public"."gym_exercises_translations" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))));



CREATE POLICY "Allow delete authenticated user" ON "public"."pinned_items" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow delete for admin and owners" ON "public"."activities" FOR DELETE TO "authenticated" USING ((((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Allow delete for admin and owners" ON "public"."gym_exercises" FOR DELETE TO "authenticated" USING ((((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Allow delete for ath users" ON "public"."todo_tasks" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow delete for auth users" ON "public"."gym_templates" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow delete for auth users" ON "public"."timers" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow delete for auth users" ON "public"."todo_lists" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow delete for auth users" ON "public"."weight" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow insert for auth users" ON "public"."gym_templates" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow insert for auth users" ON "public"."timers" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow insert for auth users" ON "public"."todo_tasks" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow insert for auth users" ON "public"."weight" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow insert for authenticated users" ON "public"."pinned_items" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow insert for non guest users" ON "public"."todo_lists" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") AND ("auth"."email"() <> 'guest@example.com'::"text")));



CREATE POLICY "Allow inserting a profile for yourself" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Allow inserting/Delete/upodate/read subscriptions for yourself" ON "public"."user_push_mobile_subscriptions" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow inserting/Delete/upodate/read subscriptions for yourself" ON "public"."user_push_subscriptions" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow read for all" ON "public"."todo_tasks" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow read for auth users" ON "public"."timers" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow read for auth users" ON "public"."todo_lists" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow read for auth users" ON "public"."weight" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow select authenticated user" ON "public"."pinned_items" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow select for auth users" ON "public"."gym_templates" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow select for authenticated users" ON "public"."disc_golf_session_scores" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow select for authenticated users" ON "public"."notes" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow self to crud" ON "public"."global_reminders" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow update for admin and owners" ON "public"."activities" FOR UPDATE TO "authenticated" USING ((((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR ("user_id" = "auth"."uid"()))) WITH CHECK ((((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Allow update for admin and owners" ON "public"."gym_exercises" FOR UPDATE TO "authenticated" USING ((((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR ("user_id" = "auth"."uid"()))) WITH CHECK ((((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Allow update for auth users" ON "public"."gym_templates" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow update for auth users" ON "public"."pinned_items" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow update for auth users" ON "public"."todo_tasks" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow update for auth users" ON "public"."weight" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow update for non guest users" ON "public"."todo_lists" FOR UPDATE USING ((("auth"."uid"() = "user_id") AND ("auth"."email"() <> 'guest@example.com'::"text"))) WITH CHECK ((("auth"."uid"() = "user_id") AND ("auth"."email"() <> 'guest@example.com'::"text")));



CREATE POLICY "Allow user to CRUD own templates" ON "public"."activity_templates" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow user to delete their own session exercises" ON "public"."gym_session_exercises" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow user to delete their own sessions" ON "public"."gym_sessions" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow user to delete their own sets" ON "public"."gym_sets" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow user to insert into their own session exercises" ON "public"."gym_session_exercises" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow user to insert their own sessions" ON "public"."gym_sessions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow user to insert their own sets" ON "public"."gym_sets" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow user to read own friends" ON "public"."friends" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user1_id") OR ("auth"."uid"() = "user2_id")));



CREATE POLICY "Allow user to read their own session exercises" ON "public"."gym_session_exercises" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow user to read their own sessions" ON "public"."gym_sessions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow user to read their own sets" ON "public"."gym_sets" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow user to select" ON "public"."user_settings" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow user to update their own session exercises" ON "public"."gym_session_exercises" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow user to update their own sessions" ON "public"."gym_sessions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow user to update their own sets" ON "public"."gym_sets" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Anyone authenticated can read all translations" ON "public"."gym_exercises_translations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Can insert own friendships" ON "public"."friends" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user1_id") OR ("auth"."uid"() = "user2_id")));



CREATE POLICY "Delete for auth users" ON "public"."gym_template_exercises" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Delete for auth users" ON "public"."gym_template_sets" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Insert for auth users" ON "public"."gym_template_exercises" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Read for auth " ON "public"."gym_template_exercises" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Receiver can accept or reject request" ON "public"."friend_requests" FOR UPDATE TO "authenticated" USING (("receiver_id" = "auth"."uid"()));



CREATE POLICY "Self or admin/super_admin can read users" ON "public"."users" FOR SELECT USING ((("auth"."uid"() = "id") OR ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))));



CREATE POLICY "Sender can cancel friend request" ON "public"."friend_requests" FOR DELETE TO "authenticated" USING ((("sender_id" = "auth"."uid"()) OR ("receiver_id" = "auth"."uid"())));



CREATE POLICY "Update for non guest" ON "public"."gym_template_exercises" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "User can delete own friendships" ON "public"."friends" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "user1_id") OR ("auth"."uid"() = "user2_id")));



CREATE POLICY "Users can insert messages if in conversation" ON "public"."chat_messages" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."chat_conversation_participants"
  WHERE (("chat_conversation_participants"."conversation_id" = "chat_messages"."conversation_id") AND ("chat_conversation_participants"."user_id" = "auth"."uid"())))) AND ("sender_id" = "auth"."uid"())));



CREATE POLICY "Users can see their conversations" ON "public"."chat_conversations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."chat_conversation_participants"
  WHERE (("chat_conversation_participants"."conversation_id" = "chat_conversations"."id") AND ("chat_conversation_participants"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can send friend request" ON "public"."friend_requests" FOR INSERT TO "authenticated" WITH CHECK (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own firend request" ON "public"."friend_requests" FOR SELECT TO "authenticated" USING ((("sender_id" = "auth"."uid"()) OR ("receiver_id" = "auth"."uid"())));



CREATE POLICY "Users can view their own message statuses" ON "public"."chat_message_status" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_gps_points" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "allow admis to update" ON "public"."analytics_counts" FOR UPDATE TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))) WITH CHECK (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "allow everything for auth user" ON "public"."local_reminders" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "allow insert for admins, users own exercises" ON "public"."activities" FOR INSERT TO "authenticated" WITH CHECK ((((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "allow insert for admins, users own exercises" ON "public"."gym_exercises" FOR INSERT TO "authenticated" WITH CHECK ((((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "allow read " ON "public"."analytics_counts" FOR SELECT TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "allow select for admins, user own and public" ON "public"."activities" FOR SELECT TO "authenticated" USING ((("user_id" IS NULL) OR (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR ("user_id" = "auth"."uid"()))));



CREATE POLICY "allow select for admins, user own and public" ON "public"."gym_exercises" FOR SELECT TO "authenticated" USING ((("user_id" IS NULL) OR (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR ("user_id" = "auth"."uid"()))));



CREATE POLICY "allow self or admin/super_admin delete user" ON "public"."users" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "id") OR ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))));



CREATE POLICY "allow self or admin/super_admin update users" ON "public"."users" FOR UPDATE USING ((("auth"."uid"() = "id") OR ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))) WITH CHECK ((("auth"."uid"() = "id") OR ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))));



CREATE POLICY "allow user to CRUD own items." ON "public"."feed_items" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "allow user to CRUD own records" ON "public"."sessions_voice" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "allow user to CRUD own steps" ON "public"."steps_daily" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "allow user to delete own categories" ON "public"."activity_categories" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "allow user to handle own sessions" ON "public"."sessions" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "allow user to insert" ON "public"."user_settings" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "allow user to insert categories" ON "public"."activity_categories" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "allow user to read categories" ON "public"."activity_categories" FOR SELECT TO "authenticated" USING ((("user_id" IS NULL) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "allow user to update" ON "public"."user_settings" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "allow user to update own categories " ON "public"."activity_categories" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."analytics_counts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_conversation_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_message_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete for auth users" ON "public"."notes" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_non_guest_only" ON "public"."disc_golf_session_scores" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "user_id") AND ("auth"."email"() <> 'guest@example.com'::"text")));



ALTER TABLE "public"."disc_golf_session_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feed_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."friend_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."friends" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."global_reminders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gym_exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gym_exercises_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gym_session_exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gym_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gym_sets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gym_template_exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gym_template_sets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gym_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert for auth users" ON "public"."gym_template_sets" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert for auth users" ON "public"."notes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert gps points into own session" ON "public"."activity_gps_points" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."sessions" "s"
  WHERE (("s"."id" = "activity_gps_points"."session_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "insert_non_guest_only" ON "public"."disc_golf_session_scores" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") AND ("auth"."email"() <> 'guest@example.com'::"text")));



ALTER TABLE "public"."local_reminders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notes_voice" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pinned_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read own gps points" ON "public"."activity_gps_points" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."sessions" "s"
  WHERE (("s"."id" = "activity_gps_points"."session_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "read_sender_info_for_friends" ON "public"."users" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "select for auth users" ON "public"."gym_template_sets" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."session_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sessions_voice" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."steps_daily" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."timers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."todo_lists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."todo_tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update for auth users" ON "public"."gym_template_sets" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update for auth users" ON "public"."notes" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "update_non_guest_only" ON "public"."disc_golf_session_scores" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "user_id") AND ("auth"."email"() <> 'guest@example.com'::"text"))) WITH CHECK ((("auth"."uid"() = "user_id") AND ("auth"."email"() <> 'guest@example.com'::"text")));



CREATE POLICY "user can insert " ON "public"."session_stats" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."sessions" "s"
  WHERE (("s"."id" = "session_stats"."session_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "user can read their own stats" ON "public"."session_stats" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."sessions" "s"
  WHERE (("s"."id" = "session_stats"."session_id") AND ("s"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."user_push_mobile_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_push_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."weight" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";








GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."activities_compute_session_stats"("p_session_id" "uuid", "p_steps" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."activities_compute_session_stats"("p_session_id" "uuid", "p_steps" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."activities_compute_session_stats"("p_session_id" "uuid", "p_steps" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."activities_get_full_session"("p_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."activities_get_full_session"("p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."activities_get_full_session"("p_session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."activities_get_templates"() TO "anon";
GRANT ALL ON FUNCTION "public"."activities_get_templates"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."activities_get_templates"() TO "service_role";



GRANT ALL ON FUNCTION "public"."activities_save_activity"("p_title" "text", "p_notes" "text", "p_duration" integer, "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_track" "jsonb", "p_activity_id" "uuid", "p_steps" integer, "p_draftrecordings" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."activities_save_activity"("p_title" "text", "p_notes" "text", "p_duration" integer, "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_track" "jsonb", "p_activity_id" "uuid", "p_steps" integer, "p_draftrecordings" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."activities_save_activity"("p_title" "text", "p_notes" "text", "p_duration" integer, "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone, "p_track" "jsonb", "p_activity_id" "uuid", "p_steps" integer, "p_draftrecordings" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."activities_save_template"("p_name" "text", "p_notes" "text", "p_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."activities_save_template"("p_name" "text", "p_notes" "text", "p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."activities_save_template"("p_name" "text", "p_notes" "text", "p_session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."activities_set_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."activities_set_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."activities_set_slug"() TO "service_role";



GRANT ALL ON TABLE "public"."feed_items" TO "anon";
GRANT ALL ON TABLE "public"."feed_items" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_items" TO "service_role";



GRANT ALL ON FUNCTION "public"."activity_edit_session"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_activity_id" "uuid", "p_updated_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."activity_edit_session"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_activity_id" "uuid", "p_updated_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."activity_edit_session"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_activity_id" "uuid", "p_updated_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_user_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_user_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_user_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."feed_delete_session"("p_id" "uuid", "p_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."feed_delete_session"("p_id" "uuid", "p_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."feed_delete_session"("p_id" "uuid", "p_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_feed_sorted"("p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_feed_sorted"("p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_feed_sorted"("p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_jwt"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_jwt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_jwt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."gym_edit_session"("p_exercises" "jsonb", "p_notes" "text", "p_duration" integer, "p_title" "text", "p_id" "uuid", "p_updated_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."gym_edit_session"("p_exercises" "jsonb", "p_notes" "text", "p_duration" integer, "p_title" "text", "p_id" "uuid", "p_updated_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gym_edit_session"("p_exercises" "jsonb", "p_notes" "text", "p_duration" integer, "p_title" "text", "p_id" "uuid", "p_updated_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."gym_edit_template"("p_id" "uuid", "p_exercises" "jsonb", "p_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."gym_edit_template"("p_id" "uuid", "p_exercises" "jsonb", "p_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gym_edit_template"("p_id" "uuid", "p_exercises" "jsonb", "p_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."gym_latest_history_per_exercise"("exercise_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."gym_latest_history_per_exercise"("exercise_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gym_latest_history_per_exercise"("exercise_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."gym_save_session"("p_exercises" "jsonb", "p_notes" "text", "p_duration" integer, "p_title" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."gym_save_session"("p_exercises" "jsonb", "p_notes" "text", "p_duration" integer, "p_title" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gym_save_session"("p_exercises" "jsonb", "p_notes" "text", "p_duration" integer, "p_title" "text", "p_start_time" timestamp with time zone, "p_end_time" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."gym_save_template"("p_exercises" "jsonb", "p_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."gym_save_template"("p_exercises" "jsonb", "p_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gym_save_template"("p_exercises" "jsonb", "p_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_user_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_user_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_user_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."last_30d_analytics"() TO "anon";
GRANT ALL ON FUNCTION "public"."last_30d_analytics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."last_30d_analytics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notes_edit_note"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_updated_at" timestamp with time zone, "p_deleted_recording_ids" "uuid"[], "p_new_recordings" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."notes_edit_note"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_updated_at" timestamp with time zone, "p_deleted_recording_ids" "uuid"[], "p_new_recordings" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notes_edit_note"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_updated_at" timestamp with time zone, "p_deleted_recording_ids" "uuid"[], "p_new_recordings" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."notes_save_note"("p_title" "text", "p_notes" "text", "p_draftrecordings" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."notes_save_note"("p_title" "text", "p_notes" "text", "p_draftrecordings" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notes_save_note"("p_title" "text", "p_notes" "text", "p_draftrecordings" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."reminders_delete_global_reminder"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reminders_delete_global_reminder"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reminders_delete_global_reminder"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reminders_delete_local_reminder"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reminders_delete_local_reminder"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reminders_delete_local_reminder"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reminders_edit_global_reminder"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_notify_at" timestamp with time zone, "p_seen_at" timestamp with time zone, "p_delivered" boolean, "p_updated_at" timestamp with time zone, "p_mode" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reminders_edit_global_reminder"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_notify_at" timestamp with time zone, "p_seen_at" timestamp with time zone, "p_delivered" boolean, "p_updated_at" timestamp with time zone, "p_mode" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reminders_edit_global_reminder"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_notify_at" timestamp with time zone, "p_seen_at" timestamp with time zone, "p_delivered" boolean, "p_updated_at" timestamp with time zone, "p_mode" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reminders_edit_local_reminder"("p_id" "uuid", "p_title" "text", "p_type" "text", "p_updated_at" timestamp with time zone, "p_mode" "text", "p_notes" "text", "p_notify_at_time" time without time zone, "p_notify_date" timestamp with time zone, "p_weekdays" "json", "p_seen_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."reminders_edit_local_reminder"("p_id" "uuid", "p_title" "text", "p_type" "text", "p_updated_at" timestamp with time zone, "p_mode" "text", "p_notes" "text", "p_notify_at_time" time without time zone, "p_notify_date" timestamp with time zone, "p_weekdays" "json", "p_seen_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reminders_edit_local_reminder"("p_id" "uuid", "p_title" "text", "p_type" "text", "p_updated_at" timestamp with time zone, "p_mode" "text", "p_notes" "text", "p_notify_at_time" time without time zone, "p_notify_date" timestamp with time zone, "p_weekdays" "json", "p_seen_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."reminders_get_by_tab"("p_tab" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reminders_get_by_tab"("p_tab" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reminders_get_by_tab"("p_tab" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reminders_save_global_reminder"("p_title" "text", "p_notes" "text", "p_notify_at" timestamp with time zone, "p_type" "text", "p_created_from_device_id" "text", "p_mode" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reminders_save_global_reminder"("p_title" "text", "p_notes" "text", "p_notify_at" timestamp with time zone, "p_type" "text", "p_created_from_device_id" "text", "p_mode" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reminders_save_global_reminder"("p_title" "text", "p_notes" "text", "p_notify_at" timestamp with time zone, "p_type" "text", "p_created_from_device_id" "text", "p_mode" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reminders_save_local_reminder"("p_title" "text", "p_type" "text", "p_mode" "text", "p_notes" "text", "p_notify_at_time" time without time zone, "p_notify_date" timestamp with time zone, "p_weekdays" "json") TO "anon";
GRANT ALL ON FUNCTION "public"."reminders_save_local_reminder"("p_title" "text", "p_type" "text", "p_mode" "text", "p_notes" "text", "p_notify_at_time" time without time zone, "p_notify_date" timestamp with time zone, "p_weekdays" "json") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reminders_save_local_reminder"("p_title" "text", "p_type" "text", "p_mode" "text", "p_notes" "text", "p_notify_at_time" time without time zone, "p_notify_date" timestamp with time zone, "p_weekdays" "json") TO "service_role";



GRANT ALL ON FUNCTION "public"."todo_check_todo"("p_list_id" "uuid", "p_todo_tasks" "jsonb", "p_updated_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."todo_check_todo"("p_list_id" "uuid", "p_todo_tasks" "jsonb", "p_updated_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."todo_check_todo"("p_list_id" "uuid", "p_todo_tasks" "jsonb", "p_updated_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."todo_edit_todo"("p_id" "uuid", "p_title" "text", "p_tasks" "jsonb", "p_deleted_ids" "uuid"[], "p_updated_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."todo_edit_todo"("p_id" "uuid", "p_title" "text", "p_tasks" "jsonb", "p_deleted_ids" "uuid"[], "p_updated_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."todo_edit_todo"("p_id" "uuid", "p_title" "text", "p_tasks" "jsonb", "p_deleted_ids" "uuid"[], "p_updated_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."todo_save_todo"("p_title" "text", "p_todo_list" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."todo_save_todo"("p_title" "text", "p_todo_list" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."todo_save_todo"("p_title" "text", "p_todo_list" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."weight_edit_weight"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_weight" numeric, "p_updated_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."weight_edit_weight"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_weight" numeric, "p_updated_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."weight_edit_weight"("p_id" "uuid", "p_title" "text", "p_notes" "text", "p_weight" numeric, "p_updated_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."weight_save_weight"("p_title" "text", "p_notes" "text", "p_weight" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."weight_save_weight"("p_title" "text", "p_notes" "text", "p_weight" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."weight_save_weight"("p_title" "text", "p_notes" "text", "p_weight" numeric) TO "service_role";























































































GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."activity_categories" TO "anon";
GRANT ALL ON TABLE "public"."activity_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_categories" TO "service_role";



GRANT ALL ON TABLE "public"."activity_gps_points" TO "anon";
GRANT ALL ON TABLE "public"."activity_gps_points" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_gps_points" TO "service_role";



GRANT ALL ON TABLE "public"."activity_templates" TO "anon";
GRANT ALL ON TABLE "public"."activity_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_templates" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_counts" TO "anon";
GRANT ALL ON TABLE "public"."analytics_counts" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_counts" TO "service_role";



GRANT ALL ON TABLE "public"."chat_conversation_participants" TO "anon";
GRANT ALL ON TABLE "public"."chat_conversation_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_conversation_participants" TO "service_role";



GRANT ALL ON TABLE "public"."chat_conversations" TO "anon";
GRANT ALL ON TABLE "public"."chat_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."chat_message_status" TO "anon";
GRANT ALL ON TABLE "public"."chat_message_status" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_message_status" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."debug_session" TO "anon";
GRANT ALL ON TABLE "public"."debug_session" TO "authenticated";
GRANT ALL ON TABLE "public"."debug_session" TO "service_role";



GRANT ALL ON TABLE "public"."disc_golf_course_holes" TO "authenticated";
GRANT ALL ON TABLE "public"."disc_golf_course_holes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."disc_golf_course_holes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."disc_golf_course_holes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."disc_golf_course_holes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."disc_golf_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."disc_golf_courses" TO "service_role";



GRANT ALL ON TABLE "public"."disc_golf_session_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."disc_golf_session_scores" TO "service_role";



GRANT ALL ON SEQUENCE "public"."disc_golf_session_scores_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."disc_golf_session_scores_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."disc_golf_session_scores_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."disc_golf_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."disc_golf_sessions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."disc_golf_sessions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."disc_golf_sessions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."disc_golf_sessions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."friend_requests" TO "anon";
GRANT ALL ON TABLE "public"."friend_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."friend_requests" TO "service_role";



GRANT ALL ON TABLE "public"."friends" TO "anon";
GRANT ALL ON TABLE "public"."friends" TO "authenticated";
GRANT ALL ON TABLE "public"."friends" TO "service_role";



GRANT ALL ON TABLE "public"."global_reminders" TO "anon";
GRANT ALL ON TABLE "public"."global_reminders" TO "authenticated";
GRANT ALL ON TABLE "public"."global_reminders" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."gym_exercises" TO "authenticated";



GRANT ALL ON TABLE "public"."gym_exercises_translations" TO "anon";
GRANT ALL ON TABLE "public"."gym_exercises_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."gym_exercises_translations" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."gym_session_exercises" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."gym_sessions" TO "authenticated";



GRANT ALL ON TABLE "public"."gym_sessions_backup" TO "anon";
GRANT ALL ON TABLE "public"."gym_sessions_backup" TO "authenticated";
GRANT ALL ON TABLE "public"."gym_sessions_backup" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."gym_sets" TO "authenticated";



GRANT ALL ON TABLE "public"."gym_template_exercises" TO "anon";
GRANT ALL ON TABLE "public"."gym_template_exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."gym_template_exercises" TO "service_role";



GRANT ALL ON TABLE "public"."gym_template_sets" TO "anon";
GRANT ALL ON TABLE "public"."gym_template_sets" TO "authenticated";
GRANT ALL ON TABLE "public"."gym_template_sets" TO "service_role";



GRANT ALL ON TABLE "public"."gym_templates" TO "anon";
GRANT ALL ON TABLE "public"."gym_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."gym_templates" TO "service_role";



GRANT ALL ON TABLE "public"."local_reminders" TO "anon";
GRANT ALL ON TABLE "public"."local_reminders" TO "authenticated";
GRANT ALL ON TABLE "public"."local_reminders" TO "service_role";



GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT ALL ON TABLE "public"."notes_voice" TO "anon";
GRANT ALL ON TABLE "public"."notes_voice" TO "authenticated";
GRANT ALL ON TABLE "public"."notes_voice" TO "service_role";



GRANT ALL ON TABLE "public"."pinned_items" TO "authenticated";
GRANT ALL ON TABLE "public"."pinned_items" TO "service_role";



GRANT ALL ON TABLE "public"."players" TO "authenticated";
GRANT ALL ON TABLE "public"."players" TO "service_role";



GRANT ALL ON SEQUENCE "public"."players_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."players_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."players_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."session_stats" TO "anon";
GRANT ALL ON TABLE "public"."session_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."session_stats" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."sessions_voice" TO "anon";
GRANT ALL ON TABLE "public"."sessions_voice" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions_voice" TO "service_role";



GRANT ALL ON TABLE "public"."steps_daily" TO "anon";
GRANT ALL ON TABLE "public"."steps_daily" TO "authenticated";
GRANT ALL ON TABLE "public"."steps_daily" TO "service_role";



GRANT ALL ON TABLE "public"."timers" TO "anon";
GRANT ALL ON TABLE "public"."timers" TO "authenticated";
GRANT ALL ON TABLE "public"."timers" TO "service_role";



GRANT ALL ON TABLE "public"."todo_lists" TO "anon";
GRANT ALL ON TABLE "public"."todo_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."todo_lists" TO "service_role";



GRANT ALL ON TABLE "public"."todo_tasks" TO "anon";
GRANT ALL ON TABLE "public"."todo_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."todo_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."user_push_mobile_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."user_push_mobile_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_push_mobile_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."user_push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."user_push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_push_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."weight" TO "anon";
GRANT ALL ON TABLE "public"."weight" TO "authenticated";
GRANT ALL ON TABLE "public"."weight" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























