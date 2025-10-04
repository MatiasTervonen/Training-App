import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, display_name, email, role, created_at, banned_until")
    .order("created_at", { ascending: false });

  if (usersError || !users) {
    console.error("Supabase Fetch Error:", usersError);
    return new Response(JSON.stringify({ error: usersError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(users), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
