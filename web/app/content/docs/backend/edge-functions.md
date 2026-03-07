# Edge Functions

## Deploying

Always deploy with `--no-verify-jwt` (required for asymmetric keys):

```bash
npx supabase functions deploy <function-name> --no-verify-jwt
```

**Important:** You must include `--no-verify-jwt` on every deploy — otherwise the gateway check is re-enabled and will reject requests.

## Authentication

Supabase has **deprecated gateway-level JWT verification** (`verify_jwt` flag) because it is incompatible with asymmetric JWT keys. Auth must now be handled **inside the function code**.

### For cron/internal functions (no user context)

Compare the Authorization header against the secret key:

```typescript
const authHeader = req.headers.get("Authorization");
if (authHeader !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}
```

### For user-facing functions (need user identity)

Use the `jose` library to verify JWTs with asymmetric keys:

```typescript
import * as jose from "jsr:@panva/jose@6";

const SUPABASE_JWT_ISSUER = Deno.env.get("SB_JWT_ISSUER") ??
  Deno.env.get("SUPABASE_URL") + "/auth/v1";

const SUPABASE_JWT_KEYS = jose.createRemoteJWKSet(
  new URL(Deno.env.get("SUPABASE_URL")! + "/auth/v1/.well-known/jwks.json"),
);

function verifySupabaseJWT(jwt: string) {
  return jose.jwtVerify(jwt, SUPABASE_JWT_KEYS, {
    issuer: SUPABASE_JWT_ISSUER,
  });
}
```

Or use Supabase's client library:

```typescript
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SB_PUBLISHABLE_KEY")!,
);

const { data, error } = await supabase.auth.getClaims(token);
```

## Environment Variables

Auto-injected by Supabase (no need to add as secrets):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`

**Naming gotcha:** After migrating to asymmetric keys, these env var names stay the same (legacy names) but their **values are updated** to the new asymmetric keys. For example, `SUPABASE_SERVICE_ROLE_KEY` contains the new secret key, not the old service role key. `SB_SECRET_KEY` and `SB_PUBLISHABLE_KEY` do NOT exist as auto-injected env vars in edge functions yet.

Custom secrets can be added via Dashboard > Edge Function Secrets, or:

```bash
npx supabase secrets set MY_SECRET=value
```

## Calling from SQL (pg_net)

Use `net.http_post` to call edge functions from SQL (e.g. cron jobs):

```sql
SELECT net.http_post(
  url := 'https://<project-ref>.supabase.co/functions/v1/<function-name>',
  headers := jsonb_build_object(
    'Authorization', 'Bearer <secret-key>',
    'Content-Type', 'application/json'
  ),
  body := '{}'
);
```

The bearer token must be the **new asymmetric secret key** from Dashboard > Settings > API Keys.

Note: `net.http_post` runs asynchronously — it returns immediately and the request is processed in the background.
