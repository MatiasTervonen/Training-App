import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check if the user has admin privileges
  const role = user.app_metadata?.role;
  if (role !== "admin" && role !== "super_admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const body = await req.json();
  const { user_id, duration, reason } = body;

  if (duration === "unban") {
    // Unban the user
    const { error: unbanError } = await supabase
      .from("users")
      .update({
        banned_until: null,
        ban_reason: null,
      })
      .eq("id", user_id);

    if (unbanError) {
      console.error("Error unbanning user:", unbanError);
      return new Response(JSON.stringify({ error: unbanError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  let bannedUntil = null;
  if (duration !== "permanent") {
    const hours = parseInt(duration.replace("h", ""), 10);
    if (isNaN(hours)) {
      return new Response(
        JSON.stringify({ error: "Invalid duration format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    bannedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
  } else {
    bannedUntil = new Date(Date.now() + 876600 * 60 * 60 * 1000);
  }

  const { error: dbError } = await supabase
    .from("users")
    .update({
      banned_until: bannedUntil.toISOString(),
      ban_reason: reason || null,
    })
    .eq("id", user_id);

  if (dbError) {
    console.error("Error updating user ban status:", dbError);
    return new Response(JSON.stringify({ error: dbError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
