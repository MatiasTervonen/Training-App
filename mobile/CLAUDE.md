# Project Rules

## Key Paths
- Tailwind classes: `app/global.css`
- Input field components: `components`
- Translation files: `locales`
- Text components: `components`
- Button components: `components/buttons`
- Button styles: `btn-base`, `btn-danger`, `btn-neutral` in `app/global.css`

## Page Structure
- When creating a new page, always wrap it with `PageContainer`. Never use `ModalPageWrapper` directly — `LayoutWrapper` already handles that.
- On pages with a `ScrollView`, always put the `ScrollView` outside `PageContainer` — never inside it. This prevents `PageContainer`'s padding from creating a static border around the scrolling content.

## Styling
- Always use NativeWind (`className`) for styling — never use inline `style` props.
- Always use `AppText` component for text — never use raw `<Text>`.
- Never write custom button styles — use existing ones from `app/components/buttons`.

## Buttons
- Always use `AnimatedButton` instead of `Pressable` for buttons — never use raw `Pressable` as a button.
- Always check `app/components/buttons` for existing buttons before creating new ones.
- If no matching button exists, use `AnimatedButton` with the correct style class.
- Use `btn-base` for standard buttons, `btn-danger` for delete/cancel actions, `btn-neutral` for neutral actions.

## Components
- Small notes field: `SubNotesInput`
- Large notes field: `NotesInput`
- Title fields: `AppInput`
- Always check `app/components` for existing components before creating new ones.

## Keyboard
- On pages with text inputs, always wrap the page content with `<Pressable onPress={Keyboard.dismiss} className="flex-1">` so the keyboard dismisses when tapping outside. Never use `TouchableWithoutFeedback` — always use `Pressable`.
- On pages that have BOTH text inputs AND scroll-based pickers (e.g., `TimerPicker`), do NOT use `Pressable` for keyboard dismiss — it intercepts the picker's scroll gestures. Instead, use `<View onTouchStart={Keyboard.dismiss}>` on the outer wrapper and `onTouchStart={(e) => e.stopPropagation()}` on the picker container to prevent keyboard dismiss from firing when interacting with the picker.

## Imports
- Always use absolute paths when importing — never use relative paths.

## Translations
- Always add translations when creating new pages or user-facing text.
- Translation files are in `locales`.
- Always use proper ä/ö characters in Finnish — never substitute with plain a/o

## TypeScript
- Never use `any` type. Fix TypeScript errors with proper types. If you're unsure of the type, read the codebase to find the correct one.

## Native Code (CRITICAL)
- NEVER run `npx expo prebuild` or `npx expo prebuild --clean`. It deletes all custom native code (widgets, custom activities, sound assets, build config).
- Always make targeted edits to specific native files (e.g., AndroidManifest.xml) instead of regenerating.

## Post-Implementation Review
- After implementing a feature from the `specs/` folder, scan the changed code against the best practices references in `.agents/skills/react-native-best-practices/references/` and `.agents/skills/react-data-patterns/references/`. Focus on Critical and High impact patterns only.


