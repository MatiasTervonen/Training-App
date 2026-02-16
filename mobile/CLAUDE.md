# Project Rules

## Key Paths
- Tailwind classes: `app/global.css`
- Input field components: `components`
- Translation files: `locales`
- Text components: `components`
- Button components: `components/buttons`

## Page Structure
- When creating a new page, always wrap it with `ModalPageWrapper`.

## Styling
- Always use NativeWind (`className`) for styling — never use inline `style` props.
- Always use `AppText` component for text — never use raw `<Text>`.
- Never write custom button styles — use existing ones from `app/components/buttons`.

## Buttons
- Always use `AnimatedButton` instead of `Pressable` — never use raw `Pressable`.
- Always check `app/components/buttons` for existing buttons before creating new ones.
- If no matching button exists, use `AnimatedButton` with the correct style class.
- Use `btn-base` for standard buttons, `btn-danger` for delete/cancel actions.

## Components
- Small notes field: `SubNotesInput`
- Large notes field: `NotesInput`
- Title fields: `AppInput`
- Always check `app/components` for existing components before creating new ones.

## Imports
- Always use absolute paths when importing — never use relative paths.

## Translations
- Always add translations when creating new pages or user-facing text.
- Translation files are in `locales`.

## TypeScript
- Never use `any` type. Fix TypeScript errors with proper types. If you're unsure of the type, read the codebase to find the correct one.
