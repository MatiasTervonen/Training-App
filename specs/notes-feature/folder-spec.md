# Folder Feature Spec — Notes Feature

## Overview

Add a folder system to the existing notes feature. Users can organize notes into folders across both mobile (React Native / Expo) and web (Next.js) apps with a shared Supabase backend.

---

## Constraints & Context

| Concern | Detail |
|---|---|
| Backend | Supabase |
| Database | PostgreSQL |
| Mobile framework | React Native / Expo |
| Web framework | Next.js / React |
| State management | React Query (`@tanstack/react-query`). Notes do **not** use Zustand. |
| Auth | Supabase Auth (`auth.uid()`) |
| Real-time sync | None yet |
| Feed system | All notes appear in the `feed_items` table (`type = 'notes'`, `source_id = notes.id`). The `extra_fields` JSONB column stores denormalized preview data. |
| Pinning system | Separate `pinned_items` table. `pinned_context = 'notes'` scopes pins to the notes page. |
| Voice recordings | Stored in `notes_voice` table (FK `note_id -> notes.id`) and `notes-voice` storage bucket. |

### Current `notes` table schema

```
notes
  id          uuid        PK, DEFAULT gen_random_uuid()
  user_id     uuid        NOT NULL, FK -> users(id), DEFAULT auth.uid()
  title       text | null
  notes       text | null   (HTML on web, plain text on mobile)
  activity_at timestamptz  DEFAULT now()
  created_at  timestamptz  DEFAULT now()
  updated_at  timestamptz | null
```

### Related tables

- `notes_voice` — voice recordings attached to notes (`note_id -> notes.id`)
- `feed_items` — centralized feed; notes rows have `type = 'notes'`, `source_id = notes.id`
- `pinned_items` — pinning; `feed_item_id -> feed_items.id`, `pinned_context = 'notes'`

### Relevant RPC functions

- `notes_save_note(p_title, p_notes, p_draftRecordings?)` — inserts into `notes`, `notes_voice`, and `feed_items` atomically
- `notes_edit_note(p_id, p_title, p_notes, p_updated_at, p_deleted_recording_ids?, p_new_recordings?)` — updates `notes`, manages `notes_voice`, and updates `feed_items`
- `feed_delete_session(p_id, p_type)` — deletes `pinned_items`, `feed_items`, and the domain row

### Existing patterns to follow

- The `todo_lists -> todo_tasks` relationship (`todo_tasks.list_id` FK) is the closest analog to `note_folders -> notes`.
- All mutations use Supabase RPC functions.
- React Query keys: `["myNotes"]` for the notes feed, `["feed"]` for the main dashboard feed.
- Optimistic updates on cache, then invalidate on success.

---

## Core Requirements

- Users can create, rename, and delete folders
- Existing notes can be moved into folders and between folders
- Notes can also exist outside any folder (root level)
- Folders should be quickly accessible from the main notes view
- Include a "move to folder" option in the note's context menu / action sheet
- Folder structure must sync between web and mobile apps

---

## Design Decisions

### 1. Subfolders — No

**Recommendation:** Flat folder structure only. No nesting.

**Reasoning:** This is a training app, not an enterprise document manager. Users will have at most a dozen folders (e.g., "Training Plans", "Nutrition", "Recovery", "Technique Notes"). Nested folders require recursive CTEs or materialized paths in the database, breadcrumb navigation, and tree-view rendering on both platforms. The complexity far exceeds the benefit.

**Rejected alternatives:**
- One level of subfolders — still requires parent_id, tree rendering, and breadcrumbs for marginal gain.
- Unlimited nesting — enterprise-level complexity with no justified use case.

### 2. Navigation pattern — Filter chips on My Notes page

**Recommendation:** Horizontal scrollable filter chips at the top of the My Notes page. Chips: "All" (default), "Unfiled", then one chip per user folder sorted alphabetically.

**Reasoning:** Users already navigate to My Notes to see their note feed. Filter chips are minimally invasive, work identically on mobile and web, and require no new pages or sidebars. This is the simplest pattern that provides clear folder navigation.

**Rejected alternatives:**
- Sidebar navigation — adds desktop complexity, awkward on mobile.
- Separate page per folder — too many navigation layers for a flat list.
- Collapsible tree view — overkill for a flat structure.
- Tab bar — limited horizontal space when folder count grows.

### 3. Folder deletion behavior — Move notes to unfiled

**Recommendation:** When a folder is deleted, all notes in that folder have their `folder_id` set to `NULL` (moved to unfiled). Implemented via the FK constraint `ON DELETE SET NULL`.

**Reasoning:** Users must never lose notes accidentally. A confirmation dialog warns: "This folder contains X notes. They will be moved to Unfiled." The implementation is a single FK constraint — no application logic needed for the cascade.

