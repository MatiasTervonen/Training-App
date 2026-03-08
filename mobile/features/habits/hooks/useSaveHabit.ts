import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveHabit } from "@/database/habits/save-habit";
import { refreshHabitFeed } from "@/database/habits/refresh-habit-feed";

export function useSaveHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: Parameters<typeof saveHabit>[0]) => {
      const result = await saveHabit(args);
      const today = new Date().toLocaleDateString("en-CA");
      await refreshHabitFeed(today);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
