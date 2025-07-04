import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (user?.email === "guest@example.com") {
    return new Response(JSON.stringify({ error: "demo_mode" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { title, notes, durationInSeconds } = body;

  const { data: timer, error: timerError } = await supabase
    .from("timers")
    .insert([
      {
        user_id: user.id,
        title,
        notes,
        time_seconds: durationInSeconds,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (timerError || !timer) {
    console.error("Supabase Insert Error:", timerError);
    return new Response(JSON.stringify({ error: timerError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ timer }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
