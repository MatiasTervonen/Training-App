# Backend Overview

Provider: **Supabase** (PostgreSQL + Auth + Storage + Realtime)

The backend is fully managed by Supabase. There is no custom server — both the web and mobile apps connect directly to Supabase using client libraries.

## Architecture

Both the **Web** (Next.js) and **Mobile** (Expo) apps connect directly to Supabase — there is no custom backend server.

Supabase provides:
- **Auth** — Email/password, anonymous sign-in, JWT-based sessions
- **Database** — PostgreSQL with Row Level Security (RLS) on every table
- **RPC Functions** — All writes go through server-side `plpgsql` functions called via `supabase.rpc()`
- **Storage** — File buckets for voice recordings
- **Realtime** — Enabled for live updates

## Supabase Clients

### Web (Next.js)

- **Browser client** (`utils/supabase/client.ts`) — Client components, uses `@supabase/ssr`
- **Server client** (`utils/supabase/server.ts`) — Server actions & components, cookie-based sessions
- **Admin client** (`utils/supabase/admin.ts`) — Service-role key for privileged operations

### Mobile (React Native / Expo)

- **Single client** (`lib/supabase.ts`) — Uses `@supabase/supabase-js` with AsyncStorage for session persistence

## Data Access Pattern

Both apps use the same pattern — call RPC functions for writes, direct table queries for reads:

```typescript
// Write — via RPC function
const { data, error } = await supabase.rpc("activities_save_activity", {
  p_title: title,
  p_notes: notes,
  p_duration: duration,
  // ...
});

// Read — direct table query
const { data } = await supabase
  .from("feed_items")
  .select("*")
  .eq("user_id", userId);
```

## Environment Variables

### Web
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Anon/public key
- `SUPABASE_SECRET_KEY` — Service-role key (server only)

### Mobile
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Anon/public key

## Local Development

Supabase CLI runs a local instance with all services:

```bash
supabase start      # Start local Supabase
supabase stop       # Stop local Supabase
supabase status     # Show local service URLs & keys
```

Local ports:
- API: `54321`
- Database: `54322`
- Studio: `54323`
- Inbucket (email testing): `54324`