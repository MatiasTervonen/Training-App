# Chat Next Features: Extended Sharing & Workout Challenges

## Overview

Two-phase feature expansion for chat that turns it from a messaging tool into the social backbone of the app. **Phase 1** extends content sharing so every trackable feature can be sent as an interactive card in chat (currently only gym and activity sessions). **Phase 2** adds workout challenges — friends can challenge each other to training goals with live progress tracked in conversation.

Together these phases connect every existing feature to the chat system, giving users a reason to message beyond casual conversation.

---

## Phase 1: Extended Content Sharing in Chat

### Overview

Currently only gym sessions and activity sessions can be shared as interactive `session_share` cards in chat. Weight, habits, notes, todo lists, reports, and step achievements all have share card components (`WeightShareCard`, `HabitShareCard`, etc.) but can only be saved/shared as flat PNG images — they cannot be sent as tappable rich cards in chat.

This phase adds 5 new message types so every shareable feature gets the same interactive card treatment that gym/activity sessions already have.

---

### Design Decisions

#### One message type per content domain (not a generic "content_share")

Each content type gets its own `message_type` value (`weight_share`, `habit_share`, etc.) instead of overloading `session_share` or using a generic `content_share` with a sub-type field.

**Why:** The chat bubble renderer switches on `message_type` to pick the right card component. Separate types keep the switch clean and let each card component own its own data shape. The RPC authorization also differs per type (different source tables, different permission checks).

#### Card renders from embedded JSON (same pattern as session_share)

Each share message stores preview data in the `content` JSON field — enough to render the card without an API call. Tapping the card fetches the full data for an expanded view.

**Why:** Proven pattern from `ChatSessionCard`. Messages load instantly even when paginating through old history.

#### Read-only expanded views reuse existing detail components

When a user taps a shared weight/habit/note/todo/report card, it opens the same detail view used elsewhere in the app but in read-only mode — same approach as `ChatSessionCard` opening a read-only gym session.

#### No share cards for reminders or timers

Reminders and timers are personal scheduling tools, not training content. They don't have meaningful data to share as a card. Excluded by design, same reasoning as the social feed spec.

---

### New message types

Update `MessageType` in `types/chat.ts`:

```typescript
export type MessageType =
  | "text"
  | "image"
  | "video"
  | "voice"
  | "session_share"
  | "location"
  | "weight_share"      // NEW
  | "habit_share"       // NEW
  | "note_share"        // NEW
  | "todo_share"        // NEW
  | "report_share";     // NEW
```

---

### Content JSON structures

#### 1. Weight Share (`weight_share`)

```json
{
  "weight_id": "uuid",
  "weight_value": 82.5,
  "unit": "kg",
  "date": "2026-03-21",
  "change": -0.5,
  "change_period": "week",
  "note": "Feeling lean"
}
```

**Card preview:**
```
+----------------------------------+
|  [Scale icon]  Weight Log        |  ← type badge
|                                  |
|       82.5 kg                    |  ← big number (AppText)
|    ▼ 0.5 kg this week            |  ← change indicator (green/red arrow)
|                                  |
|  Mar 21, 2026                    |  ← date
|  Tap to view details →           |
+----------------------------------+
```

**Tap action:** Opens weight detail view (read-only). Shows the weight entry with any attached media/notes.

**Authorization RPC:** `get_friend_weight_by_chat(p_weight_id UUID, p_conversation_id UUID)` — verifies sender is a participant in the conversation, then returns the weight row.

---

#### 2. Habit Share (`habit_share`)

```json
{
  "habit_id": "uuid",
  "habit_name": "Morning Stretch",
  "habit_type": "manual",
  "current_streak": 14,
  "longest_streak": 30,
  "completion_rate": 87,
  "total_completions": 142
}
```

**Card preview:**
```
+----------------------------------+
|  [Flame icon]  Habit             |  ← type badge
|                                  |
|  Morning Stretch                 |  ← habit name (AppText)
|                                  |
|  🔥 14 day streak               |  ← current streak (highlighted)
|  Best: 30  •  Rate: 87%         |  ← secondary stats
|                                  |
|  Tap to view details →           |
+----------------------------------+
```

**Tap action:** Opens a read-only habit detail view showing the habit's calendar grid, streak stats, and completion history — same data as the habit detail page but without edit/delete controls.

**Authorization RPC:** `get_friend_habit_by_chat(p_habit_id UUID, p_conversation_id UUID)` — verifies participation, returns habit row + aggregated stats.

---

#### 3. Note Share (`note_share`)

```json
{
  "note_id": "uuid",
  "title": "Meal Prep Ideas",
  "excerpt": "High protein options for the week...",
  "has_media": true,
  "media_count": 2,
  "folder_name": "Nutrition"
}
```

**Card preview:**
```
+----------------------------------+
|  [FileText icon]  Note           |  ← type badge
|                                  |
|  Meal Prep Ideas                 |  ← title (AppText)
|  High protein options for the    |  ← excerpt (BodyText, 2 lines max)
|  week...                         |
|                                  |
|  📎 2 attachments  •  Nutrition  |  ← metadata
|  Tap to view details →           |
+----------------------------------+
```

**Tap action:** Opens a read-only note view showing title, full content, folder, and all attached media (images, voice recordings, videos).

**Authorization RPC:** `get_friend_note_by_chat(p_note_id UUID, p_conversation_id UUID)` — verifies participation, returns note + media paths.

---

#### 4. Todo Share (`todo_share`)

```json
{
  "todo_list_id": "uuid",
  "title": "Leg Day Checklist",
  "total_tasks": 8,
  "completed_tasks": 5,
  "task_previews": ["Squats 5x5", "Leg press 4x12", "Romanian DL"]
}
```

**Card preview:**
```
+----------------------------------+
|  [CheckSquare icon]  Todo List   |  ← type badge
|                                  |
|  Leg Day Checklist               |  ← title (AppText)
|                                  |
|  ✓ Squats 5x5                   |  ← first 3 tasks (BodyText)
|  ✓ Leg press 4x12               |
|  ○ Romanian DL                   |
|                                  |
|  5/8 completed                   |  ← progress
|  Tap to view details →           |
+----------------------------------+
```

