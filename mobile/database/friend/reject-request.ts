import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function rejectFriendRequest(requestId: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("id", requestId)
    .eq("receiver_id", session.user.id);

  if (error) {
    handleError(error, {
      message: "Error rejecting friend request",
      route: "/database/friend/reject-request",
      method: "DELETE",
    });
    throw new Error("Error rejecting friend request");
  }

  return { success: true };
}
