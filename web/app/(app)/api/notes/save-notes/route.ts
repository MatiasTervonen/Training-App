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
  const { notes, title } = body;

  const { data: notesData, error: notesError } = await supabase
    .from("notes")
    .insert([
      {
        user_id: user.sub,
        title,
        notes,
      },
    ])
    .select()
    .single();

  if (notesError || !notesData) {
    handleError(notesError, {
      message: "Error saving notes",
      route: "/api/notes/save-notes",
      method: "POST",
    });
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
