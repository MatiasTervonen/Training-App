# Folder Feature — Web UI Spec

## Overview

Web UI changes for adding folder support to the notes feature in the Next.js app.

## Rules (from `web/CLAUDE.md`)

- Feature code goes in `features/`.
- Pages go in `app/(app)/`.
- DB queries go in `database/`.
- Types go in `types/`.
- Use `page-padding` Tailwind class on the outer div of every page.
- Use existing button components from `components/buttons`.
- Use absolute imports.
- Add translations for all user-facing text.

---

## Screen Flow

```
Notes Hub (/notes/page.tsx)
  |
  |-- Quick Notes (/notes/quick-notes/page.tsx)
  |     |-- [NEW] FolderPicker dropdown (optional, before save)
  |
  |-- My Notes (/notes/my-notes/page.tsx)
  |     |-- [NEW] FolderFilterChips (horizontal, above feed)
  |     |-- Existing: Feed list of note cards
  |     |-- [NEW] Folder badge on each card
  |     |-- [NEW] "Manage Folders" button -> ManageFoldersModal
  |
  |-- (from note card context menu or edit modal)
       |-- [NEW] MoveToFolderDropdown
```

No new route pages are needed. Folder management is handled via a modal on the My Notes page.

---

## New Files

### Components

| File | Purpose |
|---|---|
| `web/features/notes/components/FolderFilterChips.tsx` | Horizontal filter chip row |
| `web/features/notes/components/FolderPicker.tsx` | Dropdown for selecting folder on save/edit |
| `web/features/notes/components/ManageFoldersModal.tsx` | Modal for CRUD folder management |
| `web/features/notes/components/MoveToFolderDropdown.tsx` | Dropdown for moving a note to a folder |

### Hooks

| File | Purpose |
|---|---|
| `web/features/notes/hooks/useFolders.ts` | Fetch folders with React Query |
| `web/features/notes/hooks/useCreateFolder.ts` | Mutation to create a folder |
| `web/features/notes/hooks/useRenameFolder.ts` | Mutation to rename a folder |
| `web/features/notes/hooks/useDeleteFolder.ts` | Mutation to delete a folder |
| `web/features/notes/hooks/useMoveNoteToFolder.ts` | Mutation to move a note |

### Database queries

| File | Purpose |
|---|---|
| `web/database/notes/get-folders.ts` | Supabase query to fetch all folders with note counts |
| `web/database/notes/save-folder.ts` | Supabase query to create a folder |
| `web/database/notes/rename-folder.ts` | Supabase query to rename a folder |
| `web/database/notes/delete-folder.ts` | Supabase query to delete a folder |
| `web/database/notes/move-note-to-folder.ts` | Supabase RPC call to move a note |

---

## Component Details

### 1. FolderFilterChips

**Location:** `web/features/notes/components/FolderFilterChips.tsx`

A horizontal row of clickable filter chips rendered above the notes feed on the My Notes page.

```
[All] [Unfiled] [Training Plans] [Nutrition] [Recovery] [Manage Folders]
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
  onManageFolders: () => void;
};
```

**Styling:**

- Active chip: `bg-blue-600 text-white`
- Inactive chip: `bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700`
- Container: `flex flex-wrap gap-2 py-3`
- Each chip: `px-4 py-1.5 rounded-full text-sm transition-colors cursor-pointer whitespace-nowrap`
- "Manage Folders" chip includes a `Settings` icon from lucide-react

### 2. FolderPicker

**Location:** `web/features/notes/components/FolderPicker.tsx`

A `<select>` dropdown for choosing a folder when saving or editing a note.

**Props:**

```typescript
type FolderPickerProps = {
  folders: note_folders[];
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  isLoading: boolean;
};
```

**Rendering:**

- Label: `text-sm text-slate-400 mb-1 block` — "Save to folder (optional)"
- Select: `w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500`
- First option: "Unfiled" with empty value
- Each folder as an `<option>`

### 3. ManageFoldersModal

**Location:** `web/features/notes/components/ManageFoldersModal.tsx`

A modal dialog (using the existing `Modal` from `web/components/modal.tsx`) for managing folders.

**Props:**

```typescript
type ManageFoldersModalProps = {
  isOpen: boolean;
  onClose: () => void;
};
```

**Layout:**

```
+----------------------------------------------+
|   [X]         Manage Folders                  |
+----------------------------------------------+
| [  Enter folder name...        ] [Create]    |
+----------------------------------------------+
| Training Plans         3 notes   [Rename][X] |
| Nutrition              5 notes   [Rename][X] |
| Recovery               1 note    [Rename][X] |
| Technique Notes        0 notes   [Rename][X] |
+----------------------------------------------+
```

**Features:**

- Input + "Create" button at top for creating folders.
- List of folders with: name, note count, rename (pencil icon), delete (trash icon).
- Inline rename: click pencil -> name becomes input, Enter to save, Escape to cancel.
- Delete: `window.confirm()` with warning about note count.
- Loading state: 3 skeleton rows with `animate-pulse`.
- Empty state: "No folders yet. Create a folder to organize your notes!"
- Uses existing `Modal` component and `btn-base` class.

### 4. MoveToFolderDropdown

**Location:** `web/features/notes/components/MoveToFolderDropdown.tsx`

A dropdown shown inline on a note card or within the edit/expanded view.

**Props:**

```typescript
type MoveToFolderDropdownProps = {
  noteId: string;
  currentFolderId: string | null;
  onMoved: () => void;
};
```

**Rendering:**

