# Google Sign-In (Browser OAuth) — Feature Spec

## Context
Add Google Sign-In as an alternative authentication method alongside existing email/password and guest login. Uses Supabase OAuth with browser redirect (no native Google SDK needed). When a user signs in with Google, no password is created and email is automatically verified by Google.

---

## 1. Supabase Dashboard Configuration (Manual)

These steps must be done manually in the Supabase dashboard before the code works:

1. **Google Cloud Console:**
   - Create an OAuth 2.0 Client ID (Web application type)
   - Add authorized redirect URI: `https://gqcqrstelckhhunchm.supabase.co/auth/v1/callback`
   - Note the **Client ID** and **Client Secret**

2. **Supabase Dashboard → Authentication → Providers → Google:**
   - Enable Google provider
   - Paste Client ID and Client Secret
   - Leave "Skip nonce check" disabled

3. **Supabase Dashboard → Authentication → URL Configuration:**
   - Add `mytrack://auth/callback` to **Redirect URLs**

---

## 2. Install Dependency

`expo-web-browser` is already installed. No new packages needed.

---

## 3. Auth Action — Google Sign-In

**Edit:** `mobile/features/login-signup/actions.ts`

Add a new `signInWithGoogle` function:

```typescript
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";

type GoogleSignInProps = {
  setLoadingMessage: (msg: string) => void;
  setLoading: (loading: boolean) => void;
};

export async function signInWithGoogle({
  setLoadingMessage,
  setLoading,
}: GoogleSignInProps) {
  setLoadingMessage(t("login:login.actions.loggingIn"));
  setLoading(true);

  try {
    const redirectTo = makeRedirectUri();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      Alert.alert("", error?.message || t("login:login.actions.somethingWentWrong"));
      setLoading(false);
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo,
    );

    if (result.type === "success") {
      const url = new URL(result.url);
      // Extract tokens from URL fragment (hash)
      const params = new URLSearchParams(url.hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        // Session is set — onAuthStateChange in LayoutWrapper handles navigation
      } else {
        Alert.alert("", t("login:login.actions.somethingWentWrong"));
        setLoading(false);
      }
    } else {
      // User cancelled the browser
      setLoading(false);
    }
  } catch (error) {
    handleError(error, {
      message: "Error signing in with Google",
      route: "google-sign-in",
      method: "POST",
    });
    Alert.alert("", t("login:login.actions.somethingWentWrong"));
    setLoading(false);
  }
}
```

**Key points:**
- `skipBrowserRedirect: true` — we handle the browser ourselves
- `makeRedirectUri()` generates the correct `mytrack://` redirect URI
- After browser returns, extract tokens from the URL fragment and set the Supabase session
- `onAuthStateChange` in LayoutWrapper picks up the new session and navigates to dashboard/onboarding

---

## 4. Login Screen — Add Google Button

**Edit:** `mobile/app/login/index.tsx`

Add a "Sign in with Google" button to **both** the login form and sign-up form sections, so users see it regardless of which form is active.

Place it between the main login/signup button and the guest login / "don't have account" section:

```tsx
{/* Google Sign-In divider */}
<View className="flex-row items-center mt-8 mb-4">
  <View className="flex-1 h-px bg-gray-600" />
  <AppText className="mx-4 text-gray-400">{t("login.or")}</AppText>
  <View className="flex-1 h-px bg-gray-600" />
</View>

{/* Google Sign-In button */}
<AnimatedButton
  className="btn-neutral flex-row items-center justify-center gap-3"
  onPress={() =>
    signInWithGoogle({ setLoadingMessage, setLoading })
  }
>
  <GoogleIcon />
  <AppText>{t("login.signInWithGoogle")}</AppText>
</AnimatedButton>
```

**New component:** `mobile/components/icons/GoogleIcon.tsx`
- Simple SVG component rendering the Google "G" logo using `react-native-svg`
- Sized at 20x20

---

## 5. Security Page — Hide Password Section for Google Users

**Edit:** `mobile/app/menu/security/index.tsx`

- Check the user's auth provider to determine if they signed in with Google
- Hide the "Reset Password" section for Google users since they have no password
- Show an info message instead

```typescript
// Get auth provider from Supabase session
const [isGoogleUser, setIsGoogleUser] = useState(false);

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    const provider = session?.user?.app_metadata?.provider;
    setIsGoogleUser(provider === "google");
  });
}, []);
```

Then conditionally render the password section:

```tsx
{isGoogleUser ? (
  <View className="mb-10">
    <AppText className="text-gray-400 text-center">
      {t("menu:security.googleAccount")}
    </AppText>
  </View>
) : (
  // existing password reset section
)}
```

---

## 6. Translations

**Edit:** `mobile/locales/en/login.json` — add:
```json
"or": "or",
"signInWithGoogle": "Sign in with Google"
```

**Edit:** `mobile/locales/fi/login.json` — add:
```json
"or": "tai",
"signInWithGoogle": "Kirjaudu Googlella"
```

**Edit:** `mobile/locales/en/menu.json` — add to `security` section:
```json
"googleAccount": "You signed in with Google. Password management is handled through your Google account."
```

**Edit:** `mobile/locales/fi/menu.json` — add to `security` section:
```json
"googleAccount": "Kirjauduit sisään Googlella. Salasanaa hallitaan Google-tilisi kautta."
```

---

## 7. LayoutWrapper — Handle OAuth Callback Deep Link

**Edit:** `mobile/features/layout/LayoutWrapper.tsx`

The current deep link detection needs to also handle the `mytrack://auth/callback` URL so it doesn't try to navigate to a non-existent `/auth/callback` route. The OAuth callback is already handled in the `signInWithGoogle` function via `WebBrowser.openAuthSessionAsync`, so the LayoutWrapper just needs to not interfere:

- No changes needed if `WebBrowser.openAuthSessionAsync` handles the redirect internally (which it does — it intercepts the redirect before `Linking.getInitialURL` sees it)
- If issues arise, add `mytrack://auth/callback` to the ignore list in the deep link handling

---

## 8. Email Handling — Same Email Collision

**Supabase Dashboard → Authentication → General:**
- Verify that "Allow unconfirmed email sign-ins" is OFF
- Decide on account linking behavior:
  - **Recommended:** Enable "Automatically link accounts with the same email" — so a user who signed up with email can also use Google (and vice versa)
  - This is configured in Supabase Dashboard → Authentication → General settings

---

## 9. Files to Create/Modify

| Action | File |
|--------|------|
| **Edit** | `mobile/features/login-signup/actions.ts` |
| **Edit** | `mobile/app/login/index.tsx` |
| **Edit** | `mobile/app/menu/security/index.tsx` |
| **Create** | `mobile/components/icons/GoogleIcon.tsx` |
| **Edit** | `mobile/locales/en/login.json` |
| **Edit** | `mobile/locales/fi/login.json` |
| **Edit** | `mobile/locales/en/menu.json` |
| **Edit** | `mobile/locales/fi/menu.json` |

---

## 10. Verification

1. **Supabase config** — Google provider enabled, redirect URL added, account linking configured
2. **Login screen** — "Sign in with Google" button visible on both login and signup forms
3. **Google flow** — Tap button → browser opens → pick Google account → returns to app → navigated to dashboard
4. **New user** — First Google sign-in creates account, profile/settings created via existing onboarding flow
5. **Returning user** — Google sign-in logs in directly, navigates to dashboard
6. **Security page** — Google users see info message instead of password change form
7. **Account linking** — User who signed up with email can also sign in with Google (same email)
8. **Cancel flow** — User closes browser without signing in → returns to login screen, no errors
