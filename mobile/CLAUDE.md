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
- Always use `AppText` (Russo One) or `BodyText` (Lexend) for text — never use raw `<Text>`.
- `AppText` defaults to `text-gray-100`, `BodyText` defaults to `text-gray-200`. Overriding the color on these does not work (Tailwind class conflicts).
- When you need colored text (anything other than `text-gray-100`), use `AppTextNC` instead of `AppText`. When you need colored body text (anything other than `text-gray-200`), use `BodyTextNC` instead of `BodyText`. Both are the same font/sizing, just without the default color.
- Use `AppText` for titles, headings, short labels, button text, stat values, and nav items.
- Use `BodyText` for descriptions, helper text, metadata, error/loading messages, dates, and longer text.
- Never override `AppText` with `font-lexend` — the Russo One base class wins and the override is ignored.
- Never write custom button styles — use existing ones from `app/components/buttons`.
- Never use bold (`font-bold`, `font-semibold`, etc.) on Russo One text — the font is already bold by design.

## Buttons
- Always use `AnimatedButton` instead of `Pressable` for buttons — never use raw `Pressable` as a button.
- Always check `app/components/buttons` for existing buttons before creating new ones.
- If no matching button exists, use `AnimatedButton` with the correct style class.
- Always check `app/global.css` for the correct button style class before using one. Available styles: `btn-base`, `btn-danger`, `btn-disabled`, `btn-add`, `btn-save`, `btn-edit`, `btn-start`, `btn-neutral`.
- Use the semantically correct style: `btn-save` for save actions, `btn-danger` for delete/cancel, `btn-add` for add/create, `btn-edit` for edit actions, `btn-start` for start actions, `btn-base` for generic actions, `btn-neutral` for neutral actions.

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

## Zustand
- Always use selectors when reading from Zustand stores — never destructure the hook call directly.
  - Bad: `const { isRunning } = useTimerStore();` — re-renders on ANY store change.
  - Good: `const isRunning = useTimerStore((s) => s.isRunning);` — only re-renders when `isRunning` changes.

## TypeScript
- Never use `any` type. Fix TypeScript errors with proper types. If you're unsure of the type, read the codebase to find the correct one.

## Native Code (CRITICAL)
- NEVER run `npx expo prebuild` or `npx expo prebuild --clean`. It deletes all custom native code (widgets, custom activities, sound assets, build config).
- Always make targeted edits to specific native files (e.g., AndroidManifest.xml) instead of regenerating.

## FullScreenModal
- Never use `scrollable={false}` with a custom ScrollView inside FullScreenModal. The dismiss gesture tracks scroll position via FullScreenModal's own `KeyboardAwareScrollView` on the UI thread — a custom ScrollView bypasses this and causes the modal to dismiss while scrolled down.
- Always use the default `scrollable={true}` and let FullScreenModal handle scrolling. Child content that needs scrolling should just render its content directly (like gym-expanded does).
- Only use `scrollable={false}` for content that genuinely does not scroll (e.g., a short picker or fixed-height form).
- FullScreenModal uses `KeyboardAwareScrollView` from `react-native-keyboard-controller` — inputs inside the modal automatically scroll into view when the keyboard opens. No extra keyboard handling is needed in child components.

## Post-Implementation Review
- After implementing a feature from the `specs/` folder, scan the changed code against the best practices references in `.agents/skills/react-native-best-practices/references/` and `.agents/skills/react-data-patterns/references/`. Focus on Critical and High impact patterns only.


