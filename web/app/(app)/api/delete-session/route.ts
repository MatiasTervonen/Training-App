import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { item_id, table } = body;

  const { error: tableError } = await supabase
    .from(table)
    .delete()
    .eq("id", item_id)
    .eq("user_id", user.sub);

  if (tableError) {
    handleError(tableError, {
      message: "Error deleting session",
      route: "/api/auth/delete-session",
      method: "POST",
    });
    return NextResponse.json({ error: tableError.message }, { status: 500 });
  }

  const { error: pinnedError } = await supabase
    .from("pinned_items")
    .delete()
    .eq("item_id", item_id)
    .eq("type", table)
    .eq("user_id", user.sub);

  if (pinnedError) {
    handleError(pinnedError, {
      message: "Error deleting pinned item",
      route: "/api/auth/delete-session",
      method: "POST",
    });
    return NextResponse.json({ error: pinnedError.message }, { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
