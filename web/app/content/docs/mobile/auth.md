# Authentication

Provider: **Supabase Auth** (`@supabase/supabase-js` + `AsyncStorage`)

## Key Files

**Supabase Client**
- `lib/supabase.ts` — Single client with AsyncStorage for session persistence

**Auth Screens**
- `app/login/index.tsx` — Login / Signup screen
- `Features/login-signup/actions.ts` — Auth functions (signIn, signUp, reset, resend, guest)
- `app/email-verified/index.tsx` — Success screen after email verification
- `app/menu/security/index.tsx` — Password change & account deletion

**Auth Guard**
- `Features/layout/LayoutWrapper.tsx` — Session check & navigation guard

**State & Session**
- `lib/stores/useUserStore.ts` — Zustand store (profile, settings, role)
- `lib/handleSignout.ts` — Sign out hook (cache + store clearing)

## Supabase Client

Single client in `lib/supabase.ts` configured with:
- **Storage:** AsyncStorage (React Native compatible)
- **Auto-refresh:** Enabled, managed by AppState listener
- **Session persistence:** Enabled across app restarts
- **URL detection:** Disabled (not applicable for mobile)

The app listens to `AppState` changes — starts token refresh when the app enters foreground, stops when backgrounded.

## Route Protection

### LayoutWrapper (`Features/layout/LayoutWrapper.tsx`)

The auth guard that wraps the entire app:

1. Waits for Zustand store to hydrate from AsyncStorage
2. Calls `supabase.auth.getSession()` to check for valid session
3. Subscribes to `supabase.auth.onAuthStateChange()` for real-time auth events

**Navigation logic:**
- No session → Log out, redirect to `/` (landing)
- Has session → Fetch profile & settings, redirect to `/dashboard`
- Has session + widget deep link (`mytrack://gym` etc.) → Fetch profile & settings, skip dashboard redirect, set `feedReady` to bypass BootScreen
- `USER_UPDATED` event (password change) → Stay on current screen
- `INITIAL_SESSION` event → Skipped (handled by `getSession()` to avoid racing with deep link detection)

## Roles

Same as web — stored in `app_metadata.role` on the JWT.

- `user` — Standard app access
- `admin` — Standard app access (no admin routes in mobile)
- `super_admin` — Standard app access (no admin routes in mobile)
- `guest` — All features available, but data deleted on logout. Cannot change password or delete account.

## Auth Flows

### Login
```
User submits email/password
→ signInWithEmail() in actions.ts
→ supabase.auth.signInWithPassword()
→ onAuthStateChange fires → LayoutWrapper fetches profile
→ Redirect to /dashboard
```

### Signup
```
User submits email/password
→ signUpWithEmail() (validates password ≥ 8 chars, checks for existing email)
→ supabase.auth.signUp()
→ Verification email sent with deep link (mytrack://email-verified)
→ User clicks link → opens app at /email-verified screen
→ User navigates to login
```

### Password Reset (from login screen)
```
User requests reset
→ sendPasswordResetEmail() in actions.ts
→ supabase.auth.resetPasswordForEmail()
→ User completes reset via email link (opens web app)
```

### Password Change (in-app, from /menu/security)
```
User enters new password
→ supabase.auth.updateUser({ password })
→ Force sign out after 3 seconds
→ User logs back in with new password
```

### Guest Login
```
guestLogIn() in actions.ts
→ supabase.auth.signInAnonymously()
→ Redirect to /dashboard
```

### Sign Out (`lib/handleSignout.ts`)
```
supabase.auth.signOut({ scope: "global" })
→ Clear TanStack React Query cache
→ Clear AsyncStorage (drafts, stores, session data)
→ Clear Zustand user store
→ Redirect to /
```

## Account Deletion

Done from `app/menu/security/index.tsx`. User types a confirmation phrase, then the app calls the web app's API:

```
POST https://training-app-bay.vercel.app/api/user/delete-account
Authorization: Bearer {session.access_token}
```

The web app's admin client handles the actual deletion. Guest accounts cannot delete.

## User State Management

**Zustand store** (`useUserStore`) persists to AsyncStorage:

```typescript
// Profile
display_name: string
weight_unit: string
profile_picture: string | null
role: string | null

// Settings
push_enabled: boolean
gps_tracking_enabled: boolean
language: "en" | "fi" | null
```

On login, `LayoutWrapper` fetches the user profile and settings from the database and hydrates the store.

## Deep Linking

The app uses the `mytrack://` URL scheme (defined in `app.json`) for:
- Email verification links → `mytrack://email-verified`
- Android widget navigation → `mytrack://gym`, `mytrack://timer`, `mytrack://activities`, etc.

**Widget deep link flow:**
```
Widget button tapped (OPEN_URI action)
→ Android opens app with mytrack://{route}
→ LayoutWrapper detects deep link via Linking.getInitialURL()
→ User data loaded, but dashboard redirect skipped
→ feedReady set immediately (bypasses BootScreen)
→ Expo Router navigates to the deep link target
```

## Environment Variables

- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key
