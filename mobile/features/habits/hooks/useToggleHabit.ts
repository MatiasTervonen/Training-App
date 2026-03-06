import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleHabitLog } from "@/database/habits/toggle-habit-log";

export function useToggleHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleHabitLog,
    onSuccess: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["habit-logs"] }),
        queryClient.invalidateQueries({ queryKey: ["habit-stats"] }),
      ]);
    },
  });
}
