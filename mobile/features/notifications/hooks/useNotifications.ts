import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "@/database/notifications/get-notifications";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    staleTime: 0,
  });
}
