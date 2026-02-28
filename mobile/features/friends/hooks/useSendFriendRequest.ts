import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendFriendRequest } from "@/database/friend/send-request";

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });
}
