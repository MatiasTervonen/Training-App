import { useQuery } from "@tanstack/react-query";
import { getFriends } from "@/database/friend/get-friends";

export function useFriends() {
  return useQuery({
    queryKey: ["friends"],
    queryFn: getFriends,
  });
}
