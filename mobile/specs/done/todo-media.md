# Spec: Todo List Media Support (Images, Video, Voice)

## Context
The notes feature already supports media (images, video, voice recordings) with a full pipeline: MediaToolbar for picking, draft state, Supabase storage upload, DB records, signed URL fetching, and display components. Todo lists currently only have text + notes per task. This spec adds media support to individual todo tasks, following the same patterns and reusing existing components.

---

## Step 1: Database Migration

### `20260304140000_add_todo_task_media.sql`

**New tables** (same pattern as notes media):

1. `todo_task_voice` — `id uuid PK, user_id FK→users CASCADE, task_id FK→todo_tasks CASCADE, storage_path text, duration_ms int, created_at timestamptz`
2. `todo_task_images` — `id uuid PK, user_id FK→users CASCADE, task_id FK→todo_tasks CASCADE, storage_path text, created_at timestamptz`
3. `todo_task_videos` — `id uuid PK, user_id FK→users CASCADE, task_id FK→todo_tasks CASCADE, storage_path text, thumbnail_storage_path text, duration_ms int, created_at timestamptz`

RLS policies: same pattern as `notes_voice`/`notes_images`/`notes_videos` (authenticated users can CRUD own rows).

**Update `todo_save_todo` RPC:**
- DROP + recreate with same params but extended task jsonb structure
- Each task in `p_todo_list` now may include: `voice`, `images`, `videos` arrays with storage paths
- After inserting each task, insert corresponding media records
- Set `voice-count`, `image-count`, `video-count` in feed_items extra_fields (sum across all tasks)

**Update `todo_edit_todo` RPC:**
- DROP + recreate with additional params: `p_deleted_voice_ids uuid[]`, `p_deleted_image_ids uuid[]`, `p_deleted_video_ids uuid[]`
- Each task in `p_tasks` may include `new_voice`, `new_images`, `new_videos` arrays
- For new tasks (id IS NULL): insert media records after inserting the task
- For existing tasks: insert new media records
- Delete media matching the deleted ID arrays
- Recalculate media counts in feed_items extra_fields

Storage: reuse existing buckets `notes-voice`, `notes-images`, `media-videos`.

---

## Step 2: New Database Functions

### `database/todo/get-todo-media.ts` (NEW)
- Fetches all media for all tasks in a todo list
- Queries `todo_task_voice`, `todo_task_images`, `todo_task_videos` where task_id IN (select id from todo_tasks where list_id = ?)
- Generates signed URLs for each media item
- Returns grouped by task_id:
```ts
type TodoTaskMedia = {
  [taskId: string]: {
    voice: { id: string; uri: string; storage_path: string; duration_ms: number | null }[];
    images: { id: string; uri: string; storage_path: string }[];
    videos: { id: string; uri: string; thumbnailUri: string; storage_path: string; duration_ms: number | null }[];
  };
};
```

### `database/todo/save-todo.ts` (UPDATE)
- Accept per-task draft media arrays
- Upload files to Supabase storage (same pattern as `database/notes/save-note.ts`)
- Include storage paths in the task jsonb passed to the RPC
- Cleanup orphaned uploads on error

### `database/todo/edit-todo.ts` (UPDATE)
- Accept new draft media per task + deleted media IDs
- Upload new files, pass storage paths + deleted IDs to RPC
- Cleanup orphaned uploads on error

---

## Step 3: Update Types

### `types/session.ts`
Add draft media types to `full_todo_session_optional_id` task type:
```ts
todo_tasks: {
  // ... existing fields
  draftRecordings?: DraftRecording[];
  draftImages?: DraftImage[];
  draftVideos?: DraftVideo[];
  // For edit mode - existing media fetched from DB
  existingVoice?: { id: string; uri: string; duration_ms: number | null }[];
  existingImages?: { id: string; uri: string }[];
  existingVideos?: { id: string; uri: string; thumbnailUri: string; duration_ms: number | null }[];
}
```

---

## Step 4: Create Todo Page Updates

### `app/todo/create-todo/index.tsx`
- Update `TodoItem` type to include `draftRecordings`, `draftImages`, `draftVideos` arrays
- Add `MediaToolbar` (reuse from `features/notes/components/MediaToolbar.tsx`) below SubNotesInput, without folder button (`showFolderButton={false}`, `folders={[]}`)
- When media is picked, store in local state associated with current task being drafted
- On "Add" press, include media arrays in the new task
- In the task expand/edit modal: display draft media using `DraftRecordingItem`, `DraftImageItem`, `DraftVideoItem` + allow adding more via MediaToolbar + delete
- On save: upload all media for all tasks, then call RPC

### `features/todo/hooks/useSaveDraft.ts`
- Include draft media arrays in the persisted draft (media URIs from recordings/photos are local file paths)

---

