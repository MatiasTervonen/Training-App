import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function acceptFriendRequest(sender_id: string) {
  const supabase = createClient();

  const { error } = await supabase.rpc("accept_friend_request", {
    p_sender_id: sender_id,
  });

  if (error) {
    handleError(error, {
      message: "Error accepting friend request",
      route: "database/friends/accept-friend-request",
      method: "POST",
    });
    throw new Error("Error accepting friend request");
  }

  return { success: true };
}
