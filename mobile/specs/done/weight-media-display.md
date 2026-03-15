# Show Media in Weight Expanded Views

## Context
When users add weight tracking entries with media (images, voice, video), the media is saved to the database but never displayed anywhere. The weight expanded card and analytics table only show weight value and notes. We need to fetch and display media in both places, following the same pattern used by the notes feature.

## Files to Modify/Create

### 1. Create `mobile/database/weight/get-full-weight.ts`
- New file, mirrors `mobile/database/notes/get-full-notes.ts`
- Fetches from `weight_images`, `weight_videos`, `weight_voice` tables by `weight_id`
- Generates signed URLs from Supabase storage buckets (`notes-images`, `media-videos`, `notes-voice`)
- Exports `FullWeightSession` type and `getFullWeightSession(weightId)` function

### 2. Update `mobile/features/feed/hooks/useFullSessions.ts`
- Add weight media fetching following the notes pattern
- Check `extra_fields` for `image-count`, `video-count`, `voice-count`
- Only fetch if weight entry has media (optimization)
- Return `weightSessionFull`, `weightSessionError`, `isLoadingWeightSession`

### 3. Update `mobile/features/weight/cards/weight-expanded.tsx`
- Accept new props: `weightMedia`, `isLoadingMedia`, `mediaError`
- Display images using `DraftImageItem` + `ImageViewerModal`
- Display videos using `DraftVideoItem`
- Display voice recordings using `DraftRecordingItem`
- Show loading skeletons while media loads (reuse `NotesVoiceSkeleton`)

### 4. Update `mobile/features/feed/SessionFeed.tsx`
- Pass weight media data from `useFullSessions` to `WeightSession`

### 5. Update `mobile/features/weight/RowAllDataTable.tsx`
- When expanded, fetch media for that specific weight entry using `useQuery` + `getFullWeightSession`
- Display media below notes using same components

### Reused Components (no changes needed)
- `mobile/features/notes/components/DraftImageItem.tsx`
- `mobile/features/notes/components/DraftVideoItem.tsx`
- `mobile/features/notes/components/draftRecording.tsx`
- `mobile/features/notes/components/ImageViewerModal.tsx`
- `mobile/components/skeletetons.tsx` (`NotesVoiceSkeleton`)

## Verification
- Add a weight entry with an image, voice recording, and video
- Expand the weight card in the feed — media should display below notes/weight
- Go to weight analytics — expand a row — media should display there too
