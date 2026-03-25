import { useQuery } from "@tanstack/react-query";
import { getDailyLogs } from "@/database/nutrition/get-daily-logs";

export function useDailyLogs(date: string) {
  return useQuery({
    queryKey: ["dailyLogs", date],
    queryFn: () => getDailyLogs(date),
    enabled: !!date,
    staleTime: 30_000,
  });
}
