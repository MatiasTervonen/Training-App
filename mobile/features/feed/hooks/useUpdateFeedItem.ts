import { FeedItemUI, FeedData } from "@/types/session";
import { useQueryClient } from "@tanstack/react-query";

export default function useUpdateFeedItem(queryKey: string[] = ["feed"]) {
  const queryClient = useQueryClient();

  const updateFeedItem = (updateFeedItem: FeedItemUI) => {
    return queryClient.setQueryData<FeedData>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          feed: page.feed.map((item) =>
            item.id === updateFeedItem.id
              ? { ...item, ...updateFeedItem }
              : item
          ),
        })),
      };
    });
  };
  return { updateFeedItem };
}
