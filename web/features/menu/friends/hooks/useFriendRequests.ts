"use client";

import { useQuery } from "@tanstack/react-query";
import { getFriendRequest } from "@/database/friends/get-friend-request";

export function useFriendRequests() {
  return useQuery({
    queryKey: ["friend-requests"],
    queryFn: getFriendRequest,
    staleTime: 0,
    refetchInterval: 15_000,
  });
}
