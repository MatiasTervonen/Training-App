# Authentication

Provider: **Supabase Auth** (`@supabase/ssr` + `@supabase/supabase-js`)

## Key Files

**Supabase Clients**
- `utils/supabase/client.ts` — Browser client
- `utils/supabase/server.ts` — Server client (cookies & headers)
- `utils/supabase/admin.ts` — Admin client (service-role key)
- `utils/supabase/middleware.ts` — Session refresh & route protection

**Auth Pages**
- `app/login/page.tsx` — Login / Signup page
- `app/login/actions.ts` — Server actions (login, signup, reset, resend)
- `app/login/guest-login/action.ts` — Guest login action
- `app/reset-password/page.tsx` — Password reset form
- `app/email-verified/page.tsx` — Success page after verification
- `app/error/page.tsx` — Expired link error page

**Auth Routes**
- `proxy.ts` — Middleware wrapper (defines which routes skip auth)
- `app/auth/confirm/route.ts` — Email verification & reset callback
- `app/auth/link/page.tsx` — Intermediate page for email links

**State & Session**
- `lib/stores/useUserStore.ts` — Zustand store (preferences & role)
- `lib/handleSignOut.ts` — Sign out hook (cache + store clearing)
- `components/HydrateUser.tsx` — Hydrates stores on mount

## Supabase Clients

Three separate clients exist for different contexts:

- **Browser client** (`client.ts`) — used in client components. Created with the public anon key.
- **Server client** (`server.ts`) — used in server actions and server components. Reads/writes cookies via `next/headers`. Also forwards `Authorization` headers from mobile/API clients.
- **Admin client** (`admin.ts`) — uses the secret service-role key. Only used for privileged operations like deleting user accounts.

## Token Verification

The project uses Supabase **asymmetric JWTs (RS256)**. Token verification is done via `supabase.auth.getClaims(token)`, which validates the JWT signature locally using the public key — no network call to Supabase Auth is needed. This is why `getClaims` is used everywhere instead of `getUser`.

## Route Protection

### Middleware (`proxy.ts` + `utils/supabase/middleware.ts`)

The `updateSession()` function runs on every request and:

1. Refreshes the Supabase session via `auth.getClaims()`
2. Checks user authentication and role
3. Applies redirect rules:

- Unauthenticated → protected route → **Redirect to `/`**
- Unauthenticated → `/login` or `/` → **Allowed**
- Authenticated → `/` or `/login` → **Redirect to `/dashboard`**
- Non-admin → `/admin/*` → **Blocked**

Routes that bypass middleware entirely: `/auth/link`, `/auth/confirm`, `/error`, `/email-verified`, static assets, API routes.

## Roles

Stored in `app_metadata.role` on the JWT. Checked in middleware for admin routes.

- `user` — Standard app access
- `admin` — App + `/admin/*` routes
- `super_admin` — App + `/admin/*` routes
- `guest` — Limited app access (anonymous sign-in)

## Auth Flows

### Login
```
User submits email/password
→ login() server action
→ supabase.auth.signInWithPassword()
→ Redirect to /dashboard
→ Middleware verifies session on every request
```

### Signup
```
User submits email/password
→ signup() server action (validates password ≥ 8 chars, checks for existing email)
→ supabase.auth.signUp()
→ Verification email sent
→ User clicks link → /auth/link → /auth/confirm
→ verifyOtp() → sign out → /email-verified
→ 10s countdown → redirect to /login
```

### Password Reset
```
User requests reset
→ sendPasswordResetEmail() server action
→ supabase.auth.resetPasswordForEmail()
→ User clicks email link → /auth/link?type=recovery
→ /auth/confirm?type=recovery
→ /reset-password page
→ supabase.auth.updateUser({ password })
→ Sign out → redirect to /login
```

### Guest Login
```
guestLogin() server action
→ supabase.auth.signInAnonymously()
→ Redirect to /dashboard
```

### Sign Out (`lib/handleSignOut.ts`)
```
supabase.auth.signOut({ scope: "global" })
→ Clear TanStack React Query cache
→ Clear Zustand user store
→ Clear localStorage
→ Redirect to /login
```

## User State Management

**Zustand store** (`useUserStore`) persists to localStorage:

```typescript
preferences: {
  display_name: string
  weight_unit: string
  profile_picture: string | null
  language: "en" | "fi" | null
}
role: "user" | "admin" | "super_admin" | "guest" | null
```

On app load, `HydrateUser` (server component) fetches the user profile from the `users` table and hydrates the store. `SplashScreen` shows a loading state until hydration completes.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key
- `SUPABASE_SECRET_KEY` — Supabase service-role key (server only)
