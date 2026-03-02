"use client";

import { useQuery } from "@tanstack/react-query";
import { getFirends } from "@/database/friends/get-friends";

export function useFriends() {
  return useQuery({
    queryKey: ["friends"],
    queryFn: getFirends,
  });
}
