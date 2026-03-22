import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import { FeedComment } from "@/types/social-feed";

export async function getFeedComments(feedItemId: string): Promise<FeedComment[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_feed_comments", {
    p_feed_item_id: feedItemId,
  });

  if (error) {
    handleError(error, {
      message: "Error fetching comments",
      route: "/database/social-feed/get-feed-comments",
      method: "GET",
    });
    throw new Error("Error fetching comments");
  }

  return (data ?? []) as unknown as FeedComment[];
}
