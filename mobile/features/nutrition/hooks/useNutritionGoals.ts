import { useQuery } from "@tanstack/react-query";
import { getNutritionGoals } from "@/database/nutrition/get-nutrition-goals";

export function useNutritionGoals() {
  return useQuery({
    queryKey: ["nutritionGoals"],
    queryFn: getNutritionGoals,
  });
}
