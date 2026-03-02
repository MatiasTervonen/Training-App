"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rejectFriendRequest } from "@/database/friends/reject-friend-request";

export function useRejectFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => rejectFriendRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });
}
