# Training-App

Monorepo with two apps: `mobile/` (React Native / Expo) and `web/` (Next.js).

Before making any changes, always read the CLAUDE.md in the relevant app directory:
- `mobile/CLAUDE.md` — mobile-specific rules
- `web/CLAUDE.md` — web-specific rules

## Terminal Commands
Every command run in the terminal must include a short explanation of what it does. This applies to all commands — git, npm, pnpm, supabase, or anything else.

## Dates & Timezones

### JS side
- For "today" as a local date string, use `new Date().toLocaleDateString("en-CA")` — this gives `YYYY-MM-DD` in the device's local timezone.
- Database timestamps (`created_at`, `updated_at`) are stored in UTC. When comparing them against local date strings, always convert to local time first: `new Date(utcTimestamp).toLocaleDateString("en-CA")`.
- Never compare a UTC timestamp directly against a local date string — the date portion can differ by a day near midnight.
- When filtering data by date ranges, ensure both sides use the same timezone basis (both local or both UTC).
- Get the user's IANA timezone with `Intl.DateTimeFormat().resolvedOptions().timeZone` (e.g., `"Europe/Helsinki"`).

## React Patterns
- Avoid `useEffect` for derived state — if a value can be computed from props or other state, compute it during render (plain variable or `useMemo`) instead of syncing via `useEffect` + `setState`. Only use `useEffect` for actual side effects: subscriptions, network requests, timers, and syncing with external systems.                                                         
          

### SQL / Supabase RPC side
- Supabase runs in UTC. `CURRENT_DATE`, `now()::date`, and `column::date` all use UTC — never use them for user-facing date logic.
- Always accept the user's local date as a `p_date DATE` parameter from JS instead of using `CURRENT_DATE`.
- Never cast a TIMESTAMPTZ column to date with `column::date` when comparing against local dates — it extracts the UTC date which can be off by a day. Use `(column AT TIME ZONE p_tz)::date` where `p_tz` is the user's IANA timezone passed from JS.
- When an RPC function needs to convert `created_at` or other TIMESTAMPTZ columns to local dates, include a `p_tz TEXT DEFAULT 'UTC'` parameter and pass `Intl.DateTimeFormat().resolvedOptions().timeZone` from JS.

## Supabase Migrations
- Never use `CREATE OR REPLACE FUNCTION`. It only replaces if the exact parameter signature matches — if parameters changed, it creates a duplicate overload. Always `DROP FUNCTION` first, then `CREATE FUNCTION`.
- Always use full `YYYYMMDDHHmmss` timestamp format for migration filenames (e.g., `20260223200000_name.sql`), never short `YYYYMMDD`. Short timestamps cause ordering conflicts with existing full-format migrations and break `db push`.
- I have RLS enabled on all tables. Never use SECURITY DEFINER on RPC functions unless I explicitly ask for it. Always explicitly add SECURITY INVOKER to every RPC function.
- Always use `DEFAULT auth.uid()` on `user_id` columns. In SECURITY INVOKER RPC functions, use `auth.uid()` directly instead of accepting a `p_user_id` parameter — the client should never need to pass the user ID.
- Don't fix TypeScript errors caused by unpushed Supabase migrations (e.g., "column 'x' does not exist") — they resolve after `db push`.
