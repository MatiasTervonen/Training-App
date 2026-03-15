# Spec: Video + Full Media Support Everywhere

## Context
The app already has images + voice in notes. Extending with:
1. **Video support in notes** (new)
2. **Full media (images + voice + video) in gym + activity sessions** — both use `sessions` table
3. **Images + voice + video in weight tracking**

Storage: reuse `notes-images`, `notes-voice` buckets. Add `media-videos` for all videos.
Max video: 2 minutes. Thumbnail generated on-device via `expo-video-thumbnails` before upload.

---

## Step 0: Install Packages + Type Cleanup

```bash
npx expo install expo-video expo-video-thumbnails
```

---

## Step 1: Database Migrations (4 files)

### `20260228120000_add_notes_videos.sql`
- Create `notes_videos` table: `id, user_id, note_id (FK→notes CASCADE), storage_path, thumbnail_storage_path, duration_ms, created_at`
- RLS policies (same pattern as `notes_images`)
- Update `notes_save_note` RPC: add `p_videos jsonb` → insert into `notes_videos`, set `video-count` in feed_items
- Update `notes_edit_note` RPC: add `p_deleted_video_ids uuid[]` + `p_new_videos jsonb[]`, update `video-count`

### `20260228121000_add_media_videos_bucket.sql`
- Create `media-videos` storage bucket, 500MB file limit
- MIME types: `video/mp4`, `video/quicktime`, `video/webm`, `image/jpeg` (thumbnails)
- RLS: authenticated users access own folder `{user_id}/**`

### `20260228130000_add_session_media.sql`
Covers BOTH gym and activity sessions (both use `sessions` table).
- Create `session_images` table: `id, user_id, session_id (FK→sessions CASCADE), storage_path, created_at`
- Create `session_videos` table: `id, user_id, session_id (FK→sessions CASCADE), storage_path, thumbnail_storage_path, duration_ms, created_at`
- `sessions_voice` already exists — reuse for gym sessions (no new table)
- Update `gym_save_session` RPC: add `p_images jsonb`, `p_videos jsonb`, `p_recordings jsonb` → insert into `session_images`, `session_videos`, `sessions_voice`; update feed_items counts
- Update `gym_edit_session` RPC: add delete + new arrays for all 3 media types
- Update `activities_save_activity` RPC: add `p_images jsonb`, `p_videos jsonb`
- Update activity edit RPC similarly
- Add `image-count`, `video-count` to both gym and activity feed_items extra_fields

### `20260228140000_add_weight_media.sql`
- Create `weight_images` table: `id, user_id, weight_id (FK→weight CASCADE), storage_path, created_at`
- Create `weight_videos` table: `id, user_id, weight_id (FK→weight CASCADE), storage_path, thumbnail_storage_path, duration_ms, created_at`
- Create `weight_voice` table: `id, user_id, weight_id (FK→weight CASCADE), storage_path, duration_ms, created_at`
- Update weight save RPC: add media params, update feed_items counts

---

## Step 2: New Shared Type

```ts
type DraftVideo = {
  id: string;           // nanoid - local only
  uri: string;          // local video URI
  thumbnailUri: string; // local thumbnail URI
  durationMs: number;
};
```

---

## Step 3: New UI Components (`features/notes/components/`)

### `DraftVideoItem.tsx`
- Thumbnail (h-48, cover) + play icon overlay (centered, semi-transparent bg)
- Duration badge bottom-left (e.g. "1:32")
- Delete button (X, top-right, red) with confirm Alert
- `onPress` → VideoPlayerModal

### `VideoPlayerModal.tsx`
- Full-screen modal using `expo-video` `VideoView` + `useVideoPlayer` hook
- `nativeControls: true`, close button top-right
- Works with local draft URIs and remote signed URLs

---

## Step 4: Update `MediaToolbar.tsx`

**File:** `features/notes/components/MediaToolbar.tsx`

- Add `Video` icon button (after ImagePlus, before FolderOpen)
- New prop: `onVideoSelected: (uri: string, thumbnailUri: string, durationMs: number) => void`
- New prop: `showFolderButton?: boolean` (default true) — pass `false` from gym/weight/activity
- On press: Alert "Take Video" / "Choose from Library" / "Cancel"
  - `launchCameraAsync({ mediaTypes: ['videos'], videoMaxDuration: 120 })`
  - `launchImageLibraryAsync({ mediaTypes: ['videos'] })`
  - After pick: `VideoThumbnails.getThumbnailAsync(uri, { time: 0 })`
  - Call `onVideoSelected(uri, thumbnail.uri, durationMs)`

---

## Step 5: Notes — Add Video

### `database/notes/save-note.ts`
- Accept `draftVideos: DraftVideo[]`
- Upload video → `media-videos/{user_id}/{uuid}.mp4`
- Upload thumbnail → `media-videos/{user_id}/{uuid}-thumb.jpg`
- Pass `p_videos` to `notes_save_note` RPC

### `database/notes/edit-notes.ts`
- Accept `deletedVideoIds: string[]` + `newVideos: DraftVideo[]`
- Upload new, pass to RPC

### `database/notes/get-full-notes.ts`
- Fetch `notes_videos`, generate signed URLs for video + thumbnail
- Add `videos: { id, uri, thumbnailUri, duration_ms }[]` to `FullNotesSession`

### `app/notes/quick-notes/index.tsx`
- Add `draftVideos` state, wire `onVideoSelected`
- Render `DraftVideoItem` list, pass to `useSaveNotes`, persist in `useSaveDraft`

