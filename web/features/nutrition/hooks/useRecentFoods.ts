import { useQuery } from "@tanstack/react-query";
import { getRecentFoods } from "@/database/nutrition/get-recent-foods";

export function useRecentFoods() {
  return useQuery({
    queryKey: ["recentFoods"],
    queryFn: getRecentFoods,
  });
}
