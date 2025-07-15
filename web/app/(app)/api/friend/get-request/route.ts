import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: requests, error: requestsError } = await supabase
    .from("friend_requests")
    .select(
      "id, sender_id, receiver_id, created_at, sender:sender_id(display_name, id)"
    )
    .eq("receiver_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

    console.log("Friend Requests:", requests);

  if (requestsError || !requests) {
    console.error("Supabase Fetch Error:", requestsError);
    return new Response(JSON.stringify({ error: requestsError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(requests), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
