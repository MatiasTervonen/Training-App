# Folder Feature — Mobile UI Spec

## Overview

Mobile UI changes for adding folder support to the notes feature in the React Native / Expo app.

## Rules (from `mobile/CLAUDE.md`)

- Use NativeWind (`className`) for styling — never inline `style` props.
- Use `AppText` for all text — never raw `<Text>`.
- Use existing button components from `components/buttons`.
- Wrap new pages with `ModalPageWrapper`.
- Use absolute imports.
- Add translations for all user-facing text.

---

## Screen Flow

```
Notes Hub (/notes/index.tsx)
  |
  |-- Quick Notes (/notes/quick-notes/index.tsx)
  |     |-- [NEW] FolderPicker section (optional, before save)
  |
  |-- My Notes (/notes/my-notes/index.tsx)
  |     |-- [NEW] FolderFilterChips (horizontal, above FlatList)
  |     |-- Existing: FlatList of note feed cards
  |     |-- [NEW] Folder badge on each feed card
  |
  |-- [NEW] Manage Folders (/notes/folders/index.tsx)
  |     |-- Create new folder input
  |     |-- List of folders with note count, rename, delete
  |
  |-- (from note card actions)
       |-- [NEW] MoveToFolderSheet (bottom sheet / modal)
```

---

## New Files

### Pages

| File | Purpose |
|---|---|
| `mobile/app/notes/folders/index.tsx` | Manage Folders page |

### Components

| File | Purpose |
|---|---|
| `mobile/features/notes/components/FolderFilterChips.tsx` | Horizontal filter chip row |
| `mobile/features/notes/components/FolderPicker.tsx` | Folder dropdown for save/edit |
| `mobile/features/notes/components/MoveToFolderSheet.tsx` | Bottom sheet for moving notes |

### Hooks

| File | Purpose |
|---|---|
| `mobile/features/notes/hooks/useFolders.ts` | Fetch folders with React Query |
| `mobile/features/notes/hooks/useCreateFolder.ts` | Mutation to create a folder |
| `mobile/features/notes/hooks/useRenameFolder.ts` | Mutation to rename a folder |
| `mobile/features/notes/hooks/useDeleteFolder.ts` | Mutation to delete a folder |
| `mobile/features/notes/hooks/useMoveNoteToFolder.ts` | Mutation to move a note |

### Database queries

| File | Purpose |
|---|---|
| `mobile/database/notes/get-folders.ts` | `supabase.from("note_folders").select(...)` |
| `mobile/database/notes/save-folder.ts` | `supabase.from("note_folders").insert(...)` |
| `mobile/database/notes/rename-folder.ts` | `supabase.from("note_folders").update(...)` |
| `mobile/database/notes/delete-folder.ts` | `supabase.from("note_folders").delete(...)` |
| `mobile/database/notes/move-note-to-folder.ts` | `supabase.rpc("notes_move_to_folder", ...)` |

---

## Component Details

### 1. FolderFilterChips

**Location:** `mobile/features/notes/components/FolderFilterChips.tsx`

Horizontal scrollable row of filter chips. Rendered above the FlatList on the My Notes page.

```
[All] [Unfiled] [Training Plans] [Nutrition] [Recovery] ...
```

**Props:**

```typescript
type FolderFilterChipsProps = {
  folders: note_folders[];
  selectedFolderId: string | null;   // null = "All"
  isUnfiledSelected: boolean;
  onSelectAll: () => void;
  onSelectUnfiled: () => void;
  onSelectFolder: (folderId: string) => void;
};
```

**Rendering:**

- `ScrollView` horizontal with `showsHorizontalScrollIndicator={false}`
- Active chip: `bg-blue-600 text-white`
- Inactive chip: `bg-slate-800 border border-slate-600 text-slate-300`
- Uses `Pressable` for each chip, `AppText` for labels
- Padding: `contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}`

### 2. FolderPicker

**Location:** `mobile/features/notes/components/FolderPicker.tsx`

A collapsible dropdown for choosing a folder when saving or editing a note.

**Props:**

```typescript
type FolderPickerProps = {
  folders: note_folders[];
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  isLoading: boolean;
};
```

**Rendering approach:**

- A `Pressable` row showing the current selection (or "Unfiled") with a chevron icon.
- When pressed, expands to show a list of folders as radio-button-style options.
- First option is "None (unfiled)" with `null` value.
- Each folder option shows the folder name.
- Uses `AppText` for all text, NativeWind classes for all styling.
- Collapsed: `bg-slate-800 border border-slate-600 rounded-lg px-4 py-3`
- Label above: `text-sm text-slate-400 mb-1`

### 3. MoveToFolderSheet

**Location:** `mobile/features/notes/components/MoveToFolderSheet.tsx`

A `FullScreenModal` or bottom sheet for moving a note to a folder.

**Props:**

```typescript
type MoveToFolderSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  currentFolderId: string | null;
  folders: note_folders[];
};
```

