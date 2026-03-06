import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveHabit } from "@/database/habits/save-habit";

export function useSaveHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}
