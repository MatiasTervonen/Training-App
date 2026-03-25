"use client";

import Spinner from "@/components/spinner";
import { useTranslation } from "react-i18next";
import { useFavorites } from "@/features/nutrition/hooks/useFavorites";
import type { NutritionSearchResult, FavoriteFood } from "@/types/nutrition";

type FavoriteFoodsListProps = {
  onSelect: (food: NutritionSearchResult) => void;
};

function favoriteToSearchResult(fav: FavoriteFood): NutritionSearchResult {
  return {
    id: fav.food_id ?? fav.custom_food_id,
    name: fav.name,
    brand: fav.brand,
    calories_per_100g: fav.calories_per_100g,
    protein_per_100g: fav.protein_per_100g,
    carbs_per_100g: fav.carbs_per_100g,
    fat_per_100g: fav.fat_per_100g,
    saturated_fat_per_100g: null,
    sugar_per_100g: null,
    fiber_per_100g: null,
    sodium_per_100g: null,
    serving_size_g: fav.serving_size_g,
    serving_description: fav.serving_description,
    image_url: fav.image_url,
    image_nutrition_url: null,
    barcode: fav.barcode,
    is_custom: fav.is_custom,
    source: fav.is_custom ? "custom" : "local",
  };
}

export default function FavoriteFoodsList({ onSelect }: FavoriteFoodsListProps) {
  const { t } = useTranslation("nutrition");
  const { data: favorites, isLoading } = useFavorites();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-10 gap-2">
        <Spinner />
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 px-6">
        <p className="text-base mb-2">{t("log.noFavorites")}</p>
        <p className="font-body text-sm text-center text-slate-400">
          {t("log.noFavoritesDesc")}
        </p>
      </div>
    );
  }

  return (
    <div>
      {favorites.map((fav, index) => {
        const item = favoriteToSearchResult(fav);
        return (
          <button
            key={fav.id ?? `${index}`}
            onClick={() => onSelect(item)}
            className="w-full text-left px-4 py-3 border-b border-slate-700/50 hover:bg-slate-800/50 cursor-pointer transition-colors"
          >
            <div className="flex justify-between items-center">
              <div className="flex-1 mr-3 overflow-hidden">
                <p className="text-sm truncate">{fav.name}</p>
                {fav.brand && (
                  <p className="font-body text-xs text-slate-400 truncate">{fav.brand}</p>
                )}
              </div>
              <span className="font-body text-sm text-slate-400 shrink-0">
                {Math.round(fav.calories_per_100g)} kcal
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
