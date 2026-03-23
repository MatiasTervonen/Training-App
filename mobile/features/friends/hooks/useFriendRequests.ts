import { useQuery } from "@tanstack/react-query";
import { getFriendRequests } from "@/database/friend/get-friend-requests";

export function useFriendRequests() {
  return useQuery({
    queryKey: ["friend-requests"],
    queryFn: getFriendRequests,
    staleTime: 0,
    refetchInterval: 15_000,
  });
}
