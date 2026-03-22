"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { forwardMessage } from "@/database/chat/forward-message";
import { ChatMessage } from "@/types/chat";

type ForwardInput = {
  message: ChatMessage;
  friendId: string;
};

export function useForwardMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ message, friendId }: ForwardInput) =>
      forwardMessage(message, friendId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
