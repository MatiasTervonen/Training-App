import { FeedItemUI, FeedData } from "@/types/session";
import { useQueryClient } from "@tanstack/react-query";

export default function useRemindersUpdateFeedItemToTop() {
  const queryClient = useQueryClient();

  const updateFeedItemToTop = (updateFeedItem: FeedItemUI) => {
    // Update all reminders feed caches
    queryClient.setQueriesData<FeedData>(
      { queryKey: ["myReminders"] },
      (oldData) => {
        if (!oldData) return oldData;

        let updatedItem: FeedItemUI | null = null;

        const newPages = oldData.pages.map((page) => ({
          ...page,
          feed: page.feed.filter((item) => {
            if (item.id === updateFeedItem.id) {
              updatedItem = { ...item, ...updateFeedItem };
              return false;
            }
            return true;
          }),
        }));

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
      }
    );

    // Also update the main feed
    queryClient.setQueryData<FeedData>(["feed"], (oldData) => {
      if (!oldData) return oldData;

      let updatedItem: FeedItemUI | null = null;

      const newPages = oldData.pages.map((page) => ({
        ...page,
        feed: page.feed.filter((item) => {
          if (item.id === updateFeedItem.id) {
            updatedItem = { ...item, ...updateFeedItem };
            return false;
          }
          return true;
        }),
      }));

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
