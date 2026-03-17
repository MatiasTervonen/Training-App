import { useQuery } from "@tanstack/react-query";
import { getFeedComments } from "@/database/social-feed/get-feed-comments";
import { FeedComment } from "@/types/social-feed";

export default function useFeedComments(feedItemId: string | null) {
  return useQuery<FeedComment[]>({
    queryKey: ["feed-comments", feedItemId],
    queryFn: () => getFeedComments(feedItemId!),
    enabled: !!feedItemId,
  });
}
