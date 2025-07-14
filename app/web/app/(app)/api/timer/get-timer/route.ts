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

  const { data: timers, error: timerError } = await supabase
    .from("timers")
    .select("id, title, time_seconds, notes, created_at, user_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (timerError || !timers) {
    console.error("Supabase Insert Error:", timerError);
    return new Response(JSON.stringify({ error: timerError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(timers), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
