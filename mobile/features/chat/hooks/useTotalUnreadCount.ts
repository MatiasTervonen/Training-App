import { useQuery } from "@tanstack/react-query";
import { getTotalUnreadCount } from "@/database/chat/get-total-unread-count";

export default function useTotalUnreadCount() {
  return useQuery<number>({
    queryKey: ["total-unread-count"],
    queryFn: getTotalUnreadCount,
    refetchInterval: 60000,
  });
}
