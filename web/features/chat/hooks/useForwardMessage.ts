"use client";

import { useMutation } from "@tanstack/react-query";
import { forwardMessage } from "@/database/chat/forward-message";

export function useForwardMessage() {
  return useMutation({
    mutationFn: ({ friendId, content }: { friendId: string; content: string }) =>
      forwardMessage(friendId, content),
  });
}
