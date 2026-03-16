import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getFriendGymSession(feedItemId: string) {
  const { data, error } = await supabase.rpc("get_friend_gym_session", {
    p_feed_item_id: feedItemId,
  });

  if (error) {
    handleError(error, {
      message: "Error fetching friend gym session",
      route: "/database/social-feed/get-friend-gym-session",
      method: "GET",
    });
    throw new Error("Error fetching friend gym session");
  }

  return data;
}
