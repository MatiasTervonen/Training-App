import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";
import { handleError } from "@/app/(app)/utils/handleError";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { item_id, table } = body;

  if (!item_id || !table) {
    return new Response("Invalid request", { status: 400 });
  }

  const { data: pinnedItem, error } = await supabase
    .from("pinned_items")
    .upsert(
      [
        {
          user_id: user.sub,
          item_id: item_id,
          type: table,
        },
      ],
      { onConflict: "user_id,type,item_id" } // Ensure upsert on user_id, item_id, and type
    )
    .select()
    .single();

  if (error || !pinnedItem) {
    handleError(error, {
      message: "Error pinning item",
      route: "/api/pinned/pin-items",
      method: "POST",
    });
    return new Response(JSON.stringify({ error: error?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ success: true, pinnedItem: pinnedItem }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