- Trigger button: folder icon + current folder name (or "Unfiled") + chevron
- Dropdown: absolute positioned `div` with `bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50`
- Options: "Unfiled" then all folders, current folder highlighted in blue
- Click selects and closes

---

## Changes to Existing Files

### `web/app/(app)/notes/my-notes/page.tsx`

1. Import and render `FolderFilterChips` above the feed.
2. Import and conditionally render `ManageFoldersModal`.
3. Add state for `selectedFolderId`, `isUnfiledSelected`, `showManageFolders`.
4. Pass folder filter to `useMyNotesFeed`.
5. Update empty state messages based on active filter.

### `web/app/(app)/notes/quick-notes/page.tsx`

1. Import `FolderPicker` and `useFolders`.
2. Add state for `selectedFolderId`.
3. Render `FolderPicker` below `TitleInput`.
4. Pass `selectedFolderId` to save mutation.

### `web/features/notes/cards/notes-edit.tsx`

1. Add `FolderPicker` to the edit form.
2. Initialize `selectedFolderId` from `note.extra_fields.folder_id`.
3. Include `folder_id` in the `hasChanges` check.
4. Pass `folder_id` to the `editNotes` call.

### `web/features/notes/cards/notes-feed.tsx`

Add a folder badge on the card:

```tsx
{folder && (
  <div className="flex items-center gap-1 mb-1">
    <FolderOpen size={12} className="text-slate-400" />
    <span className="text-xs text-slate-400">{folder.name}</span>
  </div>
)}
```

### `web/features/notes/hooks/useMyNotesFeed.ts`

Accept a folder filter parameter. Compute query key based on filter. Pass filter params to `getNotes`.

### `web/database/notes/get-notes.ts`

Update to call `notes_get_by_folder` RPC when a folder filter is provided, otherwise use existing pinned + feed query unchanged.

### `web/database/notes/save-notes.ts`

Add optional `folderId` parameter and pass to RPC as `p_folder_id`.

### `web/database/notes/edit-notes.ts`

Add optional `folderId` parameter and pass to RPC as `p_folder_id`.

---

## Interaction Patterns

### Filter chips

- Click a chip to filter the notes feed by that folder.
- Active chip: `bg-blue-600 text-white`.
- Inactive chip: `bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700`.
- "All" clears all filters (default state).
- "Unfiled" shows only notes with no folder.
- "Manage Folders" opens the `ManageFoldersModal`.
- Feed automatically refetches when the filter changes (React Query key includes the folder).

### Context menu on note cards

The existing card action menu (expand, edit, pin, delete) should be extended with "Move to Folder". The `MoveToFolderDropdown` can be rendered within the `notes-edit.tsx` card and `notes-expanded.tsx` view.

### Folder management modal

- Type a name and press Enter or click "Create" to add a folder.
- Click the pencil icon to rename inline. Press Enter to save, Escape to cancel.
- Click the trash icon to delete. `window.confirm()` shows the warning message.
- Duplicate name errors are caught and shown as a toast.

### Drag-and-drop (future enhancement, not Phase 1)

Not included in Phase 1. Could be added later to allow dragging note cards onto folder filter chips.

---

## Empty States

| State | Component | Message (EN) | Message (FI) |
|---|---|---|---|
| No folders exist | ManageFoldersModal | "No folders yet. Create a folder to organize your notes!" | "Ei vielä kansioita. Luo kansio muistiinpanojesi järjestämiseksi!" |
| Folder has no notes | My Notes (folder filtered) | "This folder is empty." | "Tämä kansio on tyhjä." |
| No unfiled notes | My Notes ("Unfiled" filter) | "No unfiled notes." | "Ei lajittelemattomia muistiinpanoja." |
| No notes at all | My Notes ("All" filter) | "No notes yet. Create a note to see it here!" | "Ei vielä muistiinpanoja. Lisää muistiinpano nähdäksesi sen täällä!" |

All empty states render as `<p className="text-center text-lg mt-20">`.

---

## Loading States

| State | Behavior |
|---|---|
| Folders loading | Filter chips area shows skeleton shimmer (3 pill-shaped placeholders) |
| Notes loading with folder filter | Existing `FeedSkeleton` component with `count={6}` |
| Moving a note | Toast notification: "Note moved to [folder name]" |
| Creating a folder | Button disabled while mutating; optimistic add to list |
| Deleting a folder | Optimistic removal from list; rollback on error |
| ManageFoldersModal folder list loading | 3 skeleton `<div>` rows with `animate-pulse` |

---

## Translations to Add

### English (`web/app/lib/i18n/locales/en/notes.json`)

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

### Finnish (`web/app/lib/i18n/locales/fi/notes.json`)

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

1. Database query files (`web/database/notes/get-folders.ts`, etc.)
2. Hooks (`useFolders`, `useCreateFolder`, etc.)
3. `FolderFilterChips` component
4. Integrate filter chips into `my-notes/page.tsx`
5. Update `useMyNotesFeed` to accept folder filter
6. Update `get-notes.ts` to call `notes_get_by_folder` RPC when filtered
7. `FolderPicker` component
8. Integrate `FolderPicker` into `quick-notes/page.tsx` and `notes-edit.tsx`
9. Update `save-notes.ts` and `edit-notes.ts` to pass `folder_id`
10. `ManageFoldersModal` component
11. `MoveToFolderDropdown` component
12. Add "Move to Folder" capability to note cards and expanded view
13. Folder badge on feed cards
14. Translations
15. Testing
