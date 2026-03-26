import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveHabit } from "@/database/habits/archive-habit";
import { refreshHabitFeed } from "@/database/habits/refresh-habit-feed";
import { getTrackingDate } from "@/lib/formatDate";

export function useArchiveHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: string) => {
      await archiveHabit(habitId);
      const today = getTrackingDate();
      await refreshHabitFeed(today);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
