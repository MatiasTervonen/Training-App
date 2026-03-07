import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function hideFeedItem(feedItemId: string) {
  const { error } = await supabase.rpc("hide_feed_item", {
    p_feed_item_id: feedItemId,
  });

  if (error) {
    handleError(error, {
      message: "Error hiding feed item",
      route: "/database/feed/hideFeedItem",
      method: "UPDATE",
    });
    throw new Error("Error hiding feed item");
  }

  return { success: true };
}
