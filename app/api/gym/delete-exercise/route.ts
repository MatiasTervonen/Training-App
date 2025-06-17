import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { item_id } = body;

 
  const { error } = await supabase
    .from("gym_exercises")
    .delete()
    .eq("id", item_id)

  if (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}