**Rejected alternatives:**
- Delete notes too — too destructive, unrecoverable data loss risk.
- Move to trash — no trash/archive feature exists anywhere in the app.
- Block deletion if folder is non-empty — frustrating UX, forces users to move notes manually first.

### 4. Visual customization — None in Phase 1

**Recommendation:** No colors or icons for folders. Differentiation is by name only.

**Reasoning:** Adding colors requires a color picker UI, a `color` column in the database, and per-platform rendering. Adding icons requires an icon picker with even more scope. These are purely cosmetic and can be added as a Phase 2 enhancement. Keep the initial implementation lean and ship faster.

**Rejected alternatives:**
- Color-coding from day one — adds scope without core organizational value.
- Emoji icons — requires emoji picker, rendering complexity, cross-platform emoji font differences.

### 5. Note-to-folder relationship — One folder per note

**Recommendation:** A note belongs to zero or one folder. Implemented as a nullable `folder_id` FK on the `notes` table.

**Reasoning:** This is the simplest model. It matches the existing `todo_tasks.list_id` pattern. A note with `folder_id = NULL` is "unfiled". A note with a `folder_id` is in exactly one folder. Users intuitively expect this from a folder metaphor.

**Rejected alternatives:**
- Many-to-many (tags/labels) — requires a junction table (`note_folder_assignments`), more complex UI (multi-select), and a different mental model. Tags are a separate feature that could be layered on later.

### 6. Default folders — None

**Recommendation:** No system-created folders. Users start with zero folders and create them on demand.

**Reasoning:** The app has no "system-created" resources for any feature. Default folders would require localized names (English vs Finnish), and would add clutter for users who do not need organization. The "Unfiled" filter chip handles root-level notes. The pinning system already handles "favorites."

**Rejected alternatives:**
- "Favorites" folder — already handled by the existing pinning system.
- "Archive" folder — no archive concept exists in the app.

### 7. Folder ordering — Alphabetical

**Recommendation:** Folders are sorted alphabetically by name. The "All" and "Unfiled" chips are always first and second, followed by user folders alphabetically.

**Reasoning:** Alphabetical is predictable and requires no `position` column. With a small number of folders, alphabetical scanning is fast. Manual reorder can be added later by introducing a `position` integer column.

**Rejected alternatives:**
- Creation date order — less predictable for quick visual scanning.
- Manual drag-to-reorder — significant additional complexity (position tracking, reorder logic, drag-and-drop on both platforms). Good Phase 2 enhancement.

### 8. Search — Global (no change needed)

**Recommendation:** Search is not yet implemented for notes. When it is built later, it should be global by default. Each search result should display a folder badge so users know which folder the note is in. A folder-scoped filter can be added as a search option.

**Reasoning:** There is nothing to modify today. Global search is more useful than folder-scoped because users often do not remember which folder a note is in.

**Rejected alternatives:**
- Folder-scoped search only — limits discoverability, frustrates users who cannot locate notes.

---

## Database Schema

### New table: `note_folders`

```sql
CREATE TABLE note_folders (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL DEFAULT auth.uid()
                         REFERENCES users(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- Efficient folder listing per user
CREATE INDEX idx_note_folders_user_id ON note_folders(user_id);

-- Prevent duplicate folder names per user
CREATE UNIQUE INDEX idx_note_folders_user_name ON note_folders(user_id, name);
```

### Modification to existing `notes` table

```sql
ALTER TABLE notes
  ADD COLUMN folder_id uuid
  REFERENCES note_folders(id) ON DELETE SET NULL;

-- Efficient filtering by folder
CREATE INDEX idx_notes_folder_id ON notes(folder_id);
```

`ON DELETE SET NULL` ensures that when a folder is deleted, all its notes become unfiled automatically at the database level.

### RLS Policies for `note_folders`

Following the existing pattern where each table checks `auth.uid() = user_id`:

```sql
ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders"
  ON note_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
  ON note_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON note_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON note_folders FOR DELETE
  USING (auth.uid() = user_id);
```

---

## Supabase Client Query Examples

### Folder CRUD

**Get all folders for current user:**

```typescript
const { data, error } = await supabase
  .from("note_folders")
  .select("id, name, created_at, updated_at")
  .order("name", { ascending: true });
```

**Get all folders with note counts:**

```typescript
const { data, error } = await supabase
  .from("note_folders")
  .select("id, name, created_at, updated_at, notes(count)")
  .order("name", { ascending: true });
```

**Create a folder:**

```typescript
const { data, error } = await supabase
  .from("note_folders")
  .insert({ name: folderName })
  .select()
  .single();
```

**Rename a folder:**

```typescript
const { data, error } = await supabase
  .from("note_folders")
  .update({ name: newName, updated_at: new Date().toISOString() })
  .eq("id", folderId)
  .select()
  .single();
```

**Delete a folder (notes auto-unfiled via ON DELETE SET NULL):**

