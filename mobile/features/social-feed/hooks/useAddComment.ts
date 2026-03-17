import { useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { addFeedComment } from "@/database/social-feed/add-feed-comment";
import { FeedComment, SocialFeedItem } from "@/types/social-feed";
import { useUserStore } from "@/lib/stores/useUserStore";
import { supabase } from "@/lib/supabase";

export default function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      feedItemId,
      content,
      parentId,
    }: {
      feedItemId: string;
      content: string;
      parentId: string | null;
    }) => addFeedComment(feedItemId, content, parentId),

    onMutate: async ({ feedItemId, content, parentId }) => {
      await queryClient.cancelQueries({ queryKey: ["feed-comments", feedItemId] });

      const previousComments = queryClient.getQueryData<FeedComment[]>(["feed-comments", feedItemId]);

      const profile = useUserStore.getState().profile;
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const optimisticComment: FeedComment = {
        id: `temp-${Date.now()}`,
        feed_item_id: feedItemId,
        user_id: session?.user?.id ?? "",
        parent_id: parentId,
        content,
        created_at: new Date().toISOString(),
        author_display_name: profile?.display_name ?? "",
        author_profile_picture: profile?.profile_picture ?? null,
        reply_to_display_name: null,
      };

      queryClient.setQueryData<FeedComment[]>(
        ["feed-comments", feedItemId],
        (old) => [...(old ?? []), optimisticComment],
      );

      // Bump comment_count on the social feed card
      queryClient.setQueryData<InfiniteData<SocialFeedItem[]>>(
        ["social-feed"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((item) =>
                item.id === feedItemId
                  ? { ...item, comment_count: item.comment_count + 1 }
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