**Tap action:** Opens a read-only todo list view showing all tasks with completion status and any task notes/media.

**Authorization RPC:** `get_friend_todo_by_chat(p_todo_list_id UUID, p_conversation_id UUID)` — verifies participation, returns todo list + tasks.

---

#### 5. Report Share (`report_share`)

```json
{
  "report_id": "uuid",
  "report_name": "Weekly Summary",
  "period_type": "weekly",
  "period_start": "2026-03-14",
  "period_end": "2026-03-21",
  "features": ["gym", "activities", "habits"],
  "highlights": {
    "gym_sessions": 4,
    "activity_sessions": 3,
    "habit_completion_rate": 92
  }
}
```

**Card preview:**
```
+----------------------------------+
|  [BarChart icon]  Report         |  ← type badge
|                                  |
|  Weekly Summary                  |  ← report name (AppText)
|  Mar 14 – Mar 21                 |  ← period range
|                                  |
|  Gym: 4 sessions                 |  ← highlights (BodyText)
|  Activities: 3 sessions          |
|  Habits: 92% rate                |
|                                  |
|  Tap to view details →           |
+----------------------------------+
```

**Tap action:** Opens a read-only report view showing the full report with all feature sections, comparisons to previous period, and stats.

**Authorization RPC:** `get_friend_report_by_chat(p_report_id UUID, p_conversation_id UUID)` — verifies participation, returns report + generated data.

---

### Database Migration

Migration: `supabase/migrations/YYYYMMDDHHmmss_chat_extended_sharing.sql`

No schema changes to `chat_messages` needed — the existing `content` TEXT column and `message_type` TEXT column already support new values. We just need authorization RPCs.

```sql
-- =============================================
-- Authorization RPCs for shared content in chat
-- =============================================
-- Pattern: verify the sender of the message is a participant in the conversation,
-- then return the source data. This lets friends view each other's data
-- ONLY when it was explicitly shared via chat.

-- Weight
DROP FUNCTION IF EXISTS get_friend_weight_by_chat(UUID, UUID);
CREATE FUNCTION get_friend_weight_by_chat(
  p_weight_id UUID,
  p_conversation_id UUID
)
RETURNS SETOF weight
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Verify caller is a participant
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a participant in this conversation';
  END IF;

  -- Verify the weight was shared in this conversation
  IF NOT EXISTS (
    SELECT 1 FROM chat_messages
    WHERE conversation_id = p_conversation_id
      AND message_type = 'weight_share'
      AND content::jsonb ->> 'weight_id' = p_weight_id::text
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Weight entry not shared in this conversation';
  END IF;

  RETURN QUERY
  SELECT * FROM weight WHERE id = p_weight_id;
END;
$$;

-- Habit (returns habit row + computed stats)
DROP FUNCTION IF EXISTS get_friend_habit_by_chat(UUID, UUID);
CREATE FUNCTION get_friend_habit_by_chat(
  p_habit_id UUID,
  p_conversation_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  habit_type TEXT,
  frequency TEXT,
  target_days INTEGER[],
  step_target INTEGER,
  duration_target INTEGER,
  created_at TIMESTAMPTZ,
  current_streak INTEGER,
  longest_streak INTEGER,
  completion_rate NUMERIC,
  total_completions BIGINT
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Verify caller is a participant
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a participant in this conversation';
  END IF;

  -- Verify the habit was shared in this conversation
  IF NOT EXISTS (
    SELECT 1 FROM chat_messages
    WHERE conversation_id = p_conversation_id
      AND message_type = 'habit_share'
      AND content::jsonb ->> 'habit_id' = p_habit_id::text
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Habit not shared in this conversation';
  END IF;

  -- Return habit with computed stats
  -- (exact stat computation depends on existing habit_completions table structure;
  --  adapt column names to match actual schema)
  RETURN QUERY
  SELECT
    h.id, h.user_id, h.name, h.habit_type, h.frequency,
    h.target_days, h.step_target, h.duration_target, h.created_at,
    0 AS current_streak,      -- compute from habit_completions
    0 AS longest_streak,      -- compute from habit_completions
    0.0 AS completion_rate,   -- compute from habit_completions
    COUNT(hc.id) AS total_completions
  FROM habits h
  LEFT JOIN habit_completions hc ON hc.habit_id = h.id
  WHERE h.id = p_habit_id
  GROUP BY h.id;
END;
$$;

-- Note
DROP FUNCTION IF EXISTS get_friend_note_by_chat(UUID, UUID);
CREATE FUNCTION get_friend_note_by_chat(
  p_note_id UUID,
  p_conversation_id UUID
)
RETURNS SETOF notes
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a participant in this conversation';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM chat_messages
    WHERE conversation_id = p_conversation_id
      AND message_type = 'note_share'
      AND content::jsonb ->> 'note_id' = p_note_id::text
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Note not shared in this conversation';
  END IF;

  RETURN QUERY
  SELECT * FROM notes WHERE id = p_note_id;
END;
$$;

-- Todo list (returns list + tasks)
DROP FUNCTION IF EXISTS get_friend_todo_by_chat(UUID, UUID);
CREATE FUNCTION get_friend_todo_by_chat(
  p_todo_list_id UUID,
  p_conversation_id UUID
)
RETURNS TABLE (
  list_id UUID,
  list_title TEXT,
  list_created_at TIMESTAMPTZ,
  task_id UUID,
  task_title TEXT,
  task_notes TEXT,
  task_completed BOOLEAN,
  task_position INTEGER
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a participant in this conversation';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM chat_messages
    WHERE conversation_id = p_conversation_id
      AND message_type = 'todo_share'
      AND content::jsonb ->> 'todo_list_id' = p_todo_list_id::text
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Todo list not shared in this conversation';
  END IF;

  RETURN QUERY
  SELECT
    tl.id, tl.title, tl.created_at,
    t.id, t.title, t.notes, t.completed, t.position
  FROM todo_lists tl
  LEFT JOIN todo_tasks t ON t.list_id = tl.id
  WHERE tl.id = p_todo_list_id
  ORDER BY t.position;
END;
$$;

-- Report
DROP FUNCTION IF EXISTS get_friend_report_by_chat(UUID, UUID);
CREATE FUNCTION get_friend_report_by_chat(
  p_report_id UUID,
  p_conversation_id UUID
)
RETURNS SETOF reports
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a participant in this conversation';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM chat_messages
    WHERE conversation_id = p_conversation_id
      AND message_type = 'report_share'
      AND content::jsonb ->> 'report_id' = p_report_id::text
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Report not shared in this conversation';
  END IF;

  RETURN QUERY
  SELECT * FROM reports WHERE id = p_report_id;
END;
$$;
```

