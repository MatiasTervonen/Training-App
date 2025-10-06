import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";
import { handleError } from "@/app/(app)/utils/handleError";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { item_id, table } = await req.json();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { error } = await supabase
    .from("pinned_items")
    .delete()
    .eq("user_id", user.sub)
    .eq("type", table)
    .eq("item_id", item_id);

  if (error) {
    handleError(error, {
      message: "Error unpinning item",
      route: "/api/pinned/unpin-items",
      method: "POST",
    });
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  return new Response("Unpinned", { status: 200 });
}
