import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import type { FullActivitySession } from "@/types/models";

export async function getFriendActivitySession(feedItemId: string): Promise<FullActivitySession> {
  const supabase = createClient();

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

  return data as unknown as FullActivitySession;
}
