import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function deleteFriend(friendId: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  if (!friendId || typeof friendId !== "string") {
    return { error: true, message: "Invalid friend ID" };
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
      route: "/database/friend/delete-friend",
      method: "DELETE",
    });
    throw new Error("Error fetching friend data");
  }

  // Determine the other user's ID
  const otherUserId =
    friendData.user1_id === session.user.id
      ? friendData.user2_id
      : friendData.user1_id;

  const { error: deleteError } = await supabase
    .from("friends")
    .delete()
    .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
    .eq("id", friendId);

  if (deleteError) {
    handleError(deleteError, {
      message: "Error deleting friendship",
      route: "/database/friend/delete-friend",
      method: "DELETE",
    });
    throw new Error("Error deleting friendship");
  }

  // Optionally, you can also delete any related friend requests
  const { error: requestDeleteError } = await supabase
    .from("friend_requests")
    .delete()
    .or(
      `and(sender_id.eq.${session.user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${session.user.id})`
    )
    .eq("status", "accepted");

  if (requestDeleteError) {
    handleError(requestDeleteError, {
      message: "Error deleting related friend requests",
      route: "/database/friend/delete-friend",
      method: "DELETE",
    });
    throw new Error("Error deleting related friend requests");
  }

  return { success: true };
}
