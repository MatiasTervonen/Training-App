"use client";

import { useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { deleteFeedComment } from "@/database/social-feed/delete-feed-comment";
import { FeedComment, SocialFeedItem } from "@/types/social-feed";

export default function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId }: { commentId: string; feedItemId: string }) =>
      deleteFeedComment(commentId),

    onMutate: async ({ commentId, feedItemId }) => {
      await queryClient.cancelQueries({ queryKey: ["feed-comments", feedItemId] });

      const previousComments = queryClient.getQueryData<FeedComment[]>(["feed-comments", feedItemId]);

      // Count how many comments we're removing (parent + its replies)
      const removedCount = (previousComments ?? []).filter(
        (c) => c.id === commentId || c.parent_id === commentId,
      ).length;

      queryClient.setQueryData<FeedComment[]>(
        ["feed-comments", feedItemId],
        (old) => (old ?? []).filter((c) => c.id !== commentId && c.parent_id !== commentId),
      );

      // Decrement comment_count on the social feed card
      queryClient.setQueryData<InfiniteData<SocialFeedItem[]>>(
        ["social-feed"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((item) =>
                item.id === feedItemId
                  ? { ...item, comment_count: Math.max(0, item.comment_count - removedCount) }
                  : item,
              ),
            ),
          };
        },
      );

      return { previousComments };
    },

    onError: (_err, { feedItemId }, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(["feed-comments", feedItemId], context.previousComments);
      }
      queryClient.invalidateQueries({ queryKey: ["social-feed"] });
    },

    onSettled: (_data, _err, { feedItemId }) => {
      queryClient.invalidateQueries({ queryKey: ["feed-comments", feedItemId] });
      queryClient.invalidateQueries({ queryKey: ["social-feed"] });
    },
  });
}
