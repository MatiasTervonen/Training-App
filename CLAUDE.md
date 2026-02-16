# Training-App

Monorepo with two apps: `mobile/` (React Native / Expo) and `web/` (Next.js).

Before making any changes, always read the CLAUDE.md in the relevant app directory:
- `mobile/CLAUDE.md` — mobile-specific rules
- `web/CLAUDE.md` — web-specific rules

## Supabase Migrations
- Never use `CREATE OR REPLACE FUNCTION`. It only replaces if the exact parameter signature matches — if parameters changed, it creates a duplicate overload. Always `DROP FUNCTION` first, then `CREATE FUNCTION`.
