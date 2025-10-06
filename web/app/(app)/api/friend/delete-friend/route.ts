import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

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
    handleError(friendError, {
      message: "Error fetching friend data",
      route: "/api/friend/delete-friend",
      method: "DELETE",
    });
    return new Response(JSON.stringify({ error: "Friend not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Determine the other user's ID
  const otherUserId =
    friendData.user1_id === user.sub
      ? friendData.user2_id
      : friendData.user1_id;

  const { error: deleteError } = await supabase
    .from("friends")
    .delete()
    .or(`user1_id.eq.${user.sub},user2_id.eq.${user.sub}`)
    .eq("id", friendId);

  if (deleteError) {
    handleError(deleteError, {
      message: "Error deleting friendship",
      route: "/api/friend/delete-friend",
      method: "DELETE",
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
    handleError(requestDeleteError, {
      message: "Error deleting related friend requests",
      route: "/api/friend/delete-friend",
      method: "DELETE",
    });
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