## Step 5: Edit Todo Updates

### `features/todo/cards/todo-edit.tsx`
- Receive existing media per task (from todo media query)
- Per task card: show existing media + allow adding new + delete existing
- Add `MediaToolbar` per task (without folder button)
- Track `deletedVoiceIds`, `deletedImageIds`, `deletedVideoIds` (flat arrays)
- Track new draft media per task
- On save: upload new media, pass to updated `editTodo` function

---

## Step 6: Expanded View Updates

### `features/todo/cards/todo-expanded.tsx`
- Accept new prop `taskMedia: TodoTaskMedia` (media grouped by task_id)
- In the task expand FullScreenModal: show media (images → `DraftImageItem`, videos → `DraftVideoItem`, voice → `DraftRecordingItem`) + `ImageViewerModal` for full-screen image gallery

### `features/feed/hooks/useFullSessions.ts`
- Add todo media query (similar to notes media pattern)
- Check extra_fields for `voice-count`, `image-count`, `video-count`
- Only fetch if any count > 0
- Call `getFullTodoMedia(listId)` when enabled
- Return `todoMediaFull`, `todoMediaError`, `isLoadingTodoMedia`

### `features/feed/SessionFeed.tsx`
- Pass `todoMediaFull` and loading state to `TodoSession` component in expanded view

---

## Step 7: Feed Card Updates

### `features/todo/cards/todo-feed.tsx`
- Add media count icons (voice, image, video) matching the notes feed card pattern
- Extract from extra_fields: `voice-count`, `image-count`, `video-count`
- Use `Mic`, `ImageIcon`, `Video` icons (12px, #94a3b8 color)
- Layout: `flex-row items-center gap-3 mb-1`

---

## Step 8: My Todo Lists Page

### `app/todo/my-todo-lists/index.tsx`
- Pass todo media data to expanded and edit modals (same pattern as SessionFeed changes)

---

## Step 9: Translations

### `locales/en/todo.json` + `locales/fi/todo.json`
Add media-related keys under `todo.media`:
```json
"media": {
  "voiceRecordings": "Voice Recordings",
  "images": "Images",
  "videos": "Videos"
}
```

---

## Files to Change

| File | Action |
|------|--------|
| `supabase/migrations/20260304140000_add_todo_task_media.sql` | **Create** |
| `database/todo/get-todo-media.ts` | **Create** |
| `database/todo/save-todo.ts` | Update (add media upload) |
| `database/todo/edit-todo.ts` | Update (add media upload/delete) |
| `types/session.ts` | Update (add media fields to todo task type) |
| `app/todo/create-todo/index.tsx` | Update (add MediaToolbar, media state, media in tasks) |
| `features/todo/hooks/useSaveDraft.ts` | Update (persist media in draft) |
| `features/todo/cards/todo-edit.tsx` | Update (add media editing per task) |
| `features/todo/cards/todo-expanded.tsx` | Update (show media in task modal) |
| `features/todo/cards/todo-feed.tsx` | Update (add media count icons) |
| `features/feed/hooks/useFullSessions.ts` | Update (add todo media query) |
| `features/feed/SessionFeed.tsx` | Update (pass media to TodoSession) |
| `app/todo/my-todo-lists/index.tsx` | Update (pass media to expanded/edit) |
| `locales/en/todo.json` | Update |
| `locales/fi/todo.json` | Update |

## Reusable Components (no changes needed)
- `features/notes/components/MediaToolbar.tsx` — use with `showFolderButton={false}`, `folders={[]}`
- `features/notes/components/RecordingModal.tsx`
- `features/notes/components/DraftRecordingItem.tsx`
- `features/notes/components/DraftImageItem.tsx`
- `features/notes/components/DraftVideoItem.tsx`
- `features/notes/components/ImageViewerModal.tsx`
- `features/notes/components/VideoPlayerModal.tsx`

## Implementation Order
1. Database migration
2. `get-todo-media.ts` (new fetcher)
3. `save-todo.ts` (add media upload)
4. `edit-todo.ts` (add media upload/delete)
5. Types update
6. Feed card media counts (`todo-feed.tsx`)
7. Expanded view media display (`todo-expanded.tsx` + `useFullSessions` + `SessionFeed`)
8. Create page (`create-todo/index.tsx` + `useSaveDraft`)
9. Edit page (`todo-edit.tsx`)
10. My Todo Lists page media pass-through
11. Translations

## Verification
- Create a todo list with tasks that have voice, images, and videos
- Verify media uploads to Supabase storage
- Verify feed card shows media count icons
- Expand a todo list → expand a task → verify media displays correctly
- Edit a todo list → add new media to a task → delete existing media → save → verify
- Test draft persistence (add media, close app, reopen → draft media still there)
- Verify error cleanup (if save fails, orphaned uploads are removed)
