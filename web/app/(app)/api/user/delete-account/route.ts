import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { handleError } from "@/app/(app)/utils/handleError";

export async function POST() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: usersTableError } = await supabase
    .from("users")
    .delete()
    .eq("id", user.sub);

  if (usersTableError) {
    handleError(usersTableError, {
      message: "Error fetching user",
      route: "/api/user/delete-account",
      method: "POST",
    });
  }

  const { error: authTableError } = await adminSupabase.auth.admin.deleteUser(
    user.sub,
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
