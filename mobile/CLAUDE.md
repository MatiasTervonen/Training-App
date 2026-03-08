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

## Imports
- Always use absolute paths when importing — never use relative paths.

## Translations
- Always add translations when creating new pages or user-facing text.
- Translation files are in `locales`.
- Always use proper ä/ö characters in Finnish — never substitute with plain a/o

## Dates & Timezones

### JS side
- For "today" as a local date string, use `new Date().toLocaleDateString("en-CA")` — this gives `YYYY-MM-DD` in the device's local timezone.
- Database timestamps (`created_at`, `updated_at`) are stored in UTC. When comparing them against local date strings, always convert to local time first: `new Date(utcTimestamp).toLocaleDateString("en-CA")`.
- Never compare a UTC timestamp directly against a local date string — the date portion can differ by a day near midnight.
- When filtering data by date ranges, ensure both sides use the same timezone basis (both local or both UTC).
- Get the user's IANA timezone with `Intl.DateTimeFormat().resolvedOptions().timeZone` (e.g., `"Europe/Helsinki"`).

### SQL / Supabase RPC side
- Supabase runs in UTC. `CURRENT_DATE`, `now()::date`, and `column::date` all use UTC — never use them for user-facing date logic.
- Always accept the user's local date as a `p_date DATE` parameter from JS instead of using `CURRENT_DATE`.
- Never cast a TIMESTAMPTZ column to date with `column::date` when comparing against local dates — it extracts the UTC date which can be off by a day. Use `(column AT TIME ZONE p_tz)::date` where `p_tz` is the user's IANA timezone passed from JS.
- When an RPC function needs to convert `created_at` or other TIMESTAMPTZ columns to local dates, include a `p_tz TEXT DEFAULT 'UTC'` parameter and pass `Intl.DateTimeFormat().resolvedOptions().timeZone` from JS.

## TypeScript
- Never use `any` type. Fix TypeScript errors with proper types. If you're unsure of the type, read the codebase to find the correct one.

## Post-Implementation Review
- After implementing a feature from the `specs/` folder, scan the changed code against the best practices references in `.agents/skills/react-native-best-practices/references/` and `.agents/skills/react-data-patterns/references/`. Focus on Critical and High impact patterns only.