### `features/notes/cards/edit-notes.tsx`
- Add `existingVideos[]`, `deletedVideoIds[]`, `newDraftVideos[]` (mirror image pattern)

### `features/notes/cards/notes-expanded.tsx`
- Render videos → tappable `DraftVideoItem` → VideoPlayerModal

### `features/notes/cards/notes-feed.tsx`
- Add video count badge (same pattern as voice/image)

### `features/feed/hooks/useFullSessions.ts`
- Also fetch if `videoCount > 0`

---

## Step 6: Gym + Activity Sessions — Add Media

Both use `sessions` table → same `session_images` / `session_videos` tables.

### `database/gym/save-session.ts`
- Accept `draftImages`, `draftRecordings`, `draftVideos`
- Upload to `notes-images`, `notes-voice`, `media-videos`
- Pass to updated `gym_save_session` RPC

### `database/gym/edit-session.ts`
- Accept delete + new draft arrays for all 3 media types

### `database/gym/get-full-gym-session.ts`
- Fetch `session_images`, `session_videos`, `sessions_voice`
- Generate signed URLs, add to `FullGymSession`

### `features/gym/components/GymForm.tsx`
- Add `draftImages`, `draftRecordings`, `draftVideos` state
- Add `MediaToolbar` below notes field (`folders={[]}`, `showFolderButton={false}`)
- Render `DraftRecordingItem`, `DraftImageItem`, `DraftVideoItem`
- Pass media to `useSaveSession`

### Gym session expanded view + gym feed card
- Render images/videos/voice, add count badges

### `database/activities/save-session.ts`
- Extend existing voice support: add `draftImages`, `draftVideos`, upload + pass to RPC

### `database/activities/get-full-activity-session.ts`
- Fetch `session_images`, `session_videos`, generate signed URLs

### `app/activities/start-activity/index.tsx`
- Replace `RecordVoiceNotes` with `MediaToolbar` in notes modal
- Add `draftImages`, `draftVideos` state

### Activity expanded view (`features/activities/cards/activity-feed-expanded/activity.tsx`)
- Add images and video sections

---

## Step 7: Weight Tracking — Add Full Media

### Weight DB save function
- Accept `draftImages`, `draftRecordings`, `draftVideos`, upload + pass to RPC

### `app/weight/tracking/index.tsx`
- Add media state, `MediaToolbar` below notes (`showFolderButton={false}`)
- Render draft items, pass to `useSaveWeight`

### `features/weight/hooks/useSaveWeight.ts`
- Accept and forward media to DB layer

---

## Step 8: Translations

Add under `notes.videos` in `locales/en/notes.json` and `locales/fi/notes.json`:
```json
"videos": {
  "title": "Videos:",
  "addVideo": "Add Video",
  "takeVideo": "Take Video",
  "chooseFromLibrary": "Choose from Library",
  "cancel": "Cancel",
  "deleteVideoTitle": "Delete Video",
  "deleteVideoMessage": "Are you sure you want to delete this video?",
  "permissionRequired": "Camera or video library permission is required."
}
```

---

## Files to Change

| File | Change |
|------|--------|
| `types/models.ts` | Remove broken `gym_sessions` type export |
| `features/notes/components/MediaToolbar.tsx` | Add video icon + props |
| `features/notes/components/DraftVideoItem.tsx` | **Create** |
| `features/notes/components/VideoPlayerModal.tsx` | **Create** |
| `database/notes/save-note.ts` | Add video upload |
| `database/notes/edit-notes.ts` | Add video delete/upload |
| `database/notes/get-full-notes.ts` | Fetch videos + signed URLs |
| `app/notes/quick-notes/index.tsx` | Add video state |
| `features/notes/cards/edit-notes.tsx` | Add video state |
| `features/notes/cards/notes-expanded.tsx` | Render videos |
| `features/notes/cards/notes-feed.tsx` | Video count badge |
| `features/feed/hooks/useFullSessions.ts` | Fetch if videoCount > 0 |
| `features/gym/components/GymForm.tsx` | Add MediaToolbar + media state |
| `database/gym/save-session.ts` | Add media upload |
| `database/gym/edit-session.ts` | Add media delete/upload |
| `database/gym/get-full-gym-session.ts` | Fetch session media |
| Gym session expanded view | Render media |
| Gym feed card | Media count badges |
| `database/activities/save-session.ts` | Add image/video upload |
| `database/activities/get-full-activity-session.ts` | Fetch session media |
| `app/activities/start-activity/index.tsx` | Replace RecordVoiceNotes with MediaToolbar |
| Activity expanded view | Add images/video sections |
| `app/weight/tracking/index.tsx` | Add MediaToolbar + media state |
| `features/weight/hooks/useSaveWeight.ts` | Forward media to DB |
| Weight DB save function | Add media upload |
| `locales/en/notes.json` | Add videos translations |
| `locales/fi/notes.json` | Add Finnish videos translations |
| 4x SQL migration files | **Create** |

## Implementation Order
1. Install packages + remove broken `gym_sessions` type from `types/models.ts`
2. Write + apply migrations
3. Create `DraftVideoItem`, `VideoPlayerModal`
4. Update `MediaToolbar` (add video)
5. Notes pipeline (DB → UI)
6. Gym + activity sessions (DB → UI)
7. Weight tracking (DB → UI)
8. Translations
