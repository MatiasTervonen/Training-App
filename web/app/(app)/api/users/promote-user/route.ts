import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { handleError } from "@/app/(app)/utils/handleError";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check if the user has admin privileges
  const role = user.app_metadata?.role;
  if (role !== "admin" && role !== "super_admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const body = await req.json();
  const { userRole, user_id } = body;

  const { error: adminError } = await adminSupabase.auth.admin.updateUserById(
    user_id,
    {
      app_metadata: { role: userRole },
    }
  );

  if (adminError) {
    handleError(adminError, {
      message: "Error promoting user",
      route: "/api/users/promote-user",
      method: "POST",
    });
    return new Response(JSON.stringify({ error: adminError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: dbError } = await supabase
    .from("users")
    .update({ role: userRole })
    .eq("id", user_id);

  if (dbError) {
    handleError(dbError, {
      message: "Error updating user role in database",
      route: "/api/users/promote-user",
      method: "POST",
    });
    return new Response(JSON.stringify({ error: dbError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
