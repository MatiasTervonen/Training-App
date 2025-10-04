import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { friendId } = body;

  if (!friendId || typeof friendId !== "string") {
    return new Response(JSON.stringify({ error: "Invalid friend ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // get the other user's ID
  const { data: friendData, error: friendError } = await supabase
    .from("friends")
    .select("user1_id, user2_id")
    .eq("id", friendId)
    .single();

  if (friendError || !friendData) {
    console.error("Supabase Friend Lookup Error:", friendError);
    return new Response(JSON.stringify({ error: "Friend not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Determine the other user's ID
  const otherUserId =
    friendData.user1_id === user.sub ? friendData.user2_id : friendData.user1_id;

  const { error: deleteError } = await supabase
    .from("friends")
    .delete()
    .or(`user1_id.eq.${user.sub},user2_id.eq.${user.sub}`)
    .eq("id", friendId);

  if (deleteError) {
    console.error("Supabase Delete Error:", deleteError);
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Optionally, you can also delete any related friend requests
  const { error: requestDeleteError } = await supabase
    .from("friend_requests")
    .delete()
    .or(
      `and(sender_id.eq.${user.sub},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.sub})`
    )
    .eq("status", "accepted");

  if (requestDeleteError) {
    console.error("Supabase Friend Request Delete Error:", requestDeleteError);
    return new Response(
      JSON.stringify({ error: requestDeleteError?.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
