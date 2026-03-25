"use client";

import { Pencil, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import Spinner from "@/components/spinner";
import { useSavedMeals } from "@/features/nutrition/hooks/useSavedMeals";
import type { SavedMeal } from "@/types/nutrition";

type SavedMealsListProps = {
  onCreate: () => void;
  onEdit: (meal: SavedMeal) => void;
  onLog: (meal: SavedMeal) => void;
};

function getMealCalories(meal: SavedMeal): number {
  return meal.items.reduce((sum, item) => {
    const factor = (item.serving_size_g * item.quantity) / 100;
    return sum + item.calories_per_100g * factor;
  }, 0);
}

export default function SavedMealsList({
  onCreate,
  onEdit,
  onLog,
}: SavedMealsListProps) {
  const { t } = useTranslation("nutrition");
  const { data: meals, isLoading } = useSavedMeals();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-10 gap-2">
        <Spinner />
      </div>
    );
  }

  if (!meals || meals.length === 0) {
    return (
      <div className="flex flex-col items-center py-10">
        <p className="text-base mb-2">{t("savedMeals.noMeals")}</p>
        <p className="font-body text-sm text-center mb-6 text-slate-400">
          {t("savedMeals.noMealsDesc")}
        </p>
        <button
          onClick={onCreate}
          className="btn-add py-3 px-6 flex items-center gap-2 cursor-pointer"
        >
          <Plus size={18} className="text-blue-400" />
          <span className="text-sm">{t("savedMeals.create")}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <button
        onClick={onCreate}
        className="btn-add py-3 mb-4 flex items-center justify-center gap-2 cursor-pointer"
      >
        <Plus size={18} className="text-blue-400" />
        <span className="text-sm">{t("savedMeals.create")}</span>
      </button>

      {meals.map((meal) => {
        const totalCalories = Math.round(getMealCalories(meal));
        const itemCount = meal.items.length;

        return (
          <div
            key={meal.id}
            className="flex items-center py-3 border-b border-slate-700/50"
          >
            <button
              onClick={() => onEdit(meal)}
              className="flex-1 mr-3 text-left cursor-pointer min-w-0"
            >
              <span className="text-sm truncate block">{meal.name}</span>
              <span className="font-body text-xs text-slate-400">
                {itemCount}{" "}
                {itemCount === 1
                  ? t("savedMeals.item")
                  : t("savedMeals.items")}{" "}
                · {totalCalories} kcal
              </span>
            </button>
            <div className="flex items-center gap-4 shrink-0">
              <button
                onClick={() => onEdit(meal)}
                className="p-1 cursor-pointer hover:bg-slate-700/50 rounded transition-colors"
              >
                <Pencil size={16} className="text-slate-400" />
              </button>
              <button
                onClick={() => onLog(meal)}
                className="btn-start px-3 py-1.5 text-xs cursor-pointer"
              >
                {t("savedMeals.logMeal")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
