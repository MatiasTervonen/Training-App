# Google Sign-In — Web Feature Spec

## Context
Add Google Sign-In as an alternative authentication method alongside existing email/password and guest login on the web app. Uses Supabase OAuth with PKCE flow (server-side). When a user signs in with Google, no password is created and email is automatically verified by Google. The same Supabase Google provider configured for mobile is reused — only a new authorized redirect URI needs to be added.

---

## 1. Supabase Dashboard Configuration (Manual)

The Google provider is already enabled in Supabase (configured for mobile). Only one change is needed:

1. **Google Cloud Console → OAuth 2.0 Client → Authorized redirect URIs:**
   - Add: `https://<project-ref>.supabase.co/auth/v1/callback` (already exists from mobile)
   - Verify the web app's origin is in **Authorized JavaScript origins** (e.g. `http://localhost:3000`, `https://yourproduction.domain`)

2. **Supabase Dashboard → Authentication → URL Configuration:**
   - Add `http://localhost:3000/auth/callback` to **Redirect URLs** (for local dev)
   - Add `https://yourproduction.domain/auth/callback` to **Redirect URLs** (for production)

---

## 2. Auth Callback Route

**New file:** `web/app/auth/callback/route.ts`

Handles the OAuth callback from Supabase. After the user authenticates with Google, Supabase redirects here with an authorization `code`. The route exchanges the code for a session and redirects to the dashboard.

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
```

**Key points:**
- Uses PKCE flow (`exchangeCodeForSession`) — the standard for server-side Next.js apps
- On success: redirects to `/dashboard` (same as email/password login)
- On failure: redirects back to `/login` with error param
- `onAuthStateChange` / existing session detection in the app handles the rest

---

## 3. Google Sign-In Action

**Edit:** `web/app/login/actions.ts`

Add a new server action that initiates the Google OAuth flow:

```typescript
export async function signInWithGoogle(): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error || !data.url) {
    return { error: error?.message || "Something went wrong." };
  }

  return { url: data.url };
}
```

**Key points:**
- Server action returns the OAuth URL — client redirects to it
- `redirectTo` points to the new `/auth/callback` route
- Uses `NEXT_PUBLIC_SITE_URL` env variable (should already be set, or use `headers().get("origin")` as fallback)

---

## 4. Google Icon Component

**New file:** `web/components/icons/GoogleIcon.tsx`

Simple SVG component rendering the Google "G" logo, matching the mobile implementation:

```tsx
export default function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
```

---

## 5. Login Page — Add Google Button

**Edit:** `web/app/login/page.tsx`

Add a "Sign in with Google" button to **both** the login form and the sign-up form, so users see it regardless of which form is active.

### Imports to add:
```tsx
import { signInWithGoogle } from "@/app/login/actions";
import GoogleIcon from "@/components/icons/GoogleIcon";
```

### New state:
```tsx
const [googleLoading, setGoogleLoading] = useState(false);
```

### Google sign-in handler:
```tsx
const handleGoogleSignIn = async () => {
  setGoogleLoading(true);
  const result = await signInWithGoogle();
  if (result.url) {
    window.location.href = result.url;
  } else {
    setError(result.error ?? t("login.actions.somethingWentWrong"));
    setGoogleLoading(false);
  }
};
```

### UI placement — in both forms

Place the Google button between the main action button section and the guest login / "don't have account" area. Add this block in **both** the login form and the sign-up form:

```tsx
{/* Google Sign-In divider */}
<div className="flex items-center mt-4">
  <div className="flex-1 h-px bg-gray-600" />
  <span className="mx-4 text-gray-400">{t("login.or")}</span>
  <div className="flex-1 h-px bg-gray-600" />
</div>

{/* Google Sign-In button */}
<button
  type="button"
  onClick={handleGoogleSignIn}
  disabled={googleLoading}
  className="flex items-center justify-center gap-3 w-full border-2 border-gray-600 p-2 rounded-md bg-slate-800 hover:bg-slate-700 hover:scale-105 transition-all duration-200 cursor-pointer"
