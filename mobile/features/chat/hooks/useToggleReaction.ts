import {
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { toggleReaction } from "@/database/chat/toggle-reaction";
import { ChatMessage } from "@/types/chat";

type ToggleReactionInput = {
  messageId: string;
  emoji: string;
};

export default function useToggleReaction(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, emoji }: ToggleReactionInput) =>
      toggleReaction(messageId, emoji),

    onMutate: async ({ messageId, emoji }: ToggleReactionInput) => {
      await queryClient.cancelQueries({
        queryKey: ["messages", conversationId],
      });

      const previousMessages =
        queryClient.getQueryData<InfiniteData<ChatMessage[]>>([
          "messages",
          conversationId,
        ]);

      queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
        ["messages", conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((msg) => {
                if (msg.id !== messageId) return msg;

                const reactions = [...(msg.reactions ?? [])];
                const existingIdx = reactions.findIndex(
                  (r) => r.emoji === emoji,
                );

                if (existingIdx !== -1) {
                  const existing = reactions[existingIdx];
                  if (existing.user_reacted) {
                    // Remove own reaction
                    if (existing.count <= 1) {
                      reactions.splice(existingIdx, 1);
                    } else {
                      reactions[existingIdx] = {
                        ...existing,
                        count: existing.count - 1,
                        user_reacted: false,
                      };
                    }
                  } else {
                    // Add own reaction to existing emoji
                    reactions[existingIdx] = {
                      ...existing,
                      count: existing.count + 1,
                      user_reacted: true,
                    };
                  }
                } else {
                  // New emoji reaction
                  reactions.push({
                    emoji,
                    count: 1,
                    user_reacted: true,
                  });
                }

                return { ...msg, reactions };
              }),
            ),
          };
        },
      );

      return { previousMessages };
    },

    onError: (_err, _input, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ["messages", conversationId],
          context.previousMessages,
        );
      }
    },

    onSettled: (_data, error) => {
      // Only refetch if the mutation failed — on success, the optimistic
      // update is already correct and a refetch would cause a flash
      if (error) {
        queryClient.invalidateQueries({
          queryKey: ["messages", conversationId],
        });
      }
    },
  });
}