> **Note:** The exact table/column names (`weight`, `habits`, `habit_completions`, `notes`, `todo_lists`, `todo_tasks`, `reports`) must be verified against the actual schema. The pattern is consistent — adapt column names as needed.

---

### New Components

#### Chat card components (in `features/chat/components/`)

| Component | Message type | Renders |
|-----------|-------------|---------|
| `ChatWeightCard.tsx` | `weight_share` | Weight value, change arrow, date |
| `ChatHabitCard.tsx` | `habit_share` | Habit name, streak, rate |
| `ChatNoteCard.tsx` | `note_share` | Title, excerpt, attachment count |
| `ChatTodoCard.tsx` | `todo_share` | Title, task previews, progress bar |
| `ChatReportCard.tsx` | `report_share` | Report name, period, highlights |

All follow the same structure as `ChatSessionCard`:
- Fixed width container with gradient background
- Type badge icon + label at top
- Key data in the middle
- "Tap to view details →" at bottom
- `onPress` navigates to read-only detail view

#### Color scheme per card type

| Type | Gradient | Icon |
|------|----------|------|
| Gym session | Blue → Slate (existing) | Dumbbell |
| Activity session | Green → Slate (existing) | Activity |
| Weight | Purple → Slate | Scale |
| Habit | Orange → Slate | Flame |
| Note | Teal → Slate | FileText |
| Todo | Indigo → Slate | CheckSquare |
| Report | Amber → Slate | BarChart3 |

---

### Sending flow changes

#### Where users share content to chat

Each feature's detail/analytics view gets a "Send to Chat" option. The flow reuses `ShareModalShell` and `ShareTypePicker`:

| Feature | Share entry point | Image option | Interactive card option |
|---------|------------------|-------------|----------------------|
| Weight | Weight detail view (long-press or action menu) | WeightShareCard PNG | `weight_share` message |
| Habits | Habit detail view action menu | HabitShareCard PNG | `habit_share` message |
| Notes | Note detail view action menu | N/A (no share card exists for notes as PNG) | `note_share` message |
| Todos | Todo list detail view action menu | N/A | `todo_share` message |
| Reports | Report preview action menu | ReportShareCard PNG | `report_share` message |

For notes and todos that don't have PNG share cards, the `ShareTypePicker` step is skipped — tapping "Send to Chat" goes directly to the friend picker and sends as an interactive card.

#### New database functions (in `database/chat/`)

One function per content type, following the pattern of `send-session-share.ts`:

- `send-weight-share.ts` — builds `WeightShareContent`, calls `send_message` with `message_type: "weight_share"`
- `send-habit-share.ts` — builds `HabitShareContent`, calls `send_message` with `message_type: "habit_share"`
- `send-note-share.ts` — builds `NoteShareContent`, calls `send_message` with `message_type: "note_share"`
- `send-todo-share.ts` — builds `TodoShareContent`, calls `send_message` with `message_type: "todo_share"`
- `send-report-share.ts` — builds `ReportShareContent`, calls `send_message` with `message_type: "report_share"`

---

### Type definitions

Add to `types/chat.ts`:

```typescript
export type MessageType =
  | "text"
  | "image"
  | "video"
  | "voice"
  | "session_share"
  | "location"
  | "weight_share"
  | "habit_share"
  | "note_share"
  | "todo_share"
  | "report_share";

export type WeightShareContent = {
  weight_id: string;
  weight_value: number;
  unit: "kg" | "lbs";
  date: string;
  change: number | null;
  change_period: "week" | "month" | null;
  note: string | null;
};

export type HabitShareContent = {
  habit_id: string;
  habit_name: string;
  habit_type: "manual" | "steps" | "duration";
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
  total_completions: number;
};

export type NoteShareContent = {
  note_id: string;
  title: string;
  excerpt: string | null;
  has_media: boolean;
  media_count: number;
  folder_name: string | null;
};

export type TodoShareContent = {
  todo_list_id: string;
  title: string;
  total_tasks: number;
  completed_tasks: number;
  task_previews: string[];
};

export type ReportShareContent = {
  report_id: string;
  report_name: string;
  period_type: string;
  period_start: string;
  period_end: string;
  features: string[];
  highlights: Record<string, number>;
};
```

---

### Conversation list preview text

Update `ConversationItem` to show preview text for new message types:

| `last_message_type` | Preview text |
|---------------------|-------------|
| `weight_share` | "⚖️ Weight log" |
| `habit_share` | "🔥 Habit: {habit_name}" |
| `note_share` | "📝 Note: {title}" |
| `todo_share` | "✅ Todo: {title}" |
| `report_share` | "📊 Report: {report_name}" |

Parse `last_message_content` JSON to extract the name/title for the preview.

---

### Translations

Add to `locales/en/chat.json` and `locales/fi/chat.json`:

```json
{
  "mediaWeight": "Weight log",
  "mediaHabit": "Habit",
  "mediaNote": "Note",
  "mediaTodo": "Todo list",
  "mediaReport": "Report",
  "weightCard": {
    "title": "Weight Log",
    "change": "{{direction}} {{value}} {{unit}} this {{period}}"
  },
  "habitCard": {
    "title": "Habit",
    "streak": "{{count}} day streak",
    "best": "Best: {{count}}",
    "rate": "Rate: {{rate}}%"
  },
  "noteCard": {
    "title": "Note",
    "attachments": "{{count}} attachments"
  },
  "todoCard": {
    "title": "Todo List",
    "progress": "{{completed}}/{{total}} completed"
  },
  "reportCard": {
    "title": "Report",
    "sessions": "{{count}} sessions",
    "rate": "{{rate}}% rate"
  }
}
```

