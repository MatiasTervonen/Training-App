import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;
  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: weight, error: weightError } = await supabase
    .from("weight")
    .select("id, weight, created_at, notes")
    .eq("user_id", user.sub)
    .order("created_at", { ascending: true });

  if (weightError || !weight) {
    console.error("Supabase Insert Error:", weightError);
    return new Response(JSON.stringify({ error: weightError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(weight), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
