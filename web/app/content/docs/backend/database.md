# Database Schema

PostgreSQL database with **Row Level Security** enabled on all tables. Every table uses `auth.uid()` to scope data per user.

## Tables by Feature

### Feed System

The feed is the central data aggregation layer. All session types (activities, gym, notes, weight, reminders, todos) create a row in `feed_items`.

- **`feed_items`** — Unified feed with type-based polymorphism
  - `id`, `user_id`, `title`, `type`, `extra_fields` (JSONB), `source_id`, `occurred_at`, `updated_at`, `activity_at` (computed), `created_at`

### Activities

- **`activities`** — Activity type definitions (running, walking, cycling, etc.)
- **`activity_categories`** — Exercise categories
- **`activity_gps_points`** — GPS tracking data (latitude, longitude, accuracy, altitude, is_stationary)
- **`activity_templates`** — Saved activity routes with PostGIS geometry
- **`sessions`** — Activity sessions (title, notes, dates)
- **`session_stats`** — Computed stats (distance, moving_time, calories, etc.)
- **`sessions_voice`** — Voice recordings attached to sessions
- **`steps_daily`** — Daily step counts

### Gym

- **`gym_exercises`** — Exercise definitions
- **`gym_exercises_translations`** — Multilingual exercise names
- **`gym_sessions`** — Workout sessions
- **`gym_session_exercises`** — Junction table for exercises in sessions
- **`gym_sets`** — Individual sets (weight, reps, etc.)
- **`gym_templates`** — Saved workout templates
- **`gym_template_exercises`** — Template exercises
- **`gym_template_sets`** — Template sets

### Notes

- **`notes`** — Note content with optional folder
- **`notes_voice`** — Voice recordings attached to notes
- **`note_folders`** — Folder organization (unique per user)

### Reminders

- **`global_reminders`** — Synced across devices
- **`local_reminders`** — Device-only with recurring support

### Todos

- **`todo_lists`** — Todo lists
- **`todo_tasks`** — Individual tasks

### Weight

- **`weight`** — Weight entries with notes

### Social

- **`friends`** — Friend relationships
- **`friend_requests`** — Pending requests

### Chat

- **`chat_conversations`** — Conversation threads
- **`chat_conversation_participants`** — Participants
- **`chat_messages`** — Message content
- **`chat_message_status`** — Read/delivered tracking

### System

- **`users`** — Created automatically via trigger on `auth.users`
- **`user_settings`** — User preferences
- **`user_push_subscriptions`** — Web push tokens
- **`user_push_mobile_subscriptions`** — Mobile push tokens
- **`pinned_items`** — Pinned feed items (scoped to global or folder context)
- **`analytics_counts`** — Analytics aggregation

---

## Row Level Security

All tables enforce RLS with `auth.uid()`:

- Users can only **SELECT**, **INSERT**, **UPDATE**, and **DELETE** their own rows
- Foreign keys cascade on delete
- `note_folders` has a UNIQUE constraint on `(user_id, name)`

---

## Extensions

- **`postgis`** — Geographic data for activity routes
- **`pgcrypto`** — Cryptographic functions
- **`pgjwt`** — JWT handling
- **`uuid-ossp`** — UUID generation
- **`pg_cron`** — Scheduled tasks
- **`pg_net`** — HTTP requests from the database
- **`pg_stat_statements`** — Query performance monitoring