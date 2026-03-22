import { useQuery } from "@tanstack/react-query";
import { getHabitLogs } from "@/database/habits/get-habit-logs";

export function useHabitLogs({
  startDate,
  endDate,
  habitId,
}: {
  startDate: string;
  endDate: string;
  habitId?: string;
}) {
  return useQuery({
    queryKey: ["habit-logs", startDate, endDate, habitId],
    queryFn: () => getHabitLogs({ startDate, endDate, habitId }),
  });
}
