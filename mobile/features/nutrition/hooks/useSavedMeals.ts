import { useQuery } from "@tanstack/react-query";
import { getSavedMeals } from "@/database/nutrition/get-saved-meals";

export function useSavedMeals() {
  return useQuery({
    queryKey: ["savedMeals"],
    queryFn: getSavedMeals,
    staleTime: 60_000,
  });
}
