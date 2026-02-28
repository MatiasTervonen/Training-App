# Notes Images — Feature Spec

## Context
Add image support to the notes feature. Users can attach images to notes by picking from their photo library or taking a new photo with the camera. Images are stored in a new Supabase storage bucket and tracked in a new `notes_images` database table — following the same pattern as the existing voice recordings (`notes_voice` table + `notes-voice` bucket).

---

## 1. Install Dependency

```bash
npx expo install expo-image-picker
```

`expo-image-picker` provides both:
- `launchImageLibraryAsync()` — pick from phone gallery
- `launchCameraAsync()` — open camera and take a photo

No extra native config needed — Expo manages camera/photo library permissions automatically via the config plugin.

---

## 2. Supabase Storage Bucket

Create a new storage bucket in Supabase dashboard (or via migration):

- **Bucket name:** `notes-images`
- **Public:** No (private, use signed URLs like `notes-voice`)
- **File size limit:** 10 MB
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`

**Storage policies** (same pattern as `notes-voice`):
- Users can upload to their own folder: `{user_id}/*`
- Users can read/delete their own files

---

## 3. Database Migration

**New file:** `supabase/migrations/YYYYMMDDHHMMSS_add_notes_images.sql`

```sql
-- notes_images table (mirrors notes_voice pattern)
CREATE TABLE notes_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notes_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own note images"
  ON notes_images FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own note images"
  ON notes_images FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own note images"
  ON notes_images FOR DELETE USING (auth.uid() = user_id);
```

**Update RPC functions** — modify `notes_save_note` and `notes_edit_note` to accept an images array parameter (same pattern as `p_draftrecordings`):

```sql
-- DROP old signatures first, then CREATE new ones (never CREATE OR REPLACE)

-- notes_save_note: add p_images jsonb[] parameter
-- Each image element: { "storage_path": "user_id/uuid.jpg" }
-- Loop through p_images and insert into notes_images

-- notes_edit_note: add p_deleted_image_ids uuid[] and p_new_images jsonb[]
-- Delete removed images (from table + storage cleanup)
-- Insert new images into notes_images
```

---

## 4. Database Layer

**Edit:** `mobile/database/notes/save-note.ts`
- Add `draftImages` to the props type: `{ id: string; uri: string }[]`
- Upload each image to `notes-images` bucket (path: `{user_id}/{randomUUID}.jpg`)
- Use `expo-file-system/next` `File` to read bytes (same as voice upload pattern)
- Pass `p_images` array to the `notes_save_note` RPC call
- On error, cleanup orphaned image uploads (same as voice cleanup pattern)

**Edit:** `mobile/database/notes/edit-notes.ts`
- Add `deletedImageIds` and `newImages` to the props type
- Upload new images, pass both arrays to `notes_edit_note` RPC
- Cleanup orphaned uploads on error

**Edit:** `mobile/database/notes/get-full-notes.ts`
- Fetch `notes_images` for the note (alongside voice recordings)
- Generate signed URLs for each image (1-hour expiry, same as voice)
- Return images array in the response

---

## 5. Image Picker Component

**New file:** `mobile/features/notes/components/ImagePicker.tsx`

- Shows an "Add Image" button (use `ImagePlus` icon from `lucide-react-native`)
- On press, shows an action sheet / bottom sheet with two options:
  - "Take Photo" — calls `launchCameraAsync()`
  - "Choose from Library" — calls `launchImageLibraryAsync()`
- Image picker config:
  - `mediaTypes: ImagePicker.MediaType.Images`
  - `quality: 0.7` (compress to reduce upload size)
  - `allowsEditing: false` (no cropping forced)
- Calls `onImageSelected(uri)` callback with the local file URI
- Handles permission denied gracefully (toast with "Permission required" message)

---

## 6. Draft Image Display Component

**New file:** `mobile/features/notes/components/DraftImageItem.tsx`

- Displays a thumbnail of the selected image (using `<Image>` from `react-native` or `expo-image`)
- Shows a delete button (X icon) to remove the image before saving
- Tapping the image opens it in a larger preview modal (optional, can be added later)

---

## 7. Quick Notes Page (Create)

**Edit:** `mobile/app/notes/quick-notes/index.tsx`

- Add `draftImages` state: `useState<{ id: string; uri: string }[]>([])`
- Import and render `ImagePicker` component (below voice recording section)
- On image selected: push to `draftImages` with `nanoid()` id
- Render `DraftImageItem` for each draft image (with delete callback)
- Pass `draftImages` to `useSaveNotes` hook
- Update `resetNote` to also clear `draftImages`
- Update `useSaveDraft` to include `draftImages` in draft persistence

---

## 8. Edit Notes Card

**Edit:** `mobile/features/notes/cards/edit-notes.tsx`

- Add image management (same pattern as voice recording edit):
  - Show existing images (from signed URLs)
  - Allow deleting existing images (track `deletedImageIds`)
  - Allow adding new images (track `newDraftImages`)
- Pass `deletedImageIds` and `newDraftImages` to the edit database function

---

## 9. Expanded Notes View

**Edit:** `mobile/features/notes/cards/notes-expanded.tsx`

- Display images section below the note text (before voice recordings)
- Show images in a vertical list or 2-column grid layout
- Each image is pressable — opens full-screen image viewer modal
- Show image count in the feed card (`extra_fields` update)

---

## 10. Feed Integration

**Edit:** `extra_fields` for notes feed items to include `image-count`:
```ts
{
  notes: string;
  "voice-count"?: number;
  "image-count"?: number;
}
```

Update `notes-feed.tsx` card to show an image indicator (small icon + count) when `image-count > 0`.

---

## 11. Translations

**Edit:** `mobile/locales/en/notes.json` — add:
```json
"images": {
  "addImage": "Add Image",
  "takePhoto": "Take Photo",
  "chooseFromLibrary": "Choose from Library",
  "permissionRequired": "Camera or photo library permission is required.",
  "cancel": "Cancel"
}
```

**Edit:** `mobile/locales/fi/notes.json` — add Finnish equivalents:
```json
"images": {
  "addImage": "Lisää kuva",
  "takePhoto": "Ota kuva",
  "chooseFromLibrary": "Valitse kirjastosta",
  "permissionRequired": "Kameran tai kuvakirjaston käyttöoikeus vaaditaan.",
  "cancel": "Peruuta"
}
```

---

## 12. Files Summary

| Action | File |
|--------|------|
| **Install** | `expo-image-picker` |
| **Create** | `supabase/migrations/YYYYMMDDHHMMSS_add_notes_images.sql` |
| **Create** | `mobile/features/notes/components/ImagePicker.tsx` |
| **Create** | `mobile/features/notes/components/DraftImageItem.tsx` |
| **Edit** | `mobile/database/notes/save-note.ts` |
| **Edit** | `mobile/database/notes/edit-notes.ts` |
| **Edit** | `mobile/database/notes/get-full-notes.ts` |
| **Edit** | `mobile/features/notes/hooks/useSaveNotes.ts` |
| **Edit** | `mobile/features/notes/hooks/useSaveDraft.ts` |
| **Edit** | `mobile/app/notes/quick-notes/index.tsx` |
| **Edit** | `mobile/features/notes/cards/edit-notes.tsx` |
| **Edit** | `mobile/features/notes/cards/notes-expanded.tsx` |
| **Edit** | `mobile/features/notes/cards/notes-feed.tsx` |
| **Edit** | `mobile/locales/en/notes.json` |
| **Edit** | `mobile/locales/fi/notes.json` |
| **Edit** | Supabase RPC functions (`notes_save_note`, `notes_edit_note`) |

---

## 13. Verification

1. Open Quick Notes → "Add Image" button visible below voice recording
2. Tap "Add Image" → action sheet shows "Take Photo" and "Choose from Library"
3. "Choose from Library" → phone gallery opens, pick image → thumbnail appears in draft
4. "Take Photo" → camera opens, take photo → thumbnail appears in draft
5. Delete a draft image → removed from list
6. Save note with images → images uploaded to `notes-images` bucket, rows in `notes_images` table
7. View note in expanded view → images displayed with signed URLs
8. Edit note → can delete existing images and add new ones
9. Delete note → images cascade-deleted from table (storage cleanup via DB trigger or app-side)
10. Check Supabase Storage: files exist under `notes-images/{user_id}/`
