"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { editMessage } from "@/database/chat/edit-message";
import { ChatMessage } from "@/types/chat";

type EditMessageVars = {
  messageId: string;
  content: string;
};

export function useEditMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, content }: EditMessageVars) =>
      editMessage(messageId, content),

    onMutate: async ({ messageId, content }: EditMessageVars) => {
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
                ? { ...msg, content, edited_at: new Date().toISOString() }
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
