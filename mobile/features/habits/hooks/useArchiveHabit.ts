import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveHabit } from "@/database/habits/archive-habit";

export function useArchiveHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}
