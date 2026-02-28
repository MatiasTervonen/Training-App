import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function acceptFriendRequest(senderId: string) {
  const { error } = await supabase.rpc("accept_friend_request", {
    p_sender_id: senderId,
  });

  if (error) {
    handleError(error, {
      message: "Error accepting friend request",
      route: "/database/friend/accept",
      method: "POST",
    });
    throw new Error("Error accepting friend request");
  }

  return { success: true };
}
