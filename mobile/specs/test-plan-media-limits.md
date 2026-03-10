# Test Plan: Media Limits & Optimization

Manual testing on a physical device (or emulator). Work through each section in order.

**Limits to remember:**
- Images: 10 per entry
- Videos: 3 per entry
- Voice recordings: 5 per entry
- Image file size: 10 MB max (before compression)
- Video file size: 100 MB max (after compression)
- Video duration: 5 minutes max
- Image resolution: resized to max 2048px longest side

---

## 1. Constants & Translations

- [ ] Open `constants/media-limits.ts` and confirm all values match the spec
- [ ] Switch app to English — verify all toast messages in `common.media.*` appear with correct wording
- [ ] Switch app to Finnish — verify all toast messages use proper ä/ö characters

---

## 2. Image Limits

Test in **every screen that has MediaToolbar**: Quick Notes, Notes Edit, Gym Session, Gym Edit, Activity Session, Todo Create, Todo Edit, Weight Tracking.

### 2.1 Count limit (camera)
- [ ] Add 10 images via camera
- [ ] Try to add an 11th — expect toast "Maximum 10 images reached" and camera does NOT open
- [ ] Verify the image button icon turns gray when at 10

### 2.2 Count limit (library)
- [ ] Add 10 images from library
- [ ] Try to add an 11th — expect toast and library does NOT open

### 2.3 File size limit
- [ ] Select an image larger than 10 MB from library (e.g. a raw/uncompressed photo)
- [ ] Expect toast "Image exceeds 10 MB limit" and image is NOT added

### 2.4 Compression & resize
- [ ] Take a photo with the camera — verify the full-screen loader appears with "Optimizing image..."
- [ ] Pick a high-resolution image (e.g. 48 MP) from library
- [ ] Save the entry, then check the uploaded file in Supabase Storage:
  - Longest side should be ≤ 2048px
  - Format should be JPG
  - Quality should be ~0.7 (file size significantly smaller than original)

### 2.5 Compression fallback
- [ ] If compression fails (hard to test manually), verify the original image is used instead (check code path)

---

## 3. Video Limits

Test in every screen that shows the video button (Quick Notes, Notes Edit, Gym, Todo, Weight).

### 3.1 Count limit (camera)
- [ ] Record 3 videos via camera
- [ ] Try to record a 4th — expect toast "Maximum 3 videos reached" and camera does NOT open
- [ ] Verify the video button icon turns gray when at 3

### 3.2 Count limit (library)
- [ ] Add 3 videos from library
- [ ] Try to add a 4th — expect toast and library does NOT open

### 3.3 Duration limit (library)
- [ ] Select a video longer than 5 minutes from library
- [ ] Expect toast "Video exceeds 5 minute limit" and video is NOT added
- [ ] Verify picker has `videoMaxDuration: 300` so OS may also enforce this

### 3.4 Duration limit (camera)
- [ ] Start recording a video via camera — the OS should stop recording at 5 minutes (`videoMaxDuration: 300`)

### 3.5 Video compression
- [ ] Select a video from library
- [ ] Verify full-screen loader shows "Compressing video..." with a percentage progress
- [ ] Verify progress updates (0% → ... → 100%)
- [ ] After save, check file in Supabase Storage — should be 720p max resolution

### 3.6 File size limit (after compression)
- [ ] Select a very large video (e.g. 10+ minute 4K — if it bypasses the duration check somehow)
- [ ] If compressed file still exceeds 100 MB, expect toast "Video exceeds 100 MB limit after compression"

### 3.7 Thumbnail generation
- [ ] After selecting a video, verify a thumbnail is generated and displayed
- [ ] Verify the thumbnail shows in the draft list with a play icon overlay
- [ ] Verify the duration badge is displayed correctly (e.g. "2:30")

### 3.8 Video playback
- [ ] Tap a draft video thumbnail — verify VideoPlayerModal opens
- [ ] Verify video plays correctly with native controls

---

## 4. Voice Recording Limits

### 4.1 Count limit
- [ ] Record 5 voice recordings
- [ ] Try to record a 6th — expect toast "Maximum 5 voice recordings reached" and recorder does NOT open
- [ ] Verify the mic button icon turns gray when at 5

---

## 5. Edit Screens — Existing Media Counts

This is the most critical section. The limits must account for **existing media already saved in the database**.

### 5.1 Notes Edit
- [ ] Create a note with 8 images, 2 videos, 4 voice recordings
- [ ] Open the note for editing
- [ ] Verify you can add 2 more images (total 10) but NOT 3
- [ ] Verify you can add 1 more video (total 3) but NOT 2
- [ ] Verify you can add 1 more voice recording (total 5) but NOT 2
- [ ] Verify icons turn gray at the correct total counts