>
  <GoogleIcon />
  <span>{t("login.signInWithGoogle")}</span>
</button>
```

**Login form:** Place after the `</div>` that wraps `<LoginButton />` + error message (line ~145), before the guest login button section.

**Sign-up form:** Place after the `</div>` that wraps `<SignupButton />` + error message (line ~291), before the resend email link.

### Loading state:
```tsx
{googleLoading && <FullScreenLoader message={t("login.actions.loggingIn")} />}
```

---

## 6. Security Page — Hide Password Section for Google Users

**Edit:** `web/app/(app)/menu/security/page.tsx`

Google users don't have a password, so the password change section should be hidden for them.

### Add state and effect:
```tsx
const [isGoogleUser, setIsGoogleUser] = useState(false);

useEffect(() => {
  const supabase = createClient();
  supabase.auth.getSession().then(({ data: { session } }) => {
    const provider = session?.user?.app_metadata?.provider;
    setIsGoogleUser(provider === "google");
  });
}, []);
```

### Conditionally render password section:

Wrap the existing password reset section (h2 title through the save button) in a conditional:

```tsx
{isGoogleUser ? (
  <div className="mb-10">
    <h2 className="mb-5 underline">{t("security.resetPassword.title")}</h2>
    <p className="text-gray-400 text-center">
      {t("security.googleAccount")}
    </p>
  </div>
) : (
  // existing password reset section (h2, description, inputs, save button)
)}
```

---

## 7. Translations

**Edit:** `web/app/lib/i18n/locales/en/login.json` — add to `"login"` object:
```json
"or": "or",
"signInWithGoogle": "Sign in with Google"
```

**Edit:** `web/app/lib/i18n/locales/fi/login.json` — add to `"login"` object:
```json
"or": "tai",
"signInWithGoogle": "Kirjaudu Googlella"
```

**Edit:** `web/app/lib/i18n/locales/en/menu.json` — add to `"security"` object:
```json
"googleAccount": "You signed in with Google. Password management is handled through your Google account."
```

**Edit:** `web/app/lib/i18n/locales/fi/menu.json` — add to `"security"` object:
```json
"googleAccount": "Kirjauduit sisään Googlella. Salasanaa hallitaan Google-tilisi kautta."
```

---

## 8. Environment Variable

Ensure `NEXT_PUBLIC_SITE_URL` is set in `.env.local`:
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

And in production environment:
```
NEXT_PUBLIC_SITE_URL=https://yourproduction.domain
```

This is used by `signInWithGoogle` to construct the callback redirect URL.

---

## 9. Files to Create/Modify

| Action | File |
|--------|------|
| **Create** | `web/app/auth/callback/route.ts` |
| **Create** | `web/components/icons/GoogleIcon.tsx` |
| **Edit** | `web/app/login/actions.ts` |
| **Edit** | `web/app/login/page.tsx` |
| **Edit** | `web/app/(app)/menu/security/page.tsx` |
| **Edit** | `web/app/lib/i18n/locales/en/login.json` |
| **Edit** | `web/app/lib/i18n/locales/fi/login.json` |
| **Edit** | `web/app/lib/i18n/locales/en/menu.json` |
| **Edit** | `web/app/lib/i18n/locales/fi/menu.json` |

---

## 10. Verification

1. **Supabase config** — Google provider enabled (already done for mobile), web callback URL added to redirect URLs
2. **Login page** — "Sign in with Google" button visible on both login and signup forms with "or" divider
3. **Google flow** — Click button → redirects to Google → pick account → returns to `/auth/callback` → redirected to dashboard
4. **New user** — First Google sign-in creates account, profile/settings created via existing onboarding flow
5. **Returning user** — Google sign-in logs in directly, navigates to dashboard
6. **Security page** — Google users see info message instead of password change form; delete account section still visible
7. **Account linking** — User who signed up with email can also sign in with Google (same email) if Supabase auto-linking is enabled
8. **Error handling** — If OAuth fails, user is redirected back to login with error
9. **Translations** — All new strings display correctly in both English and Finnish
