import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  console.log("Deleting session with ID:", id); 

  if (!id) {
    return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
