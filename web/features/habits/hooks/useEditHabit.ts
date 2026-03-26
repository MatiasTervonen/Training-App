import { useMutation, useQueryClient } from "@tanstack/react-query";
import { editHabit } from "@/database/habits/edit-habit";
import { refreshHabitFeed } from "@/database/habits/refresh-habit-feed";
import { getTrackingDate } from "@/lib/formatDate";

export function useEditHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: Parameters<typeof editHabit>[0]) => {
      await editHabit(args);
      const today = getTrackingDate();
      await refreshHabitFeed(today);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
