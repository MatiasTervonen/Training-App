"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getMessages } from "@/database/chat/get-messages";

const PAGE_SIZE = 50;

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) => getMessages(conversationId, PAGE_SIZE, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return lastPage[lastPage.length - 1].created_at;
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!conversationId,
  });
}
