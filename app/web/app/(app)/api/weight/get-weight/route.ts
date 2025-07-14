import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: weight, error: weightError } = await supabase
    .from("weight")
    .select("id, weight, created_at, notes")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  console.log("Weight Data:", weight);

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
