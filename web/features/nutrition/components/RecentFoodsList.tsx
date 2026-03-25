"use client";

import Spinner from "@/components/spinner";
import { useTranslation } from "react-i18next";
import { useRecentFoods } from "@/features/nutrition/hooks/useRecentFoods";
import type { NutritionSearchResult, RecentFood } from "@/types/nutrition";

type RecentFoodsListProps = {
  onSelect: (food: NutritionSearchResult) => void;
};

function recentToSearchResult(recent: RecentFood): NutritionSearchResult {
  return {
    id: recent.food_id ?? recent.custom_food_id,
    name: recent.name,
    brand: recent.brand,
    calories_per_100g: recent.calories_per_100g,
    protein_per_100g: recent.protein_per_100g,
    carbs_per_100g: recent.carbs_per_100g,
    fat_per_100g: recent.fat_per_100g,
    saturated_fat_per_100g: null,
    sugar_per_100g: null,
    fiber_per_100g: null,
    sodium_per_100g: null,
    serving_size_g: recent.serving_size_g,
    serving_description: recent.serving_description,
    image_url: recent.image_url,
    image_nutrition_url: null,
    barcode: recent.barcode,
    is_custom: recent.is_custom,
    source: recent.is_custom ? "custom" : "local",
  };
}

export default function RecentFoodsList({ onSelect }: RecentFoodsListProps) {
  const { t } = useTranslation("nutrition");
  const { data: recentFoods, isLoading } = useRecentFoods();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-10 gap-2">
        <Spinner />
      </div>
    );
  }

  if (!recentFoods || recentFoods.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 px-6">
        <p className="text-base mb-2">{t("log.noRecent")}</p>
        <p className="font-body text-sm text-center text-slate-400">
          {t("log.noRecentDesc")}
        </p>
      </div>
    );
  }

  return (
    <div>
      {recentFoods.map((recent, index) => {
        const item = recentToSearchResult(recent);
        return (
          <button
            key={recent.food_id ?? recent.custom_food_id ?? `${index}`}
            onClick={() => onSelect(item)}
            className="w-full text-left px-4 py-3 border-b border-slate-700/50 hover:bg-slate-800/50 cursor-pointer transition-colors"
          >
            <div className="flex justify-between items-center">
              <div className="flex-1 mr-3 overflow-hidden">
                <p className="text-sm truncate">{recent.name}</p>
                {recent.brand && (
                  <p className="font-body text-xs text-slate-400 truncate">{recent.brand}</p>
                )}
              </div>
              <span className="font-body text-sm text-slate-400 shrink-0">
                {Math.round(recent.calories_per_100g)} kcal
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
