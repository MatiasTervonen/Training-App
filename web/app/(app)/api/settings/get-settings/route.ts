import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: userData, error } = await supabase
    .from("users")
    .select("display_name, weight_unit, profile_picture, role")
    .eq("id", user.sub)
    .single();

  if (error) {
    console.error("Error fetching settings:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(userData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
