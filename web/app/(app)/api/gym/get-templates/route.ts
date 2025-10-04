import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: template, error: templateError } = await supabase
    .from("gym_templates")
    .select("id, name, created_at")
    .eq("user_id", user.sub)
    .order("created_at", { ascending: false });

  if (templateError || !template) {
    console.error("Supabase Insert Error:", templateError);
    return new Response(JSON.stringify({ error: templateError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(template), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
