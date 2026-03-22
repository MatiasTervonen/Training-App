"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMessage } from "@/database/chat/delete-message";
import { ChatMessage } from "@/types/chat";

export function useDeleteMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });
      const previous = queryClient.getQueryData(["messages", conversationId]);

      queryClient.setQueryData(["messages", conversationId], (old: unknown) => {
        if (!old) return old;
        const data = old as { pages: ChatMessage[][]; pageParams: unknown[] };
        return {
          ...data,
          pages: data.pages.map((page) =>
            page.map((msg) =>
              msg.id === messageId
                ? { ...msg, content: null, deleted_at: new Date().toISOString(), media_storage_path: null, media_thumbnail_path: null }
                : msg
            )
          ),
        };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["messages", conversationId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
