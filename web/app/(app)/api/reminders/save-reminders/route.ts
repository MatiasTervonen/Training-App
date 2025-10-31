import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { notes, title, notify_at, type } = body;

  const { error: remindersError } = await supabase.from("reminders").insert([
    {
      user_id: user.sub,
      title,
      notes,
      notify_at,
      type: type,
    },
  ]);

  if (remindersError) {
    handleError(remindersError, {
      message: "Error saving reminders",
      route: "/api/reminders/save-reminders",
      method: "POST",
    });
    return new Response(JSON.stringify({ error: remindersError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
