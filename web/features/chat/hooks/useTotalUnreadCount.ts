"use client";

import { useQuery } from "@tanstack/react-query";
import { getTotalUnreadCount } from "@/database/chat/get-total-unread-count";

export function useTotalUnreadCount() {
  return useQuery({
    queryKey: ["total-unread-count"],
    queryFn: getTotalUnreadCount,
    staleTime: 0,
    refetchInterval: 60000,
  });
}