---

### ChatBubble rendering changes

In `ChatBubble.tsx`, extend the message type switch to render the new card components:

```typescript
case "weight_share":
  return <ChatWeightCard content={parsedContent} onPress={handleWeightPress} />;
case "habit_share":
  return <ChatHabitCard content={parsedContent} onPress={handleHabitPress} />;
case "note_share":
  return <ChatNoteCard content={parsedContent} onPress={handleNotePress} />;
case "todo_share":
  return <ChatTodoCard content={parsedContent} onPress={handleTodoPress} />;
case "report_share":
  return <ChatReportCard content={parsedContent} onPress={handleReportPress} />;
```

---

### Message actions for new types

| Action | Supported? | Notes |
|--------|-----------|-------|
| Reply | Yes | Shows type label in reply preview (same as session_share) |
| Copy | No | No meaningful text to copy |
| Forward | Yes | Forward the card to another conversation (same content JSON) |
| Delete | Yes | Standard soft delete |
| Reactions | Yes | Standard reactions on the bubble |

---

## Phase 2: Workout Challenges

### Overview

A challenge system built into chat conversations. Friends can challenge each other to training goals with progress tracked in real-time. Challenges appear as interactive cards in the conversation and update live as both participants train.

Challenges connect every tracking feature to the social layer — gym volume, running distance, habit streaks, step counts, and more become competitive motivators.

---

### Design Decisions

#### Challenges live inside conversations (not a separate tab)

Challenges are created and tracked within a chat conversation. There's no separate "Challenges" tab or page. This keeps the social context tight — the challenge lives where the banter happens.

**Why:** A challenge between friends is fundamentally a conversation. Separating it from chat fragments the experience. Keeping it in chat means trash talk, encouragement, and progress updates are all in one thread.

#### One active challenge per conversation at a time

To keep things simple and focused, each conversation can have at most one active challenge. Users must complete or cancel the current challenge before starting a new one.

**Why:** Multiple simultaneous challenges between the same two people gets confusing. One at a time keeps the UX clean and the progress cards unambiguous.

#### Challenge types map to existing tracking features

Each challenge type pulls progress data from an existing tracking table. No manual progress entry — everything is automatically computed from real training data.

| Challenge Type | Source Table | Metric |
|---------------|-------------|--------|
| `gym_volume` | `gym_sessions` + exercises | Total volume (kg/lbs) in period |
| `gym_sessions_count` | `gym_sessions` | Number of sessions in period |
| `activity_distance` | `activity_sessions` | Total distance (km/mi) in period |
| `activity_duration` | `activity_sessions` | Total activity time in period |
| `activity_sessions_count` | `activity_sessions` | Number of sessions in period |
| `steps_total` | `step_history` | Total steps in period |
| `steps_daily` | `step_history` | Hit X steps/day for Y days |
| `habit_streak` | `habit_completions` | Longest streak during period |
| `habit_completion_days` | `habit_completions` | Days with all habits completed |
| `weight_consistency` | `weight` | Number of days weight was logged |

#### Fixed time period with deadline

Every challenge has a `starts_at` and `ends_at` timestamp. Common presets: 7 days, 14 days, 30 days. Custom duration also allowed. Challenge auto-completes when the deadline passes.

#### Progress computed server-side via RPC

A single RPC function computes both participants' progress by querying the source tables. This prevents cheating and ensures consistency. The client polls this RPC (or subscribes to updates) to refresh the challenge card.

---

### Challenge Flow

```
1. User A opens chat with User B
2. User A taps "+" menu → "Challenge" (new option alongside media/location/session)
3. Challenge creation sheet appears:
   - Pick challenge type (grouped by feature: Gym, Activities, Steps, Habits, Weight)
   - Pick duration (7d / 14d / 30d / custom)
   - Set target (optional — e.g., "First to 50km" vs. open-ended "Most volume")
   - Preview card shown
4. User A sends challenge → appears as a challenge_request card in chat
5. User B sees the card with Accept / Decline buttons
6. User B taps Accept → challenge becomes active
   - Both users see an updated "active challenge" card
   - Card shows live progress bars for both participants
7. During the challenge period:
   - Progress auto-updates as users complete workouts/activities/habits
   - Milestone messages sent automatically (halfway, 75%, one day left)
   - Users can tap the card to see detailed progress breakdown
8. Challenge ends (deadline reached or target hit):
   - Result card appears in chat showing winner + final stats
   - Optional: result shared to social feed
```

---

### New message type: `challenge`

```typescript
export type MessageType =
  | ... // existing types
  | "challenge";
```

The `challenge` message type has multiple visual states based on the challenge status. The `content` JSON includes a `challenge_id` reference and enough data to render the current state.

#### Content JSON:

```json
{
  "challenge_id": "uuid",
  "status": "pending" | "active" | "completed" | "declined" | "cancelled",
  "challenge_type": "gym_volume",
  "duration_days": 7,
  "target_value": null,
  "starts_at": "2026-03-21T10:00:00Z",
  "ends_at": "2026-03-28T10:00:00Z",
  "challenger": {
    "user_id": "uuid",
    "display_name": "Matias",
    "progress": 12500
  },
  "challenged": {
    "user_id": "uuid",
    "display_name": "Alex",
    "progress": 9800
  },
  "winner_id": null,
  "unit": "kg"
}
```

---

### Challenge card UI states

#### State 1: Pending (waiting for acceptance)

```
+------------------------------------------+
|  ⚔️  CHALLENGE                           |
|                                          |
|  Matias challenges you!                  |
|                                          |
|  Most gym volume in 7 days               |
|  Starts: Mar 21 → Ends: Mar 28          |
|                                          |
|  [  Accept  ]    [  Decline  ]           |
+------------------------------------------+
```

Sender sees the same card but with "Waiting for response..." instead of buttons.

#### State 2: Active (in progress)

