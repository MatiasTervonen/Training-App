import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleFavorite } from "@/database/nutrition/toggle-favorite";

type ToggleFavoriteParams = {
  foodId: string | null;
  customFoodId: string | null;
};

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (params: ToggleFavoriteParams) => toggleFavorite(params),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["nutritionFavorites"],
      });
    },
  });

  return { handleToggle: mutation.mutate, isToggling: mutation.isPending };
}
