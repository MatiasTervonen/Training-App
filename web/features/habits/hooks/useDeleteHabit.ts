import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteHabit } from "@/database/habits/delete-habit";
import { refreshHabitFeed } from "@/database/habits/refresh-habit-feed";
import { getTrackingDate } from "@/lib/formatDate";

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: string) => {
      await deleteHabit(habitId);
      const today = getTrackingDate();
      await refreshHabitFeed(today);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