```
+------------------------------------------+
|  ⚔️  CHALLENGE  •  3 days left          |
|                                          |
|  Most Gym Volume                         |
|                                          |
|  Matias         ████████░░  12,500 kg    |
|  Alex           ██████░░░░   9,800 kg    |
|                                          |
|  Tap for details →                       |
+------------------------------------------+
```

Progress bars are proportional (leader = full bar reference). Updates each time either user opens the conversation.

#### State 3: Completed (winner declared)

```
+------------------------------------------+
|  🏆  CHALLENGE COMPLETE                  |
|                                          |
|  Most Gym Volume (7 days)                |
|                                          |
|  🥇 Matias       15,200 kg              |
|  🥈 Alex         13,100 kg              |
|                                          |
|  Matias wins by 2,100 kg!               |
+------------------------------------------+
```

#### State 4: Declined / Cancelled

```
+------------------------------------------+
|  ⚔️  Challenge declined                 |
|  Most Gym Volume (7 days)                |
+------------------------------------------+
```

Compact card, no interaction.

---

### Database Schema

Migration: `supabase/migrations/YYYYMMDDHHmmss_chat_challenges.sql`

```sql
-- =============================================
-- Challenge system for chat
-- =============================================

CREATE TABLE chat_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id),
  challenger_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  challenged_id UUID NOT NULL REFERENCES auth.users(id),
  challenge_type TEXT NOT NULL,
  -- one of: gym_volume, gym_sessions_count, activity_distance,
  --         activity_duration, activity_sessions_count, steps_total,
  --         steps_daily, habit_streak, habit_completion_days, weight_consistency
  duration_days INTEGER NOT NULL,
  target_value NUMERIC, -- null = open-ended (highest wins), non-null = first to reach target
  unit TEXT, -- kg, lbs, km, mi, steps, days, etc.
  status TEXT NOT NULL DEFAULT 'pending',
  -- one of: pending, active, completed, declined, cancelled
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  winner_id UUID REFERENCES auth.users(id),
  challenger_final NUMERIC,
  challenged_final NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Only one active/pending challenge per conversation
  CONSTRAINT one_active_per_conversation
    EXCLUDE USING btree (conversation_id WITH =)
    WHERE (status IN ('pending', 'active'))
);

-- Indexes
CREATE INDEX idx_chat_challenges_conversation ON chat_challenges(conversation_id);
CREATE INDEX idx_chat_challenges_participants ON chat_challenges(challenger_id, challenged_id);
CREATE INDEX idx_chat_challenges_status ON chat_challenges(status) WHERE status IN ('pending', 'active');

-- RLS
ALTER TABLE chat_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their challenges"
  ON chat_challenges FOR SELECT
  USING (
    auth.uid() IN (challenger_id, challenged_id)
  );

-- No direct INSERT/UPDATE — only via RPCs
```

---

### RPC Functions

#### 1. Create challenge

```sql
DROP FUNCTION IF EXISTS create_challenge(UUID, TEXT, INTEGER, NUMERIC, TEXT);
CREATE FUNCTION create_challenge(
  p_conversation_id UUID,
  p_challenge_type TEXT,
  p_duration_days INTEGER,
  p_target_value NUMERIC DEFAULT NULL,
  p_unit TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_other_id UUID;
  v_challenge_id UUID;
  v_message_id UUID;
BEGIN
  -- Verify caller is an active participant
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Not an active participant';
  END IF;

  -- Get the other participant
  SELECT user_id INTO v_other_id
  FROM chat_participants
  WHERE conversation_id = p_conversation_id
    AND user_id != auth.uid();

  -- Check no active/pending challenge exists
  IF EXISTS (
    SELECT 1 FROM chat_challenges
    WHERE conversation_id = p_conversation_id
      AND status IN ('pending', 'active')
  ) THEN
    RAISE EXCEPTION 'An active challenge already exists in this conversation';
  END IF;

  -- Create the challenge
  INSERT INTO chat_challenges (
    conversation_id, challenger_id, challenged_id,
    challenge_type, duration_days, target_value, unit, status
  ) VALUES (
    p_conversation_id, auth.uid(), v_other_id,
    p_challenge_type, p_duration_days, p_target_value, p_unit, 'pending'
  ) RETURNING id INTO v_challenge_id;

  -- Send challenge message
  INSERT INTO chat_messages (
    conversation_id, sender_id, content, message_type
  ) VALUES (
    p_conversation_id,
    auth.uid(),
    jsonb_build_object(
      'challenge_id', v_challenge_id,
      'status', 'pending',
      'challenge_type', p_challenge_type,
      'duration_days', p_duration_days,
      'target_value', p_target_value,
      'unit', p_unit
    )::text,
    'challenge'
  ) RETURNING id INTO v_message_id;

  -- Update conversation timestamp
  UPDATE chat_conversations
  SET updated_at = now()
  WHERE id = p_conversation_id;

  RETURN v_challenge_id;
END;
$$;
```

#### 2. Respond to challenge (accept/decline)

```sql
DROP FUNCTION IF EXISTS respond_to_challenge(UUID, BOOLEAN);
CREATE FUNCTION respond_to_challenge(
  p_challenge_id UUID,
  p_accept BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_challenge chat_challenges%ROWTYPE;
BEGIN
  SELECT * INTO v_challenge
  FROM chat_challenges
  WHERE id = p_challenge_id;

  -- Must be the challenged user
  IF v_challenge.challenged_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the challenged user can respond';
  END IF;

  -- Must be pending
  IF v_challenge.status != 'pending' THEN
    RAISE EXCEPTION 'Challenge is not pending';
  END IF;

  IF p_accept THEN
    UPDATE chat_challenges
    SET status = 'active',
        starts_at = now(),
        ends_at = now() + (v_challenge.duration_days || ' days')::interval,
        updated_at = now()
    WHERE id = p_challenge_id;

    -- Send acceptance message (updates the challenge card in chat)
    INSERT INTO chat_messages (
      conversation_id, sender_id, content, message_type
    ) VALUES (
      v_challenge.conversation_id,
      auth.uid(),
      jsonb_build_object(
        'challenge_id', p_challenge_id,
        'status', 'active',
        'challenge_type', v_challenge.challenge_type,
        'duration_days', v_challenge.duration_days,
        'starts_at', now(),
        'ends_at', now() + (v_challenge.duration_days || ' days')::interval
      )::text,
      'challenge'
    );
  ELSE
    UPDATE chat_challenges
    SET status = 'declined', updated_at = now()
    WHERE id = p_challenge_id;

    INSERT INTO chat_messages (
      conversation_id, sender_id, content, message_type
    ) VALUES (
      v_challenge.conversation_id,
      auth.uid(),
      jsonb_build_object(
        'challenge_id', p_challenge_id,
        'status', 'declined'
      )::text,
      'challenge'
    );
  END IF;

  UPDATE chat_conversations
  SET updated_at = now()
  WHERE id = v_challenge.conversation_id;
END;
$$;
```

