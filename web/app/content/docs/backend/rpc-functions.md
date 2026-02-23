# RPC Functions

All data mutations go through PostgreSQL `plpgsql` functions called via `supabase.rpc()`. This keeps business logic on the server and ensures atomicity (e.g. creating a session + feed item + stats in one transaction).

## Activities

- **`activities_save_activity`** `(title, notes, duration, start_time, end_time, track, activity_id, steps, draftrecordings)` → `uuid`
  Saves a new activity session, GPS points, stats, voice recordings, and feed item.

- **`activities_compute_session_stats`** `(session_id, steps)` → `void`
  Recomputes distance, moving time, calories, etc. from GPS points.

- **`activities_get_full_session`** `(session_id)` → `JSONB`
  Returns the complete session with stats and GPS data.

- **`activities_get_templates`** `()` → `JSONB`
  Returns all saved activity route templates.

- **`activities_save_template`** `(name, notes, session_id)` → `uuid`
  Saves a session as a reusable route template.

- **`activity_edit_session`** `(id, title, notes, activity_id, updated_at)` → `feed_items`
  Updates an existing activity session.

## Gym

- **`gym_save_session`** `(exercises, notes, duration, title, start_time, end_time)` → `uuid`
  Saves a new gym session with all exercises and sets.

- **`gym_edit_session`** `(exercises, notes, duration, title, id, updated_at)` → `feed_items`
  Updates an existing gym session.

- **`gym_save_template`** `(exercises, name)` → `uuid`
  Saves a workout as a reusable template.

- **`gym_edit_template`** `(id, exercises, name)` → `uuid`
  Updates an existing template.

- **`gym_latest_history_per_exercise`** `(exercise_ids)` → `TABLE`
  Returns the most recent session data for the given exercises (used for "last time" display).

## Notes

- **`notes_save_note`** `(title, notes, draftrecordings, folder_id)` → `uuid`
  Creates a new note with optional voice recordings and folder.

- **`notes_edit_note`** `(id, title, notes, updated_at, deleted_recording_ids, new_recordings, folder_id)` → `feed_items`
  Updates a note, manages voice recordings, and moves between folders.

- **`notes_get_by_folder`** `(folder_id, unfiled_only, limit, offset)` → `SETOF feed_items`
  Returns notes filtered by folder or unfiled status.

- **`notes_move_to_folder`** `(note_id, folder_id)` → `void`
  Moves a note to a different folder. Cleans up folder-scoped pins automatically.

## Reminders

- **`reminders_save_global_reminder`** `(title, notes, notify_at, type, created_from_device_id, mode)` → `uuid`
  Creates a reminder that syncs across all devices.

- **`reminders_save_local_reminder`** `(title, type, mode, notes, notify_at_time, notify_date, weekdays)` → `uuid`
  Creates a device-only reminder with optional recurring schedule.

- **`reminders_edit_global_reminder`** `(id, title, notes, notify_at, seen_at, delivered, updated_at, mode)` → `feed_items`
  Updates a global reminder.

- **`reminders_edit_local_reminder`** `(id, title, type, updated_at, mode, notes, notify_at_time, notify_date, weekdays, seen_at)` → `feed_items`
  Updates a local reminder.

- **`reminders_delete_global_reminder`** `(id)` → `void`
- **`reminders_delete_local_reminder`** `(id)` → `void`

- **`reminders_get_by_tab`** `(tab)` → `TABLE`
  Returns reminders filtered by tab (upcoming, past, etc.).

## Todos

- **`todo_save_todo`** `(title, todo_list)` → `uuid`
  Creates a new todo list with tasks.

- **`todo_edit_todo`** `(id, title, tasks, deleted_ids, updated_at)` → `feed_items`
  Updates a todo list, adds/removes tasks.

- **`todo_check_todo`** `(list_id, todo_tasks, updated_at)` → `feed_items`
  Toggles task completion status.

## Weight

- **`weight_save_weight`** `(title, notes, weight)` → `uuid`
  Records a new weight entry.

- **`weight_edit_weight`** `(id, title, notes, weight, updated_at)` → `feed_items`
  Updates a weight entry.

## Feed

- **`get_feed_sorted`** `(limit, offset)` → `TABLE`
  Returns feed items sorted by `activity_at` (computed from `occurred_at` or `updated_at`).

- **`feed_delete_session`** `(id, type)` → `void`
  Deletes a feed item and cascades to related tables and pinned items.

## Utility

- **`get_jwt`** `()` → `JSON`
  Returns the current JWT claims.

- **`handle_new_user`** — Trigger function
  Automatically creates a `user_settings` row when a new user signs up.

- **`last_30d_analytics`** `()` → `JSONB`
  Returns aggregated analytics for the last 30 days.