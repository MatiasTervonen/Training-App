import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function addFeedComment(
  feedItemId: string,
  content: string,
  parentId: string | null = null,
): Promise<string> {
  const { data, error } = await supabase.rpc("add_feed_comment", {
    p_feed_item_id: feedItemId,
    p_content: content,
    p_parent_id: parentId ?? undefined,
  });

  if (error) {
    handleError(error, {
      message: "Error adding comment",
      route: "/database/social-feed/add-feed-comment",
      method: "POST",
    });
    throw new Error("Error adding comment");
  }

  return data as string;
}
