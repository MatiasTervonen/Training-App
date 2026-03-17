# Auto-Save for Edit Views

## Overview

Replace manual save buttons in all edit views with debounced auto-save. Create views keep their save button. The goal is a snappier, more modern feel — edits sync silently in the background while the user works.

---

## Design Decisions

### Why auto-save only for edits, not creates?

When creating something new, the user is building from scratch. They need an explicit "I'm done" action to avoid saving half-finished records. When editing, the data already exists — the user expects changes to stick, like in Apple Notes, Google Keep, or Notion.

### Why debounce?

Users may toggle checkboxes rapidly, reorder items, or type continuously. Debouncing (1.5 second delay after the last change) batches all rapid changes into a single API call. If a save is already in-flight when the debounce fires, queue the next save to run after the current one completes.

### What replaces the "unsaved changes" badge?

A status indicator in the same top-left position, cycling through states:
- **Idle** — nothing shown
- **Saving** — small spinner + "Saving..." text, fades in
- **Saved** — checkmark + "Saved" text, fades out after 1.5 seconds
- **Error** — red "Save failed" text, stays visible until the next successful save

### What about the `confirmBeforeClose` on FullScreenModals?

Keep it — but change the condition. Instead of checking `hasUnsavedChanges`, check if the auto-save status is `saving` or `dirty` (debounce pending). If the user tries to close while a save is pending/in-flight, show the confirmation. If the last save succeeded, close immediately.

### What about media uploads (images, videos, voice)?

Media uploads are slow and involve separate storage operations. Auto-save should only handle text/data fields. Media attachments should still use their existing upload flow. The auto-save triggers after media is successfully attached (i.e., when the parent data object changes to include the new media reference).

---

## Shared Hook: `useAutoSave`

Create a single reusable hook that all edit components use:

```ts
// hooks/useAutoSave.ts

type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

type UseAutoSaveOptions<T> = {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;       // default 1500
  enabled?: boolean;          // default true, false to disable (e.g. during initial load)
};

type UseAutoSaveReturn = {
  status: AutoSaveStatus;
  hasPendingChanges: boolean; // true if dirty or saving
};
```

**Logic:**
1. Compare current `data` against a baseline snapshot (captured on mount and after each successful save)
2. If different → mark dirty, start/reset debounce timer
3. When timer fires → set status to `saving`, call `onSave`
4. On success → update baseline, set status to `saved`, start fade-out timer (1.5s → `idle`)
5. On error → set status to `error`, keep dirty state so the next change retries
6. If `data` changes while `saving` → queue another save after current completes

---

## Shared Component: `AutoSaveIndicator`

A small floating badge component used by all edit views:

```tsx
// components/AutoSaveIndicator.tsx

type Props = {
  status: AutoSaveStatus;
};
```

Renders in the same position as the current "unsaved changes" badge (absolute top-5 left-5 z-50). Shows:
- `saving` → `ActivityIndicator` (small) + "Saving..." text
- `saved` → checkmark icon + "Saved" text (animated fade-out)
- `error` → red warning icon + "Save failed" text
- `idle` → nothing

---

## Components to Convert (Edit → Auto-Save)

All of these currently use SaveButton + onDirtyChange + "unsaved changes" badge:

### 1. `features/reminders/cards/editGlobalReminder.tsx`
- **Saves:** `editGlobalReminder()` → updates DB + reschedules notification
- **Remove:** SaveButton, onDirtyChange prop, unsaved changes badge, hasChanges logic
- **Add:** `useAutoSave` with debounce, `AutoSaveIndicator`
- **Note:** Notification scheduling should happen inside the onSave callback

### 2. `features/reminders/cards/editLocalReminder.tsx`
- **Saves:** `useSaveReminder()` hook → updates DB + reschedules notifications
- **Remove:** SaveButton, onDirtyChange prop, unsaved changes badge, hasChanges logic
- **Add:** `useAutoSave`, `AutoSaveIndicator`
- **Note:** Notification scheduling should happen inside the onSave callback

### 3. `features/notes/cards/edit-notes.tsx`
- **Saves:** `editNotes()` → updates title + notes + media counts
- **Remove:** SaveButton, onDirtyChange prop, unsaved changes badge
- **Add:** `useAutoSave`, `AutoSaveIndicator`
- **Note:** Text fields auto-save, media uploads stay as-is

