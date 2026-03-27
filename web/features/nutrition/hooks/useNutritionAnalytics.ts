import { useQuery } from "@tanstack/react-query";
import { getNutritionAnalytics } from "@/database/nutrition/get-analytics";

export function useNutritionAnalytics(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["nutrition-analytics", startDate, endDate],
    queryFn: () => getNutritionAnalytics(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 60_000,
  });
}
