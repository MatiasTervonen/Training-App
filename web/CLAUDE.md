# Project Rules

## Key Paths
- Tailwind classes: `app/global.css`
- Input field components: `app/(app)/ui`
- Translation files: `app/lib`
- Button components: `app/(app)/components/buttons`

## Styling
- Always use `page-padding` tailwind class on the outer div of every new page.
- Buttons: use `btn-base` for standard buttons, `btn-danger` for delete/cancel actions.
- Always if its possible use existing button components.

## Components
- Small notes field: use `SubNotes` component
- Large notes field: use `NotesInput` component
- Title fields: use `TitleInput` component


## Translations
- Always add translations when creating new pages or user-facing text.
- Translation files are in `app/lib`.
