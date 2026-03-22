"use client";

import { useQuery } from "@tanstack/react-query";
import { getOtherLastRead } from "@/database/chat/get-other-last-read";

export function useOtherLastRead(conversationId: string) {
  return useQuery({
    queryKey: ["other-last-read", conversationId],
    queryFn: () => getOtherLastRead(conversationId),
    enabled: !!conversationId,
  });
}
