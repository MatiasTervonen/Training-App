import { createAdminClient } from "@/utils/supabase/admin";
import { handleError } from "@/app/(app)/utils/handleError";

export async function POST(req: Request) {
  const adminSupabase = createAdminClient();

  const { id, email, display_name } = await req.json();

  const { error } = await adminSupabase.from("users").insert({
    id,
    email,
    display_name,
    role: "user",
  });

  if (error) {
    handleError(error, {
      message: "Error inserting user to users table",
      route: "/api/user/insert-account",
      method: "POST",
    });
    await adminSupabase.auth.admin.deleteUser(id, true);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
