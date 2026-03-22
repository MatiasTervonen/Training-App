import { useMutation, useQueryClient } from "@tanstack/react-query";
import { editHabit } from "@/database/habits/edit-habit";
import { refreshHabitFeed } from "@/database/habits/refresh-habit-feed";

export function useEditHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: Parameters<typeof editHabit>[0]) => {
      await editHabit(args);
      const today = new Date().toLocaleDateString("en-CA");
      await refreshHabitFeed(today);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
