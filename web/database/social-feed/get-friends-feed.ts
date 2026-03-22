import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import { SocialFeedItem } from "@/types/social-feed";

const PAGE_SIZE = 10;

export async function getFriendsFeed(offset: number): Promise<SocialFeedItem[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_friends_feed", {
    p_limit: PAGE_SIZE,
    p_offset: offset,
  });

  if (error) {
    handleError(error, {
      message: "Error fetching friends feed",
      route: "/database/social-feed/get-friends-feed",
      method: "GET",
    });
    throw new Error("Error fetching friends feed");
  }

  return (data ?? []) as SocialFeedItem[];
}

export { PAGE_SIZE };