### 5.2 Notes Edit — delete then re-add
- [ ] Open a note with 10 images for editing
- [ ] Verify image button is grayed out (at limit)
- [ ] Delete 2 existing images
- [ ] Verify image button becomes active again
- [ ] Add 2 new images — should succeed
- [ ] Try to add a 3rd — should be blocked (back at 10)

### 5.3 Gym Session Edit
- [ ] Create a gym session with 8 images, 2 videos, 4 voice recordings and save
- [ ] Open the session for editing → tap the Notes button
- [ ] Verify the notes button badge shows the total media count (14)
- [ ] Verify you can add 2 more images but NOT 3
- [ ] Verify you can add 1 more video but NOT 2
- [ ] Verify you can add 1 more voice recording but NOT 2
- [ ] Verify icons turn gray at the correct total counts

### 5.4 Gym Session Edit — delete then re-add
- [ ] Open a gym session at max images (10) for editing
- [ ] Verify image button is grayed out in the notes modal
- [ ] Delete 3 existing images → image button should become active
- [ ] Add 3 new → should succeed
- [ ] Try adding 1 more → should be blocked

### 5.5 Todo Edit
- [ ] Create a todo with a task that has 8 images, 2 videos, 4 voice recordings
- [ ] Open for editing
- [ ] Verify you can add 2 more images to that task but NOT 3
- [ ] Verify you can add 1 more video but NOT 2
- [ ] Verify you can add 1 more voice recording but NOT 2
- [ ] Verify limits are **per-task** (a different task in the same list has independent limits)

### 5.6 Todo Edit — per-task independence
- [ ] Create a todo list with 2 tasks
- [ ] Add 10 images to task 1
- [ ] Verify task 1's image button is grayed out
- [ ] Verify task 2's image button is still active — add images to task 2 independently

---

## 6. Create Screens — Limits from Zero

Verify limits work on fresh create screens where existing count = 0.

### 6.1 Quick Notes
- [ ] Create a new note → add 10 images, 3 videos, 5 voice recordings
- [ ] Verify all buttons gray out at limits
- [ ] Save successfully

### 6.2 New Gym Session
- [ ] Start a new gym session → open notes modal
- [ ] Add 10 images, 3 videos, 5 voice recordings
- [ ] Verify all buttons gray out at limits
- [ ] Save successfully

### 6.3 New Activity Session
- [ ] Start a new activity → open notes modal
- [ ] Add 10 images, 3 videos, 5 voice recordings
- [ ] Verify all buttons gray out at limits
- [ ] Save successfully

### 6.4 New Todo
- [ ] Create a new todo → add media to a task
- [ ] Verify per-task limits work (10 images, 3 videos, 5 voice per task)

### 6.5 Weight Tracking
- [ ] Add a new weight entry
- [ ] Add 10 images, 3 videos, 5 voice recordings
- [ ] Verify all buttons gray out at limits

---

## 7. expo-image (Rendering Optimization)

### 7.1 DraftImageItem uses expo-image
- [ ] Add an image to any entry
- [ ] Verify it renders (no blank/broken image)
- [ ] Verify `cachePolicy="memory-disk"` is working — scroll away and back, image should load instantly

### 7.2 DraftVideoItem uses expo-image for thumbnails
- [ ] Add a video to any entry
- [ ] Verify the thumbnail renders correctly with play icon overlay
- [ ] Verify the thumbnail uses expo-image (smooth loading with transition)

### 7.3 ImageViewerModal
- [ ] Add multiple images to a note
- [ ] Tap an image to open the full-screen viewer
- [ ] Verify horizontal swiping between images works
- [ ] Verify the "1 / N" counter badge appears and updates
- [ ] Verify pinch-to-zoom works
- [ ] Verify double-tap to zoom in/out works
- [ ] Verify swipe down to dismiss works
- [ ] Verify background dims when dragging to dismiss

---

## 8. Storage Cleanup on Delete

### 8.1 Activity session deletion
- [ ] Create an activity session with images, videos, and voice recordings — note the storage paths
- [ ] Delete the session from the feed
- [ ] Check Supabase Storage buckets (`notes-images`, `media-videos`, `notes-voice`) — files should be removed

### 8.2 Gym session deletion
- [ ] Create a gym session with media
- [ ] Delete from feed
- [ ] Verify storage files are removed

### 8.3 Notes deletion
- [ ] Create a note with media
- [ ] Delete the note
- [ ] Verify storage files are removed from all 3 buckets

### 8.4 Todo deletion
- [ ] Create a todo with media on multiple tasks
- [ ] Delete the todo
- [ ] Verify all task media files are removed from storage

