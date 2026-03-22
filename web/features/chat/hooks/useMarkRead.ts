"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markConversationRead } from "@/database/chat/mark-conversation-read";

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => markConversationRead(conversationId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["total-unread-count"] });
    },
  });
}
