"use client";

import { useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { toggleLike } from "@/database/social-feed/toggle-like";
import { SocialFeedItem } from "@/types/social-feed";

export default function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleLike,
    onMutate: async (feedItemId: string) => {
      await queryClient.cancelQueries({ queryKey: ["social-feed"] });

      const previousData = queryClient.getQueryData<InfiniteData<SocialFeedItem[]>>(["social-feed"]);

      queryClient.setQueryData<InfiniteData<SocialFeedItem[]>>(
        ["social-feed"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((item) =>
                item.id === feedItemId
                  ? {
                      ...item,
                      user_has_liked: !item.user_has_liked,
                      like_count: item.user_has_liked
                        ? item.like_count - 1
                        : item.like_count + 1,
                    }
                  : item,
              ),
            ),
          };
        },
      );

      return { previousData };
    },
    onError: (_err, _feedItemId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["social-feed"], context.previousData);
      }
      queryClient.invalidateQueries({ queryKey: ["social-feed"] });
    },
  });
}
