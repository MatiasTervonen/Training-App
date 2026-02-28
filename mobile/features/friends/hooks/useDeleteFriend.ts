import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFriend } from "@/database/friend/delete-friend";

export function useDeleteFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendId: string) => deleteFriend(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}
