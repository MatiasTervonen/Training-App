import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";

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
  const { item_id, table, notes, title, weight, duration } = body;

  if (!item_id || !table) {
    return new Response("Invalid request", { status: 400 });
  }

  const { data, error } = await supabase
    .from("pinned_items")
    .upsert(
      [
        {
          user_id: user.id,
          item_id: item_id,
          type: table,
          notes: notes ?? null,
          title: title ?? null,
          weight: weight ?? null,
          duration: duration ?? null,
        },
      ],
      { onConflict: "user_id,type,item_id" } // Ensure upsert on user_id, item_id, and type
    )
    .select()
    .single();

  if (error || !data) {
    console.error("Supabase Insert Error:", error);
    return new Response(JSON.stringify({ error: error?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, pinnedItem: data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
