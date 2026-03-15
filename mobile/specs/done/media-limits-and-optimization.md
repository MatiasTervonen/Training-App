# Media Limits & Optimization

## Overview

Review of current media handling across the app, with a plan to add limits, compression, rendering optimization, and storage cleanup. Currently there are no count or size limits on media (except feedback's 3-image cap), no video compression, and no storage cleanup on deletion.

---

## Current State

### Media Types Supported

| Type | Format | Compression | Current Limits |
|------|--------|-------------|----------------|
| Images | PNG/JPG/WebP | quality: 0.7 | **None** (unlimited count) |
| Videos | MP4 | **None** | Camera: 120s, Library: **no limit** |
| Voice | M4A | High quality mono | **None** |

### Where MediaToolbar Is Used

- Activities (session notes)
- Todos (task notes)
- Notes
- Gym sessions
- Weight entries

### Storage Buckets

| Bucket | Content | Path Structure |
|--------|---------|----------------|
| `notes-images` | All images | `{userId}/{uuid}.{ext}` |
| `notes-voice` | Voice recordings | `{userId}/{uuid}.m4a` |
| `media-videos` | Videos + thumbnails | `{userId}/{uuid}.mp4` + `{userId}/{uuid}-thumb.jpg` |

### How Media Is Rendered

- **Draft state:** `DraftImageItem`, `DraftVideoItem`, `DraftRecordingItem` components
- **Published state:** Same draft components reused with `showDeleteButton={false}`
- **Image gallery:** `ImageViewerModal` with horizontal FlatList, pinch-to-zoom, swipe navigation
- **Video playback:** `VideoPlayerModal` with expo-video native controls
- **Audio playback:** Inline player with play/pause, seekable progress bar, duration display

### Critical Gaps

1. **No media count limits** — user can attach unlimited images/videos/recordings to any entry
2. **No file size validation** — no client-side check before upload; a 2GB library video would attempt upload
3. **No video compression** — raw upload from device; 2-min 4K video can be 500MB+
4. **No image resizing** — no max resolution; 48MP+ phone images are 5-10MB even at 70% quality
5. **Media rendered with `.map()` not FlatList** — all media items render at once, no virtualization
6. **Signed URLs regenerated every fetch** — 1-hour expiration, no caching beyond React Query
7. **No storage cleanup on deletion** — deleting an entry orphans files in Supabase storage

---

## Industry Reference — Platform Limits

| Platform | Max Images | Max Video Length | Max File Size |
|----------|-----------|-----------------|---------------|
| X (Twitter) | 4 per post | 2:20 (free) | 5MB images, 512MB video |
| Facebook | Album-based | 240min feed, 90s reels | 4GB video, 30MB images |
| Instagram | 20 per carousel | 20min reels | ~100MB practical |
| WhatsApp | Per message | N/A | 16MB media |

Every major platform enforces strict limits on count, duration, and file size.

---

## Recommended Limits for This App

Since this is a training/fitness app (not a social media platform), limits should be tighter:

| Media Type | Limit | Reasoning |
|-----------|-------|-----------|
| Images per entry | **10** | Enough for workout progress, form checks |
| Videos per entry | **3** | Form check videos, exercise demos |
| Voice recordings per entry | **5** | Quick voice notes about sets/exercises |
| Video duration (camera + library) | **5 minutes** | Long enough for a full exercise set |
| Image max file size | **10 MB** (before compression) | After compression typically 1-3 MB |
| Video max file size | **100 MB** (after compression) | Compressed 720p is well within this |
| Image max resolution | **2048px** (longest side) | Good quality without wasting storage |

---

## Implementation Plan

### Phase 1: Enforce Limits (P0 — Critical)

**Goal:** Prevent abuse, data bombs, and runaway storage costs. Client-side checks provide good UX; database-level checks are the real safety net.

#### 1.0 Database-level limits (server-side safety net)

Client-side limits are easily bypassed. The database must enforce limits independently so no amount of client bugs or API abuse can exceed them.

##### Storage bucket file size limits

Set `file_size_limit` on each Supabase Storage bucket to hard-cap individual file uploads:

```sql
UPDATE storage.buckets SET file_size_limit = 10485760  WHERE id = 'notes-images';    -- 10 MB
UPDATE storage.buckets SET file_size_limit = 104857600 WHERE id = 'media-videos';    -- 100 MB
UPDATE storage.buckets SET file_size_limit = 10485760  WHERE id = 'notes-voice';     -- 10 MB
UPDATE storage.buckets SET file_size_limit = 10485760  WHERE id = 'feedback-images'; -- 10 MB
```

Supabase rejects uploads exceeding this limit with a 413 error before the file is stored.

##### RPC-level count validation

All save RPC functions (`activities_save_activity`, `todo_save_todo`, `notes_save_note`, `gym_save_session`, `weight_save_weight`) receive media as JSONB arrays. Add validation at the top of each function before inserting:

```sql
-- Validate media counts in the JSONB arrays being passed in
IF jsonb_array_length(COALESCE(p_images, '[]'::jsonb)) > 10 THEN
  RAISE EXCEPTION 'Maximum 10 images per entry';
END IF;
IF jsonb_array_length(COALESCE(p_videos, '[]'::jsonb)) > 3 THEN
  RAISE EXCEPTION 'Maximum 3 videos per entry';
END IF;
IF jsonb_array_length(COALESCE(p_voice, '[]'::jsonb)) > 5 THEN
  RAISE EXCEPTION 'Maximum 5 voice recordings per entry';
END IF;
```

For edit RPC functions that add media incrementally, check existing count + new count:

```sql
-- Example for session_images in an edit function
DECLARE v_existing_count INT;
BEGIN
  SELECT count(*) INTO v_existing_count
  FROM session_images WHERE session_id = p_session_id;

  IF v_existing_count + jsonb_array_length(COALESCE(p_new_images, '[]'::jsonb)) > 10 THEN
    RAISE EXCEPTION 'Maximum 10 images per entry (currently %)', v_existing_count;
  END IF;
END;
```

##### Summary of database-level limits

| Layer | What it enforces | How |
|-------|-----------------|-----|
| Storage bucket `file_size_limit` | Max file size per upload | Supabase rejects oversized uploads (413) |
| RPC count validation (save) | Max media count on create | `jsonb_array_length()` check before insert |
| RPC count validation (edit) | Max media count on edit | Existing count + new count check before insert |

> **Note:** Database triggers on the media tables (e.g., `BEFORE INSERT` checking row count) were considered but rejected — they would fire per-row inside the RPC's `INSERT ... SELECT FROM jsonb_array_elements()`, making the count check unreliable mid-transaction. Validating upfront in the RPC is simpler and correct.

#### 1.1 Create media limits constants

Create `constants/media-limits.ts`:

```typescript
export const MEDIA_LIMITS = {
  MAX_IMAGES: 10,
  MAX_VIDEOS: 3,
  MAX_VOICE_RECORDINGS: 5,
  MAX_IMAGE_SIZE_MB: 10,
  MAX_VIDEO_SIZE_MB: 100,
  MAX_VIDEO_DURATION_SEC: 300,
  MAX_IMAGE_RESOLUTION: 2048,
}
```

#### 1.2 Enforce counts in MediaToolbar

- Accept `currentImageCount`, `currentVideoCount`, `currentVoiceCount` props
- Before opening picker, check against limits
- If limit reached, show toast: "Maximum 10 images reached"
- Disable the button visually when limit is reached (gray out icon)

#### 1.3 Enforce file size after selection

- After `launchImageLibraryAsync` / `launchCameraAsync`, check the selected asset's `fileSize`
- If over limit, show toast with the limit and reject the selection
- For video from library, also enforce `videoMaxDuration: 300` (currently only set on camera)

#### 1.4 Add translations

Add limit-related toast messages to all locale files.

### Phase 2: Compression (P1 — High)

**Goal:** Reduce upload sizes, especially for video.

#### 2.1 Image compression & resizing

- Use `react-native-compressor` `Image.compress()` with `maxWidth: 2048`, `maxHeight: 2048`
- Set `quality: 0.7` and `output: "jpg"`
- Apply after picker selection, before adding to draft state

#### 2.2 Video compression

- Use `react-native-compressor` `Video.compress()` with `maxSize: 720`
- Show compression progress indicator (loading overlay or progress bar) via `onProgress` callback
- Compress after selection, before adding to draft state

#### 2.3 Upload progress

- Show per-file upload progress using Supabase storage upload events or XMLHttpRequest
- Show overall progress bar during save

### Phase 3: Rendering Optimization (P2 — Medium)

**Goal:** Handle media-heavy entries without performance degradation.

#### 3.1 Switch to expo-image

Replace React Native `<Image>` with `expo-image` for all published media rendering:
- Built-in disk caching (survives signed URL expiration for cached content)
- Blur hash or thumbhash placeholders while loading
- Progressive loading
- Better memory management

#### 3.2 Virtualize media lists

When media count > 4, use horizontal `FlatList` instead of `.map()`:
- Add `maxToRenderPerBatch={3}`
- Add `windowSize={5}`
- Add `removeClippedSubviews={true}`
- Show count badge: "1 / 10"

For 4 or fewer items, `.map()` is fine — overhead of FlatList isn't worth it.

#### 3.3 Feed card collapsed view

In the feed card (collapsed state), don't load all media:
- Show first image as cover thumbnail + badge "+4 more"
- Show video count icon + total duration
- Show voice recording count
- Only fetch full media when card is expanded (already partially doing this)

#### 3.4 Signed URL caching

- Store signed URLs with their generation timestamp
- Only regenerate when URL is older than 50 minutes (buffer before 60-min expiry)
- Consider generating with longer expiry (e.g., 24 hours) for non-sensitive content

### Phase 4: Storage Cleanup (P3 — Low)

**Goal:** Prevent orphaned files from accumulating storage costs.

#### 4.1 Client-side cleanup on delete

When deleting an entry (activity, todo, note, gym session, weight entry):
1. Fetch all media storage paths for that entry
2. Delete files from Supabase storage buckets
3. Then delete the database record

#### 4.2 Supabase Edge Function for cascade cleanup (optional)

- Database webhook on row delete → triggers Edge Function
- Edge Function reads storage paths from the deleted row and removes files
- More reliable than client-side (handles app crashes, offline deletes)

#### 4.3 Orphan cleanup job (optional)

- Scheduled Edge Function (weekly/monthly)
- Lists all files in storage buckets
- Cross-references against database records
- Deletes files with no matching record

---

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `constants/media-limits.ts` | Central limits constants |

### Modified Files

| File | Changes |
|------|---------|
| `features/notes/components/MediaToolbar.tsx` | Accept count props, enforce limits, file size validation |
| `features/notes/components/DraftImageItem.tsx` | Switch to expo-image |
| `features/notes/components/DraftVideoItem.tsx` | Switch to expo-image for thumbnails |
| `database/activities/save-session.ts` | Add image resize + video compression before upload |
| `database/todo/save-todo.ts` | Same compression logic |
| `features/activities/cards/activity-feed-expanded/activity.tsx` | FlatList for media, expo-image |
| `features/todo/cards/todo-expanded.tsx` | FlatList for media, expo-image |
| `features/gym/cards/gym-expanded.tsx` | FlatList for media, expo-image |
| `locales/*.ts` | Add limit/error translations |

### New Dependencies

| Package | Purpose | Phase |
|---------|---------|-------|
| `react-native-compressor` | Image resizing + video compression | Phase 2 |
| `expo-image` | Optimized image rendering | Phase 3 (already installed) |

---

## Priority Summary

| Priority | Phase | What | Impact |
|----------|-------|------|--------|
| **P0** | 1 | Count limits + file size validation | Prevents abuse and failed uploads |
| **P1** | 2 | Image resize + video compression | Reduces storage costs and upload times |
| **P2** | 3 | expo-image + FlatList + URL caching | Better performance with many media items |
| **P3** | 4 | Storage cleanup on delete | Prevents long-term storage cost creep |
