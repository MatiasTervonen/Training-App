# Notes Media — Image Support in Tiptap Editor

## Context
The notes feature currently supports rich text only (bold, italic, headings, lists, etc.) via Tiptap with `StarterKit`. Users should be able to embed images directly inside their notes.

**Backend status:** The database table (`notes_images`), RPC functions (`notes_save_note`, `notes_edit_note`), and storage bucket (`notes-images`) all already exist. No database migrations needed.

**Approach:** Use Tiptap's official `@tiptap/extension-image` to embed images inline in the editor. Images are uploaded to Supabase Storage, and a signed URL is inserted into the editor content as an `<img>` tag.

---

## 1. Install Tiptap Image Extension

```bash
npm install @tiptap/extension-image
```

---

## 2. Add Image Support to TiptapEditor

**Edit:** `web/features/notes/components/TiptapEditor.tsx`

### 2a. Add the Image extension

```ts
import Image from "@tiptap/extension-image";

// In the extensions array:
extensions: [
  StarterKit,
  Placeholder.configure({ placeholder }),
  Image.configure({
    HTMLAttributes: {
      class: "rounded-md max-w-full h-auto",
    },
  }),
],
```

### 2b. Add an image upload toolbar button

- Import `ImageIcon` from `lucide-react`
- Add a hidden `<input type="file" accept="image/*" />` with a ref
- Add a `ToolbarButton` that triggers the file input click
- On file selection:
  1. Validate file type (JPEG, PNG, WebP) and size (max 10 MB)
  2. Get the user ID from Supabase auth (`supabase.auth.getClaims()`)
  3. Generate a storage path: `{userId}/{crypto.randomUUID()}.{ext}`
  4. Upload to the `notes-images` bucket via `supabase.storage.from("notes-images").upload(path, file)`
  5. Get a signed URL via `supabase.storage.from("notes-images").createSignedUrl(path, 60 * 60 * 24 * 365)` (1 year)
  6. Insert into the editor: `editor.chain().focus().setImage({ src: signedUrl }).run()`
  7. Track the uploaded image in component state: `{ storage_path: path }` — pass this up to the parent via a new `onImagesChange` callback

### 2c. Toolbar placement

Add after the horizontal rule button, separated by a `<Divider />`:

```tsx
<Divider />
<ToolbarButton
  onClick={() => fileInputRef.current?.click()}
  isActive={false}
  icon={<ImageIcon size={16} />}
  label={t("notes.toolbar.image", "Insert image")}
/>
```

### 2d. Image display in the editor

The `@tiptap/extension-image` handles rendering `<img>` tags automatically. The Tailwind `prose prose-invert` classes on the expanded view already handle image styling. Add this CSS to `app/global.css` if images don't display correctly in the editor:

```css
.tiptap-editor img {
  max-width: 100%;
  height: auto;
  border-radius: 0.375rem;
}
```

---

## 3. Update Quick-Notes Page

**Edit:** `web/app/(app)/notes/quick-notes/page.tsx`

### 3a. Add state for images

```ts
const [uploadedImages, setUploadedImages] = useState<{ storage_path: string }[]>([]);
```

### 3b. Pass onImagesChange to TiptapEditor

```tsx
<TiptapEditor
  content={notes}
  onChange={setNotes}
  onImagesChange={setUploadedImages}
  placeholder={t("notes.notesPlaceholder")}
  label={t("notes.notesLabel")}
/>
```

### 3c. Pass images to save function

Update the `saveNotes` call to include images:

```ts
saveNotes({
  title,
  notes,
  folderId: selectedFolderId,
  images: uploadedImages,
});
```

### 3d. Cleanup on reset

When `resetNotes` is called, also clean up any uploaded images from Supabase storage (delete orphaned files).

---

## 4. Update Database Functions

**Edit:** `web/database/notes/save-notes.ts`

Update the props type and RPC call to pass image parameters:

```ts
type props = {
  title: string;
  notes: string;
  folderId?: string | null;
  images?: { storage_path: string }[];
};

export async function saveNote({ title, notes, folderId, images }: props) {
  const supabase = createClient();

  const { error } = await supabase.rpc("notes_save_note", {
    p_title: title,
    p_notes: notes,
    p_folder_id: folderId ?? undefined,
    p_images: JSON.stringify(images ?? []),
  });

  // ... existing error handling
}
```

