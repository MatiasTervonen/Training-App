# Spec: Video + Full Media Support Everywhere

## Context
The app already has images + voice in the notes feature. We're extending this with:
1. **Video support in notes** (new capability)
2. **Full media (images + voice + video) in gym sessions** (currently text-only)
3. **Images + video in activity sessions** (voice already exists)
4. **Images + voice + video in weight tracking** (currently text-only)

All media reuses shared storage buckets (`notes-images`, `notes-voice`, plus a new `media-videos`).
Max video length: 2 minutes. Thumbnail generated on-device before upload via `expo-video-thumbnails`.

---

## Step 0: Install Packages

```bash
npx expo install expo-video expo-video-thumbnails
```

---

## Step 1: Database Migrations (5 files)

### `20260228120000_add_notes_videos.sql`
- Create `notes_videos` table: `id, user_id, note_id (FK→notes), storage_path, thumbnail_storage_path, duration_ms, created_at`
- RLS policies (same pattern as `notes_images`)
- Update `notes_save_note` RPC: add `p_videos jsonb` param → insert into `notes_videos`, set `video-count` in feed_items extra_fields
- Update `notes_edit_note` RPC: add `p_deleted_video_ids uuid[]` + `p_new_videos jsonb[]` params, update `video-count` in feed_items

### `20260228121000_add_media_videos_bucket.sql`
- Create `media-videos` storage bucket
- File size limit: 500MB
- MIME types: `video/mp4`, `video/quicktime`, `video/webm`
- Also allow `image/jpeg` in this bucket (for thumbnails stored alongside videos)
- RLS: authenticated users can access their own folder `{user_id}/**`

### `20260228130000_add_gym_session_media.sql`
- Create `gym_session_images` table: `id, user_id, gym_session_id (FK→gym_sessions), storage_path, created_at`
- Create `gym_session_videos` table: `id, user_id, gym_session_id (FK→gym_sessions), storage_path, thumbnail_storage_path, duration_ms, created_at`
- Create `gym_session_voice` table: `id, user_id, gym_session_id (FK→gym_sessions), storage_path, duration_ms, created_at`
- Update `gym_save_session` RPC: add `p_images jsonb`, `p_videos jsonb`, `p_recordings jsonb` params → insert into respective tables, update feed_items extra_fields with counts
- Update `gym_edit_session` RPC: add delete + new arrays for all 3 media types, update feed_items counts
- Add `image-count`, `video-count`, `voice-count` to gym_sessions feed_items extra_fields

### `20260228131000_add_session_media.sql`
- Create `session_images` table: `id, user_id, session_id (FK→sessions), storage_path, created_at`
- Create `session_videos` table: `id, user_id, session_id (FK→sessions), storage_path, thumbnail_storage_path, duration_ms, created_at`
- Note: `sessions_voice` already exists for activity sessions
- Update `activities_save_activity` RPC: add `p_images jsonb`, `p_videos jsonb` params
- Update activity edit RPC similarly
- Add `image-count`, `video-count` to activity feed_items extra_fields

### `20260228140000_add_weight_media.sql`
- Create `weight_images` table: `id, user_id, weight_id (FK→weight), storage_path, created_at`
- Create `weight_videos` table: `id, user_id, weight_id (FK→weight), storage_path, thumbnail_storage_path, duration_ms, created_at`
- Create `weight_voice` table: `id, user_id, weight_id (FK→weight), storage_path, duration_ms, created_at`
- Update weight save RPC: add media params
- Add media counts to weight feed_items extra_fields

---

## Step 2: New Shared Types

Add to a shared types file or inline in DB layer:

```ts
type DraftVideo = {
  id: string;           // nanoid - local only
  uri: string;          // local video URI
  thumbnailUri: string; // local thumbnail URI
  durationMs: number;
};
```

---

## Step 3: New UI Components (in `features/notes/components/`)

### `DraftVideoItem.tsx`
- Thumbnail image (same height as `DraftImageItem` - h-48, cover mode)
- Play icon overlay (centered, semi-transparent background)
- Duration badge (bottom-left, e.g. "1:32")
- Delete button (X icon, top-right, red) with confirmation Alert
- `onPress` → open VideoPlayerModal

### `VideoPlayerModal.tsx`
- Full-screen modal
- Uses `expo-video` `VideoView` component with `useVideoPlayer` hook
- Native controls enabled (`nativeControls: true`)
- Close button (X icon, top-right)
- Supports both local draft URIs and remote signed URLs

---

## Step 4: Update `MediaToolbar.tsx`

**File:** `features/notes/components/MediaToolbar.tsx`

- Add `Video` (or `Clapperboard`) icon from lucide as third button (after ImagePlus, before FolderOpen)
- Add `onVideoSelected: (uri: string, thumbnailUri: string, durationMs: number) => void` to Props
- Add `showFolderButton?: boolean` prop (default true) — pass `false` from gym/weight/activity contexts
- On video button press:
  - Alert: "Take Video" / "Choose from Library" / "Cancel"
  - Use `ExpoImagePicker.launchCameraAsync({ mediaTypes: ['videos'], videoMaxDuration: 120 })`
  - Use `ExpoImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'] })`
  - After picking: `VideoThumbnails.getThumbnailAsync(uri, { time: 0 })` to generate thumbnail
  - Call `onVideoSelected(uri, thumbnailUri, durationMs)`

---

## Step 5: Notes — Add Video to Existing Pipeline

### `database/notes/save-note.ts`
- Accept `draftVideos: DraftVideo[]`
- Upload each video to `media-videos` bucket: `{user_id}/{uuid}.mp4`
- Upload each thumbnail to `media-videos` bucket: `{user_id}/{uuid}-thumb.jpg`
- Pass `p_videos: [{ storage_path, thumbnail_storage_path, duration_ms }]` to `notes_save_note` RPC