### 4. `features/weight/cards/weight-edit.tsx`
- **Saves:** `editWeight()` → updates weight value + notes + media counts
- **Remove:** SaveButton, onDirtyChange prop, unsaved changes badge
- **Add:** `useAutoSave`, `AutoSaveIndicator`

### 5. `features/activities/cards/activity-edit.tsx`
- **Saves:** `editActivitySession()` → updates title + notes + activity type
- **Remove:** SaveButton, onDirtyChange prop, unsaved changes badge
- **Add:** `useAutoSave`, `AutoSaveIndicator`

### 6. `features/todo/cards/todo-edit.tsx`
- **Saves:** `editTodo()` → updates title + tasks + media
- **Remove:** SaveButton, onDirtyChange prop, unsaved changes badge
- **Add:** `useAutoSave`, `AutoSaveIndicator`

### 7. `features/todo/cards/todo-expanded.tsx`
- **Saves:** `checkedTodo()` → updates checkbox state + task order
- **Remove:** SaveButton, hasChanges logic, unsaved changes badge
- **Add:** `useAutoSave`, `AutoSaveIndicator`
- **Note:** Drag-to-reorder and checkbox toggles both trigger debounce

### 8. `app/habits/create.tsx` (edit mode only)
- **Saves:** `useEditHabit()` mutation
- **Currently:** Uses SaveButton for both create and edit mode
- **Change:** When `id` param exists (edit mode) → auto-save. When no `id` (create mode) → keep SaveButton.

### 9. `app/reports/create.tsx` (edit mode only)
- **Saves:** `useUpdateReportSchedule()` mutation
- **Currently:** Uses SaveButton for both create and edit mode
- **Change:** When editing → auto-save. When creating → keep SaveButton.

### 10. `app/activities/edit-activity/index.tsx`
- **Saves:** `editActivity()` → updates custom activity definition
- **Remove:** SaveButton
- **Add:** `useAutoSave`, `AutoSaveIndicator`
- **Note:** Keep the delete button as-is

### 11. `app/gym/edit-exercise/index.tsx`
- **Saves:** `editExercise()` → updates custom exercise definition
- **Remove:** SaveButton
- **Add:** `useAutoSave`, `AutoSaveIndicator`
- **Note:** Keep the delete button as-is

---

## Components That Keep Save Button (Create)

These stay exactly as they are:

- `app/todo/create-todo/index.tsx` — create new todo list
- `app/reminders/create-reminder/index.tsx` — create new reminder
- `app/weight/tracking/index.tsx` — create new weight entry
- `app/notes/index.tsx` — create new note (inline)
- `app/activities/add-activity/index.tsx` — add custom activity
- `app/gym/add-exercise/index.tsx` — add custom exercise
- `app/timer/create-timer/index.tsx` — create new timer
- `app/activities/start-activity/index.tsx` — start activity session
- `app/habits/create.tsx` (create mode only)
- `app/reports/create.tsx` (create mode only)
- `features/gym/components/GymForm.tsx` — gym session recording
- `features/gym/components/TemplateForm.tsx` — template creation

---

## Parent Component Changes

All parent screens that host edit modals (SessionFeed, reminders/index, notes/index, etc.) currently manage `hasUnsavedChanges` state and pass `onDirtyChange` + `confirmBeforeClose`. These need to change:

- Remove `hasUnsavedChanges` state
- Remove `onDirtyChange` prop passing
- Change `confirmBeforeClose` to check if the edit component reports pending changes (via a ref or callback)
- The edit components themselves can expose a `hasPendingChanges` value via a ref that the parent reads before closing

---

## Translations

Add to `common.json` (both en and fi):

```json
{
  "autoSave": {
    "saving": "Saving...",
    "saved": "Saved",
    "error": "Save failed"
  }
}
```

Finnish:
```json
{
  "autoSave": {
    "saving": "Tallennetaan...",
    "saved": "Tallennettu",
    "error": "Tallennus epäonnistui"
  }
}
```

---

## Implementation Order

1. Build `useAutoSave` hook + `AutoSaveIndicator` component
2. Convert `todo-expanded.tsx` first (simplest — just checkboxes and reorder)
3. Convert simple edit cards (activity-edit, weight-edit)
4. Convert notes edit (has media complexity)
5. Convert reminder edits (have notification scheduling)
6. Convert todo-edit (has task media)
7. Convert settings screens (habits, reports, exercises, activities)
8. Update all parent components to remove onDirtyChange plumbing
9. Clean up: remove unused SaveButton imports from edit files
