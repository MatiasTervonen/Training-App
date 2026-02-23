# API Routes

Next.js API routes act as a server-side proxy for operations that can't run directly from the mobile app — mainly because they need the **admin (service-role) key** or server-only libraries like `sharp`.

## Why API Routes?

The mobile app can't use the Supabase admin key directly — it would be exposed in the app bundle. Instead, the mobile app calls Next.js API routes with the user's **Bearer token**, and the route validates the token server-side before performing privileged operations.

```
Mobile App
  → fetch("/api/...", { headers: { Authorization: "Bearer <access_token>" } })
  → Next.js API Route
    → Validates token via supabase.auth.getClaims(token)
    → Performs the operation using admin client or server client
    → Returns JSON response
```

## Authentication Pattern

Every API route that the mobile app calls follows the same pattern:

1. Extract the `Authorization: Bearer <token>` header
2. Verify the token locally via `getClaims(token)` (asymmetric signature check)
3. Perform the operation as that user
4. Return a JSON response

```typescript
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const supabase = await createClient();
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);

  if (error || !data?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // data.claims.sub = user ID
  // ... perform operation
}
```

The **server client** (`utils/supabase/server.ts`) automatically forwards the `Authorization` header, so RPC calls and queries inside API routes run as the authenticated user.

## Mobile App Usage

The mobile app uses `EXPO_PUBLIC_API_URL` as the base URL and passes the Supabase access token:

```typescript
const { data: { session } } = await supabase.auth.getSession();

const res = await fetch(
  `${process.env.EXPO_PUBLIC_API_URL}/api/user/delete-account`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  }
);
```

## Routes

### `POST /api/user/delete-account`

Deletes the authenticated user's account. Uses the **admin client** because `auth.admin.deleteUser()` requires the service-role key.

- **Auth:** Bearer token → `adminSupabase.auth.getClaims(token)`
- **Client:** Admin (service-role)

### `POST /api/settings/save-profilePic-mobile`

Uploads and optimizes a profile picture from the mobile app. Uses `sharp` to resize to 300x300 and convert to WebP.

- **Auth:** Bearer token → `supabase.auth.getClaims(token)`
- **Client:** Server (forwards auth header)
- **Body:** `FormData` with `file` field
- **Returns:** `{ publicUrl: string }`

### `POST /api/settings/save-profilePic-web`

Same as the mobile version but authenticates via cookies (no Bearer token needed since the web app uses cookie-based sessions).

- **Auth:** Cookie-based via `supabase.auth.getClaims()`
- **Client:** Server

### `POST /api/reminder-cronjob`

Cron job that sends push notifications for due reminders. Triggered by an external scheduler, not by users.

- **Auth:** `CRON_SECRET` environment variable (not user tokens)
- **Client:** Admin (service-role)
- **Sends:** Web push via `web-push` library + mobile push via Expo Push API
- **Cleanup:** Removes invalid push tokens (410/404 responses)