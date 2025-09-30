import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { notes, title, notify_at } = body;

  const { data: notesData, error: notesError } = await supabase
    .from("notes")
    .insert([
      {
        user_id: user.id,
        title,
        notes,
        notify_at,
      },
    ])
    .select()
    .single();

  if (notesError || !notesData) {
    console.error("Supabase Insert Error:", notesError);
    return new Response(JSON.stringify({ error: notesError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, notes: notesData }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