**Features:**
- Shows all folders with the current folder highlighted.
- "Remove from folder" option if the note is currently in a folder.
- Calls `useMoveNoteToFolder` mutation on selection.
- Shows a toast on success: "Note moved to [folder name]".
- Closes automatically on selection.

### 4. Manage Folders Page

**Location:** `mobile/app/notes/folders/index.tsx`

**Wrapped in `ModalPageWrapper`** per mobile CLAUDE.md rules.

**Layout:**

```
+--------------------------------------+
|        Manage Folders                 |
+--------------------------------------+
| [  Enter folder name...     ] [Add]  |
+--------------------------------------+
| Training Plans          3 notes  [X] |
| Nutrition               5 notes  [X] |
| Recovery                1 note   [X] |
| Technique Notes         0 notes  [X] |
+--------------------------------------+
```

**Features:**

- `AppInput` at the top for creating new folders, with a save button.
- List of existing folders, each showing:
  - Folder name (tappable to rename inline — switches to `AppInput`)
  - Note count badge
  - Delete button (trash icon)
- Delete triggers `useConfirmAction` with message including note count.
- Empty state: "No folders yet. Create a folder to organize your notes!"
- Uses existing button components from `components/buttons`.

---

## Changes to Existing Files

### `mobile/app/notes/index.tsx` (Notes Hub)

Add a third `LinkButton` for Manage Folders:

```tsx
import { FolderOpen } from "lucide-react-native";

<LinkButton label={t("notes.folders.manageFolders")} href="/notes/folders">
  <FolderOpen color="#f3f4f6" />
</LinkButton>
```

### `mobile/app/notes/my-notes/index.tsx` (My Notes)

1. Import `FolderFilterChips` and `useFolders`.
2. Add state for `selectedFolderId` and `isUnfiledSelected`.
3. Render `FolderFilterChips` in the `ListHeaderComponent` of the FlatList (above `FeedHeader`).
4. Pass folder filter to `useMyNotesFeed`.

### `mobile/app/notes/quick-notes/index.tsx` (Quick Notes)

1. Import `FolderPicker` and `useFolders`.
2. Add state for `selectedFolderId`.
3. Render `FolderPicker` below `NotesInput`, above voice recordings.
4. Pass `selectedFolderId` to save mutation.

### `mobile/features/notes/cards/edit-notes.tsx` (Edit Notes)

1. Add `FolderPicker` to the edit form.
2. Initialize `selectedFolderId` from `note.extra_fields.folder_id`.
3. Pass `folder_id` to the `editNotes` call.

### `mobile/features/notes/cards/notes-feed.tsx` (Notes Feed Card)

Add a folder badge below the type name:

```tsx
{folderName && (
  <View className="flex-row items-center gap-1 mt-1">
    <FolderOpen size={12} color="#94a3b8" />
    <AppText className="text-xs text-slate-400">{folderName}</AppText>
  </View>
)}
```

### `mobile/features/notes/hooks/useMyNotesFeed.ts`

Modify to accept a folder filter parameter. Compute query key based on filter. Pass filter params to `getNotes`.

### `mobile/database/notes/get-notes.ts`

Update to call the `notes_get_by_folder` RPC when a folder filter is provided, otherwise use existing pinned + feed query.

### `mobile/database/notes/save-note.ts`

Add optional `folderId` parameter and pass to RPC as `p_folder_id`.

### `mobile/database/notes/edit-notes.ts`

Add optional `folderId` parameter and pass to RPC as `p_folder_id`.

---

## Interaction Patterns

### Long-press / action menu on note card

The existing notes feed card actions include: Expand, Edit, Pin/Unpin, Delete. Add a new action: **"Move to Folder"**.

When "Move to Folder" is tapped, open the `MoveToFolderSheet` bottom sheet.

### Folder filter chips

- Tap a chip to filter the notes feed by that folder.
- Active chip is visually distinct (`bg-blue-600 text-white`).
- Tapping "All" clears all filters and shows every note.
- Tapping "Unfiled" shows only notes with `folder_id = NULL`.
- Feed automatically refetches when the filter changes (React Query key includes the folder ID).

### Manage Folders page

- Tap a folder name to enter inline edit mode (the name becomes an `AppInput`).
- Press Enter or tap elsewhere to save the rename.
- Tap the trash icon to delete. A confirmation dialog shows (using `useConfirmAction`).
- Type in the create input and tap "Create" to add a new folder.
- Duplicate name error is shown as a Toast.

### Saving a note with a folder

- On the Quick Notes page, the `FolderPicker` is collapsed by default showing "Unfiled".
- Tap to expand and select a folder.
- The selected folder is passed to the save mutation.
- If no folder is selected, the note is saved as unfiled.

---

## Empty States

| State | Component | Message (EN) | Message (FI) |
|---|---|---|---|
| No folders exist | Manage Folders page | "No folders yet. Create a folder to organize your notes!" | "Ei vielä kansioita. Luo kansio muistiinpanojesi järjestämiseksi!" |
| Folder has no notes | My Notes with folder filter | "This folder is empty." | "Tämä kansio on tyhjä." |
| No unfiled notes | My Notes with "Unfiled" filter | "No unfiled notes." | "Ei lajittelemattomia muistiinpanoja." |