```typescript
const { error } = await supabase
  .from("note_folders")
  .delete()
  .eq("id", folderId);
```

### Note-Folder Operations

**Move a note to a folder:**

```typescript
const { error } = await supabase
  .from("notes")
  .update({ folder_id: folderId })
  .eq("id", noteId);
```

**Remove a note from its folder (move to unfiled):**

```typescript
const { error } = await supabase
  .from("notes")
  .update({ folder_id: null })
  .eq("id", noteId);
```

### Folder-Filtered Notes Feed

Because notes are displayed via `feed_items`, filtering by folder requires joining with the `notes` table. The recommended approach is a new RPC function.

**New RPC: `notes_get_by_folder`**

```sql
CREATE OR REPLACE FUNCTION notes_get_by_folder(
  p_folder_id   uuid    DEFAULT NULL,
  p_unfiled_only boolean DEFAULT false,
  p_limit        integer DEFAULT 10,
  p_offset       integer DEFAULT 0
)
RETURNS SETOF feed_items
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_unfiled_only THEN
    -- Notes with no folder
    RETURN QUERY
    SELECT fi.*
    FROM feed_items fi
    JOIN notes n ON fi.source_id::uuid = n.id
    WHERE fi.type = 'notes'
      AND fi.user_id = auth.uid()
      AND n.folder_id IS NULL
    ORDER BY fi.activity_at DESC
    LIMIT p_limit OFFSET p_offset;

  ELSIF p_folder_id IS NOT NULL THEN
    -- Notes in a specific folder
    RETURN QUERY
    SELECT fi.*
    FROM feed_items fi
    JOIN notes n ON fi.source_id::uuid = n.id
    WHERE fi.type = 'notes'
      AND fi.user_id = auth.uid()
      AND n.folder_id = p_folder_id
    ORDER BY fi.activity_at DESC
    LIMIT p_limit OFFSET p_offset;

  ELSE
    -- All notes (no filter)
    RETURN QUERY
    SELECT fi.*
    FROM feed_items fi
    WHERE fi.type = 'notes'
      AND fi.user_id = auth.uid()
    ORDER BY fi.activity_at DESC
    LIMIT p_limit OFFSET p_offset;
  END IF;
END;
$$;
```

### Updated RPC: `notes_save_note` (add optional `p_folder_id`)

The existing `notes_save_note` RPC must be updated in both mobile and web to accept an optional `p_folder_id uuid DEFAULT NULL` parameter. The `INSERT INTO notes` statement adds `folder_id`, and the `feed_items.extra_fields` JSONB includes `'folder_id', p_folder_id`.

### Updated RPC: `notes_edit_note` (add optional `p_folder_id`)

The existing `notes_edit_note` RPC must be updated in both mobile and web to accept an optional `p_folder_id uuid DEFAULT NULL` parameter. The `UPDATE notes` statement sets `folder_id = p_folder_id`, and the `feed_items.extra_fields` JSONB includes `'folder_id', p_folder_id`.

### New RPC: `notes_move_to_folder`

A lightweight function to move a note without updating title/content:

```sql
CREATE OR REPLACE FUNCTION notes_move_to_folder(
  p_note_id   uuid,
  p_folder_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Update note's folder_id
  UPDATE notes
  SET folder_id = p_folder_id,
      updated_at = now()
  WHERE id = p_note_id
    AND user_id = auth.uid();

  -- Keep feed_items.extra_fields in sync
  UPDATE feed_items
  SET extra_fields = extra_fields || jsonb_build_object('folder_id', p_folder_id),
      updated_at   = now()
  WHERE source_id = p_note_id
    AND type = 'notes'
    AND user_id = auth.uid();
END;
$$;
```

---

## Types to Add

### `database.types.ts` (auto-generated)

After running `supabase gen types typescript`, the `note_folders` table will appear automatically. No manual changes needed.

### `types/models.ts` (both apps)

Add to both `mobile/types/models.ts` and `web/types/models.ts`:

```typescript
export type note_folders = Database["public"]["Tables"]["note_folders"]["Row"];
```

---

## React Query Keys

| Key | Purpose |
|---|---|
| `["folders"]` | List of all user folders |
| `["myNotes"]` | All notes, no folder filter (existing) |
| `["myNotes", folderId]` | Notes filtered by a specific folder |
| `["myNotes", "unfiled"]` | Notes without a folder |
| `["feed"]` | Main dashboard feed (existing, invalidated on note save) |

When a note is moved to a folder, invalidate:
- `["myNotes"]` (the "All" view)
- `["myNotes", oldFolderId]` (if it had a folder)
- `["myNotes", newFolderId]` (the target folder)

When a folder is deleted, invalidate:
- `["folders"]`
- `["myNotes"]` (notes moved to unfiled)
- `["myNotes", deletedFolderId]` (no longer valid)