#### 3. Get challenge progress

```sql
DROP FUNCTION IF EXISTS get_challenge_progress(UUID);
CREATE FUNCTION get_challenge_progress(
  p_challenge_id UUID
)
RETURNS TABLE (
  challenge_id UUID,
  status TEXT,
  challenge_type TEXT,
  duration_days INTEGER,
  target_value NUMERIC,
  unit TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  challenger_id UUID,
  challenger_name TEXT,
  challenger_progress NUMERIC,
  challenged_id UUID,
  challenged_name TEXT,
  challenged_progress NUMERIC,
  winner_id UUID
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_challenge chat_challenges%ROWTYPE;
  v_challenger_progress NUMERIC := 0;
  v_challenged_progress NUMERIC := 0;
BEGIN
  SELECT * INTO v_challenge FROM chat_challenges WHERE id = p_challenge_id;

  -- Verify caller is a participant
  IF auth.uid() NOT IN (v_challenge.challenger_id, v_challenge.challenged_id) THEN
    RAISE EXCEPTION 'Not a challenge participant';
  END IF;

  -- Compute progress based on challenge type
  -- Each type queries the relevant source table for data within the challenge period

  CASE v_challenge.challenge_type
    WHEN 'gym_volume' THEN
      SELECT COALESCE(SUM(e.weight * e.reps), 0) INTO v_challenger_progress
      FROM gym_sessions gs
      JOIN gym_exercises ge ON ge.session_id = gs.id
      JOIN gym_sets e ON e.exercise_id = ge.id
      WHERE gs.user_id = v_challenge.challenger_id
        AND gs.created_at BETWEEN v_challenge.starts_at AND v_challenge.ends_at;

      SELECT COALESCE(SUM(e.weight * e.reps), 0) INTO v_challenged_progress
      FROM gym_sessions gs
      JOIN gym_exercises ge ON ge.session_id = gs.id
      JOIN gym_sets e ON e.exercise_id = ge.id
      WHERE gs.user_id = v_challenge.challenged_id
        AND gs.created_at BETWEEN v_challenge.starts_at AND v_challenge.ends_at;

    WHEN 'gym_sessions_count' THEN
      SELECT COUNT(*) INTO v_challenger_progress
      FROM gym_sessions
      WHERE user_id = v_challenge.challenger_id
        AND created_at BETWEEN v_challenge.starts_at AND v_challenge.ends_at;

      SELECT COUNT(*) INTO v_challenged_progress
      FROM gym_sessions
      WHERE user_id = v_challenge.challenged_id
        AND created_at BETWEEN v_challenge.starts_at AND v_challenge.ends_at;

    WHEN 'activity_distance' THEN
      SELECT COALESCE(SUM(distance_meters), 0) INTO v_challenger_progress
      FROM activity_sessions
      WHERE user_id = v_challenge.challenger_id
        AND created_at BETWEEN v_challenge.starts_at AND v_challenge.ends_at;

      SELECT COALESCE(SUM(distance_meters), 0) INTO v_challenged_progress
      FROM activity_sessions
      WHERE user_id = v_challenge.challenged_id
        AND created_at BETWEEN v_challenge.starts_at AND v_challenge.ends_at;

    WHEN 'activity_duration' THEN
      SELECT COALESCE(SUM(duration), 0) INTO v_challenger_progress
      FROM activity_sessions
      WHERE user_id = v_challenge.challenger_id
        AND created_at BETWEEN v_challenge.starts_at AND v_challenge.ends_at;

      SELECT COALESCE(SUM(duration), 0) INTO v_challenged_progress
      FROM activity_sessions
      WHERE user_id = v_challenge.challenged_id
        AND created_at BETWEEN v_challenge.starts_at AND v_challenge.ends_at;

    WHEN 'activity_sessions_count' THEN
      SELECT COUNT(*) INTO v_challenger_progress
      FROM activity_sessions
      WHERE user_id = v_challenge.challenger_id
        AND created_at BETWEEN v_challenge.starts_at AND v_challenge.ends_at;

      SELECT COUNT(*) INTO v_challenged_progress
      FROM activity_sessions
      WHERE user_id = v_challenge.challenged_id
        AND created_at BETWEEN v_challenge.starts_at AND v_challenge.ends_at;

    WHEN 'steps_total' THEN
      SELECT COALESCE(SUM(steps), 0) INTO v_challenger_progress
      FROM step_history
      WHERE user_id = v_challenge.challenger_id
        AND date BETWEEN v_challenge.starts_at::date AND v_challenge.ends_at::date;

      SELECT COALESCE(SUM(steps), 0) INTO v_challenged_progress
      FROM step_history
      WHERE user_id = v_challenge.challenged_id
        AND date BETWEEN v_challenge.starts_at::date AND v_challenge.ends_at::date;

    WHEN 'habit_completion_days' THEN
      -- Count distinct days where user completed all due habits
      -- (simplified — actual implementation depends on habit scheduling logic)
      SELECT COUNT(DISTINCT completed_date) INTO v_challenger_progress
      FROM habit_completions
      WHERE user_id = v_challenge.challenger_id
        AND completed_date BETWEEN v_challenge.starts_at::date AND v_challenge.ends_at::date;

      SELECT COUNT(DISTINCT completed_date) INTO v_challenged_progress
      FROM habit_completions
      WHERE user_id = v_challenge.challenged_id
        AND completed_date BETWEEN v_challenge.starts_at::date AND v_challenge.ends_at::date;

    WHEN 'weight_consistency' THEN
      SELECT COUNT(*) INTO v_challenger_progress
      FROM weight
      WHERE user_id = v_challenge.challenger_id
        AND created_at BETWEEN v_challenge.starts_at AND v_challenge.ends_at;

      SELECT COUNT(*) INTO v_challenged_progress
      FROM weight
      WHERE user_id = v_challenge.challenged_id
        AND created_at BETWEEN v_challenge.starts_at AND v_challenge.ends_at;

    ELSE
      -- Unknown type, return zeros
      NULL;
  END CASE;

  -- Auto-complete if deadline passed or target reached
  IF v_challenge.status = 'active' THEN
    IF now() > v_challenge.ends_at
       OR (v_challenge.target_value IS NOT NULL
           AND (v_challenger_progress >= v_challenge.target_value
                OR v_challenged_progress >= v_challenge.target_value))
    THEN
      UPDATE chat_challenges
      SET status = 'completed',
          winner_id = CASE
            WHEN v_challenger_progress > v_challenged_progress THEN v_challenge.challenger_id
            WHEN v_challenged_progress > v_challenger_progress THEN v_challenge.challenged_id
            ELSE NULL -- tie
          END,
          challenger_final = v_challenger_progress,
          challenged_final = v_challenged_progress,
          updated_at = now()
      WHERE id = p_challenge_id;

      -- Send completion message
      INSERT INTO chat_messages (
        conversation_id, sender_id, content, message_type
      ) VALUES (
        v_challenge.conversation_id,
        v_challenge.challenger_id, -- system message from challenger
        jsonb_build_object(
          'challenge_id', p_challenge_id,
          'status', 'completed',
          'challenge_type', v_challenge.challenge_type,
          'winner_id', CASE
            WHEN v_challenger_progress > v_challenged_progress THEN v_challenge.challenger_id
            WHEN v_challenged_progress > v_challenger_progress THEN v_challenge.challenged_id
            ELSE NULL
          END,
          'challenger_progress', v_challenger_progress,
          'challenged_progress', v_challenged_progress
        )::text,
        'challenge'
      );
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    v_challenge.id,
    v_challenge.status,
    v_challenge.challenge_type,
    v_challenge.duration_days,
    v_challenge.target_value,
    v_challenge.unit,
    v_challenge.starts_at,
    v_challenge.ends_at,
    v_challenge.challenger_id,
    (SELECT display_name FROM profiles WHERE id = v_challenge.challenger_id),
    v_challenger_progress,
    v_challenge.challenged_id,
    (SELECT display_name FROM profiles WHERE id = v_challenge.challenged_id),
    v_challenged_progress,
    v_challenge.winner_id;
END;
$$;
```

