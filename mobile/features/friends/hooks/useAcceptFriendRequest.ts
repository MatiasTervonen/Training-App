import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acceptFriendRequest } from "@/database/friend/accept";

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