---

## Migration Plan

### Step 1: Database migration (zero downtime, additive only)

1. Create the `note_folders` table with RLS policies and indexes.
2. `ALTER TABLE notes ADD COLUMN folder_id uuid REFERENCES note_folders(id) ON DELETE SET NULL;`
3. `CREATE INDEX idx_notes_folder_id ON notes(folder_id);`
4. Create the `notes_get_by_folder` RPC function.
5. Create the `notes_move_to_folder` RPC function.
6. Update `notes_save_note` to accept optional `p_folder_id` (default NULL — fully backward compatible).
7. Update `notes_edit_note` to accept optional `p_folder_id` (default NULL — fully backward compatible).

All existing notes will have `folder_id = NULL`. No data migration is needed. Existing clients that do not pass `p_folder_id` will continue to work unchanged.

### Step 2: Regenerate TypeScript types

Run `supabase gen types typescript` to regenerate:
- `mobile/types/database.types.ts`
- `web/types/database.types.ts`

Add the `note_folders` type alias in both `types/models.ts` files.

### Step 3: Add new database query files

Files to create in both `mobile/database/notes/` and `web/database/notes/`:

- `get-folders.ts` — fetch all folders with note counts
- `save-folder.ts` — create a folder
- `rename-folder.ts` — rename a folder
- `delete-folder.ts` — delete a folder
- `move-note-to-folder.ts` — call `notes_move_to_folder` RPC

### Step 4: Update existing database query files

- `save-note.ts` — pass optional `folder_id` to RPC
- `edit-notes.ts` — pass optional `folder_id` to RPC
- `get-notes.ts` — accept optional `folderId` filter, call `notes_get_by_folder` RPC

### Step 5: Create new hooks

See the mobile and web UI specs for the full list of hooks.

### Step 6: UI implementation

See `folder-mobile-ui.md` and `folder-web-ui.md`.

### Step 7: Translation updates

Add `folders` key group under `notes` in all four translation files:
- `mobile/locales/en/notes.json`
- `mobile/locales/fi/notes.json`
- `web/app/lib/i18n/locales/en/notes.json`
- `web/app/lib/i18n/locales/fi/notes.json`

### Step 8: Testing checklist

- [ ] Create a folder
- [ ] Create a folder with a duplicate name (should fail with validation error)
- [ ] Rename a folder
- [ ] Rename a folder to a duplicate name (should fail)
- [ ] Delete an empty folder
- [ ] Delete a folder with notes (confirm dialog, notes move to unfiled)
- [ ] Create a note in a specific folder
- [ ] Create a note without selecting a folder (unfiled)
- [ ] Move a note from one folder to another
- [ ] Remove a note from a folder (move to unfiled)
- [ ] Filter notes by folder (filter chips)
- [ ] Filter to "Unfiled" notes
- [ ] Filter to "All" notes
- [ ] Pin a note that is in a folder (pin should still work)
- [ ] Delete a note that is in a folder (standard delete flow)
- [ ] Edit a note and change its folder
- [ ] Verify feed_items.extra_fields.folder_id stays in sync after move

---

## Edge Cases

| Edge Case | Handling |
|---|---|
| Delete folder with notes | Notes moved to unfiled via FK `ON DELETE SET NULL`. Confirmation dialog warns user. |
| Delete folder with pinned notes | Pins are unaffected. Pins reference `feed_items`, not folders. Notes become unfiled but remain pinned. |
| Rename folder to existing name | Unique index `(user_id, name)` rejects the operation. Show "A folder with this name already exists." |
| Empty folder name | Client-side validation: require non-empty trimmed name. |
| Very long folder name | Truncate display at ~30 characters with ellipsis. No DB constraint needed (text type is unlimited). |
| Create note without selecting folder | `folder_id = NULL`. Note is "unfiled." |
| Move note between folders | Single RPC call to `notes_move_to_folder`. Updates both `notes` and `feed_items.extra_fields`. |
| User has zero folders | Filter chips show only "All". My Notes page behaves identically to current behavior. |
| Folder count limit | No hard limit. Users can create as many as they want. For a training app, this is fine. |
| Concurrent folder rename by same user (two tabs) | Last write wins. No optimistic locking needed. |
| `feed_items.extra_fields.folder_id` out of sync | The `notes_move_to_folder` RPC updates both tables atomically. If a folder is deleted, the FK `ON DELETE SET NULL` sets `notes.folder_id = NULL`, and the feed_items row retains the old `folder_id` in JSON. The `notes_get_by_folder` RPC joins on `notes.folder_id`, so filtering always uses the source of truth. The stale JSON value is harmless for display and self-corrects on next note edit. |
| RLS ensures user isolation | All `note_folders` queries are scoped to `auth.uid()`. A user cannot see, modify, or delete another user's folders. |