All empty state messages use `AppText` with `className="text-center text-lg mt-10 mx-auto"`.

---

## Loading States

| State | Behavior |
|---|---|
| Folders loading | Filter chips show shimmer skeleton (3 placeholder chips) |
| Notes loading with folder filter | Existing `FeedSkeleton` component with `count={5}` |
| Moving a note | Brief Toast: "Note moved to [folder name]" |
| Creating a folder | Button disabled while saving; optimistic add to list |
| Deleting a folder | Optimistic removal from list; rollback on error |

---

## Translations to Add

### English (`mobile/locales/en/notes.json`)

Add `"folders"` key inside the existing `"notes"` object:

```json
"folders": {
  "title": "Folders",
  "manageFolders": "Manage Folders",
  "all": "All",
  "unfiled": "Unfiled",
  "createFolder": "Create Folder",
  "folderName": "Folder name",
  "folderNamePlaceholder": "Enter folder name...",
  "rename": "Rename",
  "delete": "Delete Folder",
  "deleteConfirmTitle": "Delete Folder",
  "deleteConfirmMessage": "This folder contains {{count}} notes. They will be moved to Unfiled.",
  "deleteConfirmEmpty": "Are you sure you want to delete this folder?",
  "moveToFolder": "Move to Folder",
  "removeFromFolder": "Remove from Folder",
  "movedToFolder": "Note moved to {{folder}}",
  "removedFromFolder": "Note removed from folder",
  "noFolders": "No folders yet. Create a folder to organize your notes!",
  "folderEmpty": "This folder is empty.",
  "noUnfiled": "No unfiled notes.",
  "duplicateName": "A folder with this name already exists.",
  "saveToFolder": "Save to folder (optional)",
  "noteCount": "{{count}} notes",
  "folderCreated": "Folder created",
  "folderDeleted": "Folder deleted",
  "folderRenamed": "Folder renamed",
  "errorCreate": "Failed to create folder",
  "errorDelete": "Failed to delete folder",
  "errorRename": "Failed to rename folder",
  "errorMove": "Failed to move note"
}
```

### Finnish (`mobile/locales/fi/notes.json`)

Add `"folders"` key inside the existing `"notes"` object:

```json
"folders": {
  "title": "Kansiot",
  "manageFolders": "Hallitse kansioita",
  "all": "Kaikki",
  "unfiled": "Lajittelemattomat",
  "createFolder": "Luo kansio",
  "folderName": "Kansion nimi",
  "folderNamePlaceholder": "Syötä kansion nimi...",
  "rename": "Nimeä uudelleen",
  "delete": "Poista kansio",
  "deleteConfirmTitle": "Poista kansio",
  "deleteConfirmMessage": "Tässä kansiossa on {{count}} muistiinpanoa. Ne siirretään lajittelemattomiin.",
  "deleteConfirmEmpty": "Haluatko varmasti poistaa tämän kansion?",
  "moveToFolder": "Siirrä kansioon",
  "removeFromFolder": "Poista kansiosta",
  "movedToFolder": "Muistiinpano siirretty kansioon {{folder}}",
  "removedFromFolder": "Muistiinpano poistettu kansiosta",
  "noFolders": "Ei vielä kansioita. Luo kansio muistiinpanojesi järjestämiseksi!",
  "folderEmpty": "Tämä kansio on tyhjä.",
  "noUnfiled": "Ei lajittelemattomia muistiinpanoja.",
  "duplicateName": "Samanniminen kansio on jo olemassa.",
  "saveToFolder": "Tallenna kansioon (valinnainen)",
  "noteCount": "{{count}} muistiinpanoa",
  "folderCreated": "Kansio luotu",
  "folderDeleted": "Kansio poistettu",
  "folderRenamed": "Kansio nimetty uudelleen",
  "errorCreate": "Kansion luominen epäonnistui",
  "errorDelete": "Kansion poistaminen epäonnistui",
  "errorRename": "Kansion nimeäminen epäonnistui",
  "errorMove": "Muistiinpanon siirtäminen epäonnistui"
}
```

---

## Implementation Order

1. Database query files (`database/notes/get-folders.ts`, etc.)
2. Hooks (`useFolders`, `useCreateFolder`, etc.)
3. `FolderFilterChips` component
4. Integrate filter chips into `my-notes/index.tsx`
5. Update `useMyNotesFeed` to accept folder filter
6. Update `get-notes.ts` to call `notes_get_by_folder` RPC
7. `FolderPicker` component
8. Integrate `FolderPicker` into `quick-notes/index.tsx` and `edit-notes.tsx`
9. Update `save-note.ts` and `edit-notes.ts` to pass `folder_id`
10. `MoveToFolderSheet` component
11. Add "Move to Folder" to note card actions
12. `Manage Folders` page
13. Add link to Manage Folders from notes hub
14. Folder badge on feed cards
15. Translations
16. Testing
