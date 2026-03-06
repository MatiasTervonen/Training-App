import { useMutation, useQueryClient } from "@tanstack/react-query";
import { editHabit } from "@/database/habits/edit-habit";

export function useEditHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: editHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}
