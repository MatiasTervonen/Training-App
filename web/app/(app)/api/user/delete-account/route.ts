import { createAdminClient } from "@/utils/supabase/admin";
import { handleError } from "@/utils/handleError";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const adminSupabase = createAdminClient();
  const token = authHeader.replace("Bearer ", "");

  const { data, error: authError } = await adminSupabase.auth.getClaims(token);

  const user = data?.claims;

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized " }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: authTableError } = await adminSupabase.auth.admin.deleteUser(
    user.sub,
    true,
  );

  if (authTableError) {
    handleError(authTableError, {
      message: "Error deleting user",
      route: "server-action: deleteAccount",
      method: "direct",
    });
    return new Response(JSON.stringify({ error: "Error deleting user" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
