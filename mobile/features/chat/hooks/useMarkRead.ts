import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markConversationRead } from "@/database/chat/mark-conversation-read";

export default function useMarkRead(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markConversationRead(conversationId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["total-unread-count"] });
    },
  });
}
