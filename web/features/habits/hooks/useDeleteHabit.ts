import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteHabit } from "@/database/habits/delete-habit";
import { refreshHabitFeed } from "@/database/habits/refresh-habit-feed";

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: string) => {
      await deleteHabit(habitId);
      const today = new Date().toLocaleDateString("en-CA");
      await refreshHabitFeed(today);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
