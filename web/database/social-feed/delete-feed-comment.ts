import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function deleteFeedComment(commentId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.rpc("delete_feed_comment", {
    p_comment_id: commentId,
  });

  if (error) {
    handleError(error, {
      message: "Error deleting comment",
      route: "/database/social-feed/delete-feed-comment",
      method: "DELETE",
    });
    throw new Error("Error deleting comment");
  }
}
