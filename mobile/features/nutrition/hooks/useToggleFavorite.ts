import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toggleFavorite } from "@/database/nutrition/toggle-favorite";

type ToggleFavoriteParams = {
  foodId: string | null;
  customFoodId: string | null;
};

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = useCallback(
    async (params: ToggleFavoriteParams) => {
      setIsToggling(true);

      try {
        await toggleFavorite(params);
        await queryClient.invalidateQueries({
          queryKey: ["nutritionFavorites"],
        });
      } finally {
        setIsToggling(false);
      }
    },
    [queryClient],
  );

  return { handleToggle, isToggling };
}
