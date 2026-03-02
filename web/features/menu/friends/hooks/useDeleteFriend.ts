"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFriend } from "@/database/friends/delete-friend";

export function useDeleteFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendId: string) => deleteFriend(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}