#### 4. Cancel challenge

```sql
DROP FUNCTION IF EXISTS cancel_challenge(UUID);
CREATE FUNCTION cancel_challenge(
  p_challenge_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_challenge chat_challenges%ROWTYPE;
BEGIN
  SELECT * INTO v_challenge FROM chat_challenges WHERE id = p_challenge_id;

  -- Only challenger can cancel pending, either participant can cancel active
  IF v_challenge.status = 'pending' AND v_challenge.challenger_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the challenger can cancel a pending challenge';
  END IF;

  IF v_challenge.status NOT IN ('pending', 'active') THEN
    RAISE EXCEPTION 'Challenge cannot be cancelled';
  END IF;

  IF auth.uid() NOT IN (v_challenge.challenger_id, v_challenge.challenged_id) THEN
    RAISE EXCEPTION 'Not a challenge participant';
  END IF;

  UPDATE chat_challenges
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_challenge_id;

  INSERT INTO chat_messages (
    conversation_id, sender_id, content, message_type
  ) VALUES (
    v_challenge.conversation_id,
    auth.uid(),
    jsonb_build_object(
      'challenge_id', p_challenge_id,
      'status', 'cancelled'
    )::text,
    'challenge'
  );

  UPDATE chat_conversations
  SET updated_at = now()
  WHERE id = v_challenge.conversation_id;
END;
$$;
```

---

### New Components (Phase 2)

#### `features/chat/components/ChatChallengeCard.tsx`

Main card component that renders all 4 states (pending/active/completed/declined+cancelled). Uses the `content` JSON from the message to determine which state to render.

#### `features/chat/components/challenge/`

| Component | Purpose |
|-----------|---------|
| `ChallengeCreationSheet.tsx` | Bottom sheet for creating a challenge (type picker, duration, target) |
| `ChallengeTypePicker.tsx` | Grouped list of challenge types with icons and descriptions |
| `ChallengeDurationPicker.tsx` | Preset buttons (7d/14d/30d) + custom input |
| `ChallengeProgressBar.tsx` | Dual progress bar comparing two participants |
| `ChallengeDetailSheet.tsx` | Expanded view with full progress breakdown (tap from active card) |
| `ChallengeResultCard.tsx` | Winner/loser display with final stats |

#### Challenge type metadata (in `lib/chat/challengeTypes.ts`)

```typescript
export const CHALLENGE_TYPES = {
  gym_volume: {
    label: "Most Gym Volume",
    description: "Total weight × reps across all gym sessions",
    icon: "Dumbbell",
    category: "gym",
    unit_kg: "kg",
    unit_lbs: "lbs",
    format: (v: number) => v.toLocaleString(),
  },
  gym_sessions_count: {
    label: "Most Gym Sessions",
    description: "Number of completed gym sessions",
    icon: "Dumbbell",
    category: "gym",
    unit: "sessions",
    format: (v: number) => v.toString(),
  },
  activity_distance: {
    label: "Most Distance",
    description: "Total distance across all activities",
    icon: "Activity",
    category: "activities",
    unit_km: "km",
    unit_mi: "mi",
    format: (v: number) => (v / 1000).toFixed(1),
  },
  // ... etc for all types
} as const;
```