**Edit:** `web/database/notes/edit-notes.ts`

Add parameters for new/deleted images:

```ts
type Props = {
  id: string;
  title: string;
  notes: string;
  updated_at: string;
  folderId?: string | null;
  newImages?: { storage_path: string }[];
  deletedImageIds?: string[];
};
```

Pass all parameters to the `notes_edit_note` RPC call.

---

## 5. Images Display in Expanded View

**Edit:** `web/features/notes/cards/notes-expanded.tsx`

Images embedded via `@tiptap/extension-image` are already part of the HTML content and will render automatically with `dangerouslySetInnerHTML`. The signed URLs embedded in the HTML are long-lived (1 year). No additional work needed for image display in expanded view — the `prose prose-invert` classes handle styling.

---

## 6. Update Edit Note Card

**Edit:** `web/features/notes/cards/notes-edit.tsx`

### 6a. Track image changes

- The TiptapEditor already handles inline images via the Image extension
- New images uploaded during editing are tracked via `onImagesChange`
- Dirty state should account for image changes too

### 6b. Pass image changes to edit function

Include `newImages`, `deletedImageIds` in the `editNotes()` call.

### 6c. Cleanup deleted images from storage

When a user deletes an image during editing, also remove the file from the `notes-images` Supabase storage bucket.

---

## 7. Translations

**Edit:** `web/app/lib/i18n/locales/en/notes.json` — add:

```json
"toolbar": {
  "image": "Insert image"
},
"image": {
  "uploading": "Uploading...",
  "uploadError": "Failed to upload image. Please try again.",
  "fileTooLarge": "File is too large. Maximum size is 10 MB.",
  "invalidFileType": "Invalid file type. Please use JPEG, PNG, or WebP."
}
```

**Edit:** `web/app/lib/i18n/locales/fi/notes.json` — add equivalent Finnish translations:

```json
"toolbar": {
  "image": "Lisaa kuva"
},
"image": {
  "uploading": "Ladataan...",
  "uploadError": "Kuvan lataaminen epaonnistui. Yrita uudelleen.",
  "fileTooLarge": "Tiedosto on liian suuri. Enimmäiskoko on 10 MB.",
  "invalidFileType": "Virheellinen tiedostotyyppi. Kayta JPEG-, PNG- tai WebP-muotoa."
}
```

---

## 8. Draft Saving Update

**Edit:** `web/features/notes/hooks/useSaveDraft.ts`

Currently saves only `title` and `notes` to localStorage. Uploaded images are already in Supabase storage, so the draft should also save their metadata (storage paths) so they survive page refreshes.

Add `images` array to the draft object stored in `notes_draft` localStorage key.

---

## 9. Files to Create/Modify

| Action | File |
|--------|------|
| **Edit** | `web/features/notes/components/TiptapEditor.tsx` |
| **Edit** | `web/app/(app)/notes/quick-notes/page.tsx` |
| **Edit** | `web/database/notes/save-notes.ts` |
| **Edit** | `web/database/notes/edit-notes.ts` |
| **Edit** | `web/features/notes/cards/notes-edit.tsx` |
| **Edit** | `web/features/notes/hooks/useSaveDraft.ts` |
| **Edit** | `web/app/lib/i18n/locales/en/notes.json` |
| **Edit** | `web/app/lib/i18n/locales/fi/notes.json` |
| **Edit** | `web/app/global.css` (if needed for image styling) |

---

## 10. Verification

1. **Image upload:** Open Quick Notes, click the image toolbar button, select a JPEG/PNG/WebP file — image appears inline in the editor
2. **Image size limit:** Try uploading a file > 10 MB — error toast appears
3. **Image invalid type:** Try uploading a non-image file — error toast appears
4. **Image persistence:** Save the note, open it in expanded view — image renders correctly
5. **Image editing:** Edit an existing note with images — images are visible, can add new ones
6. **Draft saving:** Add images, navigate away, come back — image metadata restored from draft
7. **Cleanup:** Delete a note — verify orphaned storage files are cleaned up (cascade delete handles DB rows; storage cleanup may need explicit handling)
8. **Translations:** Switch to Finnish — all labels and error messages display correctly
9. **Supabase:** Check `notes_images` table has correct rows after save/edit
