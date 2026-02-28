# Training-App

Monorepo with two apps: `mobile/` (React Native / Expo) and `web/` (Next.js).

Before making any changes, always read the CLAUDE.md in the relevant app directory:
- `mobile/CLAUDE.md` — mobile-specific rules
- `web/CLAUDE.md` — web-specific rules

## Bash Commands
Always explain what a bash command does before running it, especially for compound commands, flags, or anything that isn't immediately obvious.

## Supabase Migrations
- Never use `CREATE OR REPLACE FUNCTION`. It only replaces if the exact parameter signature matches — if parameters changed, it creates a duplicate overload. Always `DROP FUNCTION` first, then `CREATE FUNCTION`.
- Always use full `YYYYMMDDHHmmss` timestamp format for migration filenames (e.g., `20260223200000_name.sql`), never short `YYYYMMDD`. Short timestamps cause ordering conflicts with existing full-format migrations and break `db push`.