### 8.5 Weight entry deletion
- [ ] Create a weight entry with media
- [ ] Delete from feed
- [ ] Verify storage files are removed

### 8.6 Delete with no media
- [ ] Delete an entry that has no media — should succeed without errors

---

## 9. Database-Level Safety Net (SQL Migration)

Test that server-side limits work independently of the client. These can be tested via Supabase SQL editor or by temporarily commenting out client-side checks.

### 9.1 Storage bucket file size limits
- [ ] Verify `notes-images` bucket has `file_size_limit = 10485760` (10 MB)
- [ ] Verify `media-videos` bucket has `file_size_limit = 104857600` (100 MB)
- [ ] Verify `notes-voice` bucket has `file_size_limit = 10485760` (10 MB)
- [ ] Verify `feedback-images` bucket has `file_size_limit = 10485760` (10 MB)
- [ ] Try uploading a file exceeding the limit directly via Supabase — expect 413 rejection

### 9.2 Save function count validation
- [ ] Call `activities_save_activity` with 11 images in the JSONB array — expect exception "Maximum 10 images"
- [ ] Call `gym_save_session` with 4 videos — expect exception "Maximum 3 videos"
- [ ] Call `notes_save_note` with 6 voice recordings — expect exception "Maximum 5 voice recordings"
- [ ] Call `todo_save_todo` with a task having 11 images — expect exception "Maximum 10 images per task"
- [ ] Call `weight_save_weight` with 11 images — expect exception

### 9.3 Edit function count validation
- [ ] Call `notes_edit_note` on a note with 8 existing images, passing 3 new images — expect exception (8 + 3 = 11 > 10)
- [ ] Call `gym_edit_session` on a session with 3 existing videos, passing 1 new video — expect exception (3 + 1 = 4 > 3)
- [ ] Call `todo_edit_todo` on a task with 4 existing voice recordings, passing 2 new — expect exception (4 + 2 = 6 > 5)

### 9.4 Edit function with deletions
- [ ] Call `notes_edit_note` on a note with 10 images, deleting 2 and adding 2 — should succeed (10 - 2 + 2 = 10)
- [ ] Call `gym_edit_session` on a session with 3 videos, deleting 1 and adding 1 — should succeed (3 - 1 + 1 = 3)

---

## 10. Edge Cases

### 10.1 Cancel after compression starts
- [ ] Select a large video → compression loader appears
- [ ] Navigate away or close the modal while compressing
- [ ] Verify the app doesn't crash and the loader disappears

### 10.2 Multiple rapid additions
- [ ] Quickly tap the image button multiple times in succession
- [ ] Verify you don't exceed the limit by race condition

### 10.3 Network failure during upload
- [ ] Add media, then turn off network
- [ ] Try to save — verify error toast appears and data is not lost

### 10.4 Empty entry deletion (no media)
- [ ] Create and delete entries without any media
- [ ] Verify no errors from the storage cleanup code (it should gracefully handle empty arrays)

### 10.5 Mixed delete + add in edit
- [ ] Edit a note: delete all 3 existing images, add 5 new ones
- [ ] Verify the count is tracked correctly (0 + 5 = 5, under limit)
- [ ] Save and verify all changes persisted

### 10.6 Language-specific toast messages
- [ ] In English: trigger each limit toast and verify the message includes the correct number
- [ ] In Finnish: same — verify ä/ö characters display correctly

---

## 11. Cross-Screen Consistency

Verify every screen using MediaToolbar passes correct counts:

| Screen | File | Counts passed correctly? |
|--------|------|------------------------|
| Quick Notes (create) | `app/notes/quick-notes/index.tsx` | draft only (correct, new entry) |
| Notes Edit | `features/notes/cards/edit-notes.tsx` | existing + new (correct) |
| Gym Session (create) | `features/gym/components/GymForm.tsx` → `GymNotesModal` | existing + draft (correct after fix) |
| Gym Session (edit) | same as above | existing + draft (correct after fix) |
| Activity Session (create) | `features/activities/components/notesModal.tsx` | draft only (correct, new entry) |
| Todo Create | `app/todo/create-todo/index.tsx` | draft only (correct, new entry) |
| Todo Edit | `features/todo/cards/todo-edit.tsx` | existing + draft per task (correct) |
| Weight Tracking (create) | `app/weight/tracking/index.tsx` | draft only (correct, new entry) |

- [ ] Verify each row in the table above by adding media up to the limit on each screen

---

## 12. Gym Notes Button Badge

- [ ] New gym session: add 3 images + 1 video + 2 voice → badge shows "(6)"
- [ ] Existing gym session with 5 existing media: open edit → badge should show "(5)" before adding anything
- [ ] Add 2 more draft items → badge should show "(7)"
- [ ] Verify badge disappears when total is 0
