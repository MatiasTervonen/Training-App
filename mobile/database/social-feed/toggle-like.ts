import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function toggleLike(feedItemId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("toggle_feed_like", {
    p_feed_item_id: feedItemId,
  });

  if (error) {
    handleError(error, {
      message: "Error toggling like",
      route: "/database/social-feed/toggle-like",
      method: "POST",
    });
    throw new Error("Error toggling like");
  }

  return data as boolean;
}
