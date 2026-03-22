"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleReaction } from "@/database/chat/toggle-reaction";
import { ChatMessage, ReactionSummary } from "@/types/chat";

export function useToggleReaction(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      toggleReaction(messageId, emoji),
    onMutate: async ({ messageId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });
      const previous = queryClient.getQueryData(["messages", conversationId]);

      queryClient.setQueryData(["messages", conversationId], (old: unknown) => {
        if (!old) return old;
        const data = old as { pages: ChatMessage[][]; pageParams: unknown[] };
        return {
          ...data,
          pages: data.pages.map((page) =>
            page.map((msg) => {
              if (msg.id !== messageId) return msg;
              const existing = msg.reactions.find((r: ReactionSummary) => r.emoji === emoji);
              let reactions: ReactionSummary[];
              if (existing?.user_reacted) {
                reactions = existing.count === 1
                  ? msg.reactions.filter((r: ReactionSummary) => r.emoji !== emoji)
                  : msg.reactions.map((r: ReactionSummary) =>
                      r.emoji === emoji ? { ...r, count: r.count - 1, user_reacted: false } : r
                    );
              } else if (existing) {
                reactions = msg.reactions.map((r: ReactionSummary) =>
                  r.emoji === emoji ? { ...r, count: r.count + 1, user_reacted: true } : r
                );
              } else {
                reactions = [...msg.reactions, { emoji, count: 1, user_reacted: true }];
              }
              return { ...msg, reactions };
            })
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
    },
  });
}
