"use client";

import { useQuery } from "@tanstack/react-query";
import { getConversations } from "@/database/chat/get-conversations";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
    staleTime: 0,
  });
}