### `database/notes/edit-notes.ts`
- Accept `deletedVideoIds: string[]` + `newVideos: DraftVideo[]`
- Upload new videos + thumbnails
- Pass `p_deleted_video_ids` + `p_new_videos` to `notes_edit_note` RPC

### `database/notes/get-full-notes.ts`
- Fetch `notes_videos` records
- Generate signed URLs for video + thumbnail storage paths
- Add to `FullNotesSession` return type: `videos: { id, uri, thumbnailUri, duration_ms }[]`

### `app/notes/quick-notes/index.tsx`
- Add `draftVideos: DraftVideo[]` state
- Wire `onVideoSelected` from MediaToolbar
- Render `DraftVideoItem` list below images
- Pass `draftVideos` to `useSaveNotes`
- Persist to `useSaveDraft` AsyncStorage

### `features/notes/cards/edit-notes.tsx`
- Add `existingVideos[]`, `deletedVideoIds[]`, `newDraftVideos[]` state (mirror of image pattern)
- Render existing videos (with delete) + new draft videos
- Pass to `editNotes()` DB function

### `features/notes/cards/notes-expanded.tsx`
- Render `DraftVideoItem` (tappable → VideoPlayerModal) for each video in `notesSessionFull?.videos`

### `features/notes/cards/notes-feed.tsx`
- Add video count badge (camera icon + count) — same pattern as voice/image badges

### `features/feed/hooks/useFullSessions.ts`
- Update condition to also fetch if `videoCount > 0`

---

## Step 6: Gym Sessions — Add Full Media

### `database/gym/save-session.ts`
- Accept `draftImages`, `draftRecordings`, `draftVideos`
- Upload all to respective buckets
- Pass to updated `gym_save_session` RPC

### `database/gym/edit-session.ts`
- Accept delete arrays + new draft arrays for all 3 media types

### `database/gym/get-full-gym-session.ts`
- Fetch `gym_session_images`, `gym_session_videos`, `gym_session_voice`
- Generate signed URLs, return in `FullGymSession` type

### `features/gym/components/GymForm.tsx`
- Add `draftImages`, `draftRecordings`, `draftVideos` state
- Add `MediaToolbar` below the notes field (pass `folders={[]}`, `showFolderButton={false}`)
- Render `DraftRecordingItem`, `DraftImageItem`, `DraftVideoItem` lists
- Pass media state to `useSaveSession` hook

### Gym session expanded view
- Render images, videos, voice recordings if present

### Gym feed card
- Add image/video/voice count badges

---

## Step 7: Activity Sessions — Add Images + Video

### `database/activities/save-session.ts`
- Already handles `draftRecordings`
- Extend to accept `draftImages`, `draftVideos`
- Upload to `notes-images` and `media-videos` buckets
- Pass to updated `activities_save_activity` RPC

### `database/activities/get-full-activity-session.ts`
- Fetch `session_images`, `session_videos`
- Generate signed URLs, add to return type

### `app/activities/start-activity/index.tsx`
- Replace `RecordVoiceNotes` component inside the notes modal with the new `MediaToolbar`
- Add `draftImages`, `draftVideos` state alongside existing `draftRecordings`
- Render draft items in the modal

### Activity expanded view (`features/activities/cards/activity-feed-expanded/activity.tsx`)
- Add images and video display sections

---

## Step 8: Weight Tracking — Add Full Media

### `database/weight/` (extend save function)
- Accept `draftImages`, `draftRecordings`, `draftVideos`
- Upload, pass to RPC

### `app/weight/tracking/index.tsx`
- Add media state
- Add `MediaToolbar` below notes field (no folders, `showFolderButton={false}`)
- Render draft items
- Pass to `useSaveWeight`

### `features/weight/hooks/useSaveWeight.ts`
- Accept and forward media to DB layer

---

## Step 9: Translations

Add to `locales/en/notes.json` and `locales/fi/notes.json`:
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
| `features/notes/components/MediaToolbar.tsx` | Update — add video icon + callback |
| `features/notes/components/DraftVideoItem.tsx` | Create |
| `features/notes/components/VideoPlayerModal.tsx` | Create |
| `database/notes/save-note.ts` | Update |
| `database/notes/edit-notes.ts` | Update |
| `database/notes/get-full-notes.ts` | Update |
| `app/notes/quick-notes/index.tsx` | Update |
| `features/notes/cards/edit-notes.tsx` | Update |
| `features/notes/cards/notes-expanded.tsx` | Update |
| `features/notes/cards/notes-feed.tsx` | Update |
| `features/feed/hooks/useFullSessions.ts` | Update |
| `features/gym/components/GymForm.tsx` | Update |
| `database/gym/save-session.ts` | Update |
| `database/gym/edit-session.ts` | Update |
| `database/gym/get-full-gym-session.ts` | Update |
| `database/activities/save-session.ts` | Update |
| `database/activities/get-full-activity-session.ts` | Update |
| `app/activities/start-activity/index.tsx` | Update |
| `app/weight/tracking/index.tsx` | Update |
| `features/weight/hooks/useSaveWeight.ts` | Update |
| `locales/en/notes.json` | Update |
| `locales/fi/notes.json` | Update |
| 5x SQL migration files | Create |

## Implementation Order
1. Install packages
2. Write migrations
3. New UI components (DraftVideoItem, VideoPlayerModal)
4. Update MediaToolbar (add video)
5. Notes pipeline (DB layer → UI)
6. Gym sessions (DB layer → GymForm → expanded view)
7. Activity sessions
8. Weight tracking
9. Translations
