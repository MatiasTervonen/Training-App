import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function rejectFriendRequest(requestId: string) {
  const supabase = createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("id", requestId)
    .eq("receiver_id", user.sub);

  if (error) {
    handleError(error, {
      message: "Error rejecting friend request",
      route: "database/friends/reject-friend-request",
      method: "DELETE",
    });
    throw new Error("Error rejecting friend request");
  }

  return { success: true };
}
