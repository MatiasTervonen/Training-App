import { useQuery } from "@tanstack/react-query";
import { getUnreadCount } from "@/database/notifications/get-unread-count";

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadCount,
    staleTime: 1000 * 30,
  });
}
