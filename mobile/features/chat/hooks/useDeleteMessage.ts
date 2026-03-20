import {
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { deleteMessage } from "@/database/chat/delete-message";
import { ChatMessage } from "@/types/chat";
import { supabase } from "@/lib/supabase";

export default function useDeleteMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const result = await deleteMessage(messageId);

      // Clean up storage files if media was attached
      if (result.media_path) {
        await supabase.storage
          .from("chat-media")
          .remove([result.media_path])
          .catch(() => {});
      }
      if (result.thumbnail_path) {
        await supabase.storage
          .from("chat-media")
          .remove([result.thumbnail_path])
          .catch(() => {});
      }

      return result;
    },

    onMutate: async (messageId: string) => {
      await queryClient.cancelQueries({
        queryKey: ["messages", conversationId],
      });

      const previousMessages =
        queryClient.getQueryData<InfiniteData<ChatMessage[]>>([
          "messages",
          conversationId,
        ]);

      // Optimistic: mark message as deleted in cache
      queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
        ["messages", conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((msg) =>
                msg.id === messageId
                  ? {
                      ...msg,
                      content: null,
                      media_storage_path: null,
                      media_thumbnail_path: null,
                      media_duration_ms: null,
                      link_preview: null,
                      deleted_at: new Date().toISOString(),
                    }
                  : msg,
              ),
            ),
          };
        },
      );

      return { previousMessages };
    },

    onError: (_err, _messageId, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ["messages", conversationId],
          context.previousMessages,
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
