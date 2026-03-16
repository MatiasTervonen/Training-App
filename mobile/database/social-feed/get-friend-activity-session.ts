import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getFriendActivitySession(feedItemId: string) {
  const { data, error } = await supabase.rpc("get_friend_activity_session", {
    p_feed_item_id: feedItemId,
  });

  if (error) {
    handleError(error, {
      message: "Error fetching friend activity session",
      route: "/database/social-feed/get-friend-activity-session",
      method: "GET",
    });
    throw new Error("Error fetching friend activity session");
  }

  return data;
}
