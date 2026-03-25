import { useQuery } from "@tanstack/react-query";
import { getFavorites } from "@/database/nutrition/get-favorites";

export function useFavorites() {
  return useQuery({
    queryKey: ["nutritionFavorites"],
    queryFn: getFavorites,
  });
}
