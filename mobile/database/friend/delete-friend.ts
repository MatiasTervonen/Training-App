import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function deleteFriend(friendId: string) {
  const { error } = await supabase.rpc("delete_friend", {
    p_friend_id: friendId,
  });

  if (error) {
    handleError(error, {
      message: "Error deleting friend",
      route: "/database/friend/delete-friend",
      method: "DELETE",
    });
    throw new Error("Error deleting friend");
  }

  return { success: true };
}
