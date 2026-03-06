import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteHabit } from "@/database/habits/delete-habit";

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}