---

### Hooks (Phase 2)

| Hook | Purpose |
|------|---------|
| `useCreateChallenge.ts` | Mutation: create challenge RPC |
| `useRespondToChallenge.ts` | Mutation: accept/decline RPC |
| `useChallengeProgress.ts` | Query: poll `get_challenge_progress` every 30s while challenge is active |
| `useCancelChallenge.ts` | Mutation: cancel challenge RPC |
| `useActiveChallenge.ts` | Query: get active/pending challenge for a conversation (used to disable create button) |

---

### Database functions (Phase 2, in `database/chat/`)

| File | Purpose |
|------|---------|
| `create-challenge.ts` | Calls `create_challenge` RPC |
| `respond-to-challenge.ts` | Calls `respond_to_challenge` RPC |
| `get-challenge-progress.ts` | Calls `get_challenge_progress` RPC |
| `cancel-challenge.ts` | Calls `cancel_challenge` RPC |

---

### ChatInput changes

Add a "Challenge" option to the attachment menu (the "+" button in `ChatInput`). Sits alongside the existing Image/Video/Voice/Location/Session options.

```
+------------------+
|  📷 Image        |
|  🎥 Video        |
|  🎙 Voice        |
|  📍 Location     |
|  🏋️ Session      |
|  ⚔️ Challenge    |  ← NEW
+------------------+
```

Tapping "Challenge" opens `ChallengeCreationSheet`.

---

### Conversation list preview

| `last_message_type` | Preview text |
|---------------------|-------------|
| `challenge` (pending) | "⚔️ Challenge sent" |
| `challenge` (active) | "⚔️ Challenge accepted" |
| `challenge` (completed) | "🏆 Challenge completed" |
| `challenge` (declined) | "⚔️ Challenge declined" |
| `challenge` (cancelled) | "⚔️ Challenge cancelled" |

---

### Translations (Phase 2)

Add to `locales/en/chat.json`:

```json
{
  "challenge": {
    "title": "Challenge",
    "create": "Create Challenge",
    "challengesSent": "Challenge sent",
    "challengeAccepted": "Challenge accepted!",
    "challengeDeclined": "Challenge declined",
    "challengeCancelled": "Challenge cancelled",
    "challengeComplete": "Challenge complete!",
    "accept": "Accept",
    "decline": "Decline",
    "cancel": "Cancel Challenge",
    "waitingForResponse": "Waiting for response...",
    "daysLeft": "{{count}} days left",
    "hoursLeft": "{{count}} hours left",
    "winsBy": "{{name}} wins by {{difference}} {{unit}}!",
    "tie": "It's a tie!",
    "yourProgress": "Your progress",
    "theirProgress": "Their progress",
    "pickType": "Pick a challenge type",
    "pickDuration": "How long?",
    "setTarget": "Set a target (optional)",
    "targetHint": "First to reach this value wins. Leave empty for highest-at-deadline.",
    "activeExists": "Complete your current challenge first",
    "categories": {
      "gym": "Gym",
      "activities": "Activities",
      "steps": "Steps",
      "habits": "Habits",
      "weight": "Weight"
    },
    "types": {
      "gym_volume": "Most Volume",
      "gym_sessions_count": "Most Sessions",
      "activity_distance": "Most Distance",
      "activity_duration": "Most Active Time",
      "activity_sessions_count": "Most Activities",
      "steps_total": "Most Steps",
      "steps_daily": "Daily Step Goal",
      "habit_streak": "Longest Streak",
      "habit_completion_days": "Most Habit Days",
      "weight_consistency": "Weight Log Streak"
    }
  }
}
```

---

### Message actions for challenges

| Action | Supported? | Notes |
|--------|-----------|-------|
| Reply | Yes | Shows "⚔️ Challenge" in reply preview |
| Copy | No | No meaningful text |
| Forward | No | Challenges are conversation-specific |
| Delete | No | Challenges are shared state; use cancel instead |
| Reactions | Yes | React to challenge cards (fire for hype, etc.) |

---

## Implementation Order

### Phase 1 (Extended Sharing)

1. **Types** — Update `MessageType` and add content types in `types/chat.ts`
2. **Migration** — Authorization RPCs for weight, habit, note, todo, report
3. **Chat card components** — 5 new card components in `features/chat/components/`
4. **ChatBubble** — Extend switch for new message types
5. **Send functions** — 5 new database functions in `database/chat/`
6. **Share entry points** — Add "Send to Chat" to weight/habit/note/todo/report detail views
7. **Conversation preview** — Update `ConversationItem` for new type labels
8. **Translations** — Add keys for all new card types (en + fi)
9. **Reply/forward support** — Extend reply preview and forward logic for new types

### Phase 2 (Challenges)

1. **Migration** — `chat_challenges` table + RPCs (create, respond, progress, cancel)
2. **Types** — Challenge-related types in `types/chat.ts`
3. **Challenge metadata** — `challengeTypes.ts` with labels, icons, formatting
4. **Creation flow** — `ChallengeCreationSheet`, type picker, duration picker
5. **Chat card** — `ChatChallengeCard` with all 4 states
6. **Hooks** — create, respond, progress, cancel, active check
7. **Database functions** — 4 new files in `database/chat/`
8. **ChatInput** — Add "Challenge" to attachment menu
9. **Progress polling** — Auto-refresh active challenge progress
10. **Auto-completion** — Server-side completion check on progress fetch
11. **Conversation preview** — Update for challenge status labels
12. **Translations** — Full challenge key set (en + fi)

---

## Future Considerations

- **Challenge history page:** Once users have completed several challenges, a history/stats page could show win/loss record per friend
- **Group challenges:** When group chats are implemented, challenges could support 3+ participants with a leaderboard card
- **Challenge templates:** Save and reuse challenge configurations ("Our usual 7-day volume battle")
- **Social feed integration:** Option to share challenge results to friends feed with a special result card
- **Push notifications:** Challenge milestones and completion as push notifications (when push is implemented)
- **Rematch button:** Quick-rematch after challenge completion with same settings
