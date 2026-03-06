import { useQuery } from "@tanstack/react-query";
import { getHabitStats } from "@/database/habits/get-habit-stats";

export function useHabitStats(habitId: string) {
  return useQuery({
    queryKey: ["habit-stats", habitId],
    queryFn: () => getHabitStats(habitId),
    enabled: !!habitId,
  });
}
