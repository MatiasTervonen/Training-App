# Project Rules

## Architecture
- `app/(app)/` — pages only (page.tsx, layout.tsx, route.ts)
- `features/` — feature-specific code (components, hooks, cards, lib per feature)
- `components/` — shared UI components (buttons, navbar, sidebar, modals)
- `database/` — all database queries (organized by feature)
- `lib/` — shared utilities and stores
- `types/` — shared TypeScript types
- `ui/` — shared input components
- `utils/` — shared utility functions

## Key Paths
- Tailwind classes: `app/global.css`
- Input field components: `ui/`
- Translation files: `app/lib`
- Button components: `components/buttons`
- Feed cards (base): `features/feed-cards/`
- Feature cards: `features/{feature}/cards/`

## Styling
- Always use `page-padding` tailwind class on the outer div of every new page.
- Buttons: use `btn-base` for standard buttons, `btn-danger` for delete/cancel actions.
- Always if its possible use existing button components.

## Components
- Small notes field: use `SubNotes` component
- Large notes field: use `NotesInput` component
- Title fields: use `TitleInput` component
- Never use raw `<input>` elements — always use existing input components from `ui/`.


## Imports
- Always use absolute paths when importing — never use relative paths.

## Translations
- Always add translations when creating new pages or user-facing text.
- Translation files are in `app/lib`.

## TypeScript
- Never use `any` type. Fix TypeScript errors with proper types. If you're unsure of the type, read the codebase to find the correct one.
