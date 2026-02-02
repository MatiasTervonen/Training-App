import { FeedItemUI, FeedData } from "@/app/(app)/types/session";
import { useQueryClient } from "@tanstack/react-query";

export default function useUpdateFeedItemToTop() {
  const queryClient = useQueryClient();

  const updateFeedItemToTop = (updateFeedItem: FeedItemUI) => {
    return queryClient.setQueryData<FeedData>(["feed"], (oldData) => {
      if (!oldData) return oldData;

      let updatedItem: FeedItemUI | null = null;

      // Remove the item from its current position and update it
      const newPages = oldData.pages.map((page) => ({
        ...page,
        feed: page.feed.filter((item) => {
          if (item.id === updateFeedItem.id) {
            updatedItem = { ...item, ...updateFeedItem };
            return false; // Remove from current position
          }
          return true;
        }),
      }));

      // Add the updated item to the first position of the first page
      if (updatedItem && newPages.length > 0) {
        newPages[0] = {
          ...newPages[0],
          feed: [updatedItem, ...newPages[0].feed],
        };
      }

      return {
        ...oldData,
        pages: newPages,
      };
    });
  };

  return { updateFeedItemToTop };
}
