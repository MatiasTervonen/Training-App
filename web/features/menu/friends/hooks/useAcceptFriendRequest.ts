"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acceptFriendRequest } from "@/database/friends/accept-friend-request";

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (senderId: string) => acceptFriendRequest(senderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });
}
