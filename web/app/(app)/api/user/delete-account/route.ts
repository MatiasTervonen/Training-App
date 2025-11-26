import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { handleError } from "@/app/(app)/utils/handleError";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const token = authHeader.replace("Bearer ", "");

  const { data: userData, error } = await adminSupabase.auth.getUser(token);

  if (error || !userData.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: usersTableError } = await supabase
    .from("users")
    .delete()
    .eq("id", userData.user.id);

  if (usersTableError) {
    handleError(usersTableError, {
      message: "Error fetching user",
      route: "/api/user/delete-account",
      method: "POST",
    });
  }

  const { error: authTableError } = await adminSupabase.auth.admin.deleteUser(
    userData.user.id,
    true
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
