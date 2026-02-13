import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function deleteFriend(friendId: string) {
  const supabase = createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  if (!friendId || typeof friendId !== "string") {
    throw new Error("Invalid friend ID");
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
      route: "serverAction: deleteFriend",
      method: "DELETE",
    });
    throw new Error("Error fetching friend data");
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
      route: "serverAction: deleteFriend",
      method: "DELETE",
    });
    throw new Error("Error deleting friendship");
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
      route: "serverAction: deleteFriend",
      method: "DELETE",
    });
    throw new Error("Error deleting related friend requests");
  }

  return { success: true };
}
