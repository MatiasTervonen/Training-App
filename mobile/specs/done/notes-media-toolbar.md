# Notes Media Toolbar — Feature Spec

## Context
The current "Record Voice Note" and "Add Image" buttons are full-width, taking up too much space. The voice recording UI also expands inline, pushing content around. This redesign replaces both with a compact icon toolbar and moves voice recording into a small bottom modal.

---

## 1. Media Toolbar Component

**New file:** `mobile/features/notes/components/MediaToolbar.tsx`

- Single horizontal bar with two icon buttons: `Mic` + `ImagePlus` (from `lucide-react-native`)
- Styled as a toolbar: `bg-slate-900 border border-slate-700 rounded-md flex-row`
- Each icon is separated by a vertical divider
- Tapping **Mic icon** opens the voice recording bottom modal
- Tapping **Image icon** triggers the existing image picker Alert (Take Photo / Choose from Library)

**Props:**
```ts
{
  onRecordingComplete: (uri: string, durationMs: number) => void;
  onImageSelected: (uri: string) => void;
}
```

---

## 2. Recording Modal Component

**New file:** `mobile/features/notes/components/RecordingModal.tsx`

- Small bottom modal using React Native `Modal` with `transparent` + custom bottom positioning
- Dimmed background (`bg-black/50`), compact card anchored at the bottom
- Card styling: `bg-slate-900 rounded-t-2xl` with padding and safe area bottom inset
- Contains the same recording logic from existing `RecordVoiceNotes.tsx`:
  - Start/Pause/Resume button with elapsed timer display
  - Cancel + Finish buttons in a row below
- Auto-closes on Finish, calls `onRecordingComplete(uri, durationMs)`
- Cancel shows confirmation dialog before discarding

**Props:**
```ts
{
  visible: boolean;
  onClose: () => void;
  onRecordingComplete: (uri: string, durationMs: number) => void;
}
```

**Modal Layout:**
```
┌─────────────────────────┐
│     (dimmed background)  │
│                          │
├──────────────────────────┤
│  ┌────────────────────┐  │
│  │   🎙  00:05        │  │
│  │  Pause Recording   │  │
│  │                    │  │
│  │ [Cancel]  [Finish] │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

---

## 3. Update Quick Notes Page

**Edit:** `mobile/app/notes/quick-notes/index.tsx`

- Remove separate `<RecordVoiceNotes>` and `<ImagePicker>` components
- Replace with single `<MediaToolbar>` component
- Pass `onRecordingComplete` and `onImageSelected` callbacks (same logic as current)

---

## 4. Update Edit Notes Card

**Edit:** `mobile/features/notes/cards/edit-notes.tsx`

- Same replacement: swap `<RecordVoiceNotes>` + `<ImagePicker>` for `<MediaToolbar>`

---

## 5. Files Summary

| Action | File |
|--------|------|
| **Create** | `mobile/features/notes/components/MediaToolbar.tsx` |
| **Create** | `mobile/features/notes/components/RecordingModal.tsx` |
| **Edit** | `mobile/app/notes/quick-notes/index.tsx` |
| **Edit** | `mobile/features/notes/cards/edit-notes.tsx` |

---

## 6. Verification

1. Quick Notes page shows compact toolbar bar with mic + image icons
2. Tapping image icon shows "Take Photo" / "Choose from Library" alert
3. Tapping mic icon opens small bottom modal with recording controls
4. Recording works: start, pause, resume, finish, cancel
5. Finished recording appears as `DraftRecordingItem` above toolbar
6. Same behavior in Edit Notes card
