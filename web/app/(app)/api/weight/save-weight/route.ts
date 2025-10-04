import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { weight, title, notes } = body;

  const { data: weightData, error: weightError } = await supabase
    .from("weight")
    .insert([
      {
        user_id: user.sub,
        title,
        notes,
        weight,
      },
    ])
    .select()
    .single();

  if (weightError || !weightData) {
    console.error("Supabase Insert Error:", weightError);
    return new Response(JSON.stringify({ error: weightError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, weight: weightData }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
