import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { handleError } from "@/app/(app)/utils/handleError";

export async function POST() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { error: usersTableError } = await supabase
    .from("users")
    .delete()
    .eq("id", user.id);

  if (usersTableError) {
    handleError(usersTableError, {
      message: "Error fetching user",
      route: "/api/user/delete-account",
      method: "POST",
    });
  }

  const { error: authTableError } = await adminSupabase.auth.admin.deleteUser(
    user.sub
  );

  if (authTableError) {
    handleError(authTableError, {
      message: "Error deleting user",
      route: "server-action: deleteAccount",
      method: "direct",
    });
    throw new Error("Error deleting user");
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
