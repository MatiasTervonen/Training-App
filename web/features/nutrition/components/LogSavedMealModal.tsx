"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Modal from "@/components/modal";
import NutritionInfo from "@/features/nutrition/components/NutritionInfo";
import MealTypePicker from "@/features/nutrition/components/MealTypePicker";
import type { SavedMeal } from "@/types/nutrition";

type LogSavedMealModalProps = {
  meal: SavedMeal | null;
  isOpen: boolean;
  onClose: () => void;
  onLog: (params: { mealId: string; mealType: string }) => void;
  customMealTypes: string[];
  isLogging?: boolean;
};

export default function LogSavedMealModal({
  meal,
  isOpen,
  onClose,
  onLog,
  customMealTypes,
  isLogging = false,
}: LogSavedMealModalProps) {
  const { t } = useTranslation("nutrition");
  const [mealType, setMealType] = useState("snack");

  const totals = useMemo(() => {
    if (!meal) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return meal.items.reduce(
      (acc, item) => {
        const factor = (item.serving_size_g * item.quantity) / 100;
        return {
          calories: acc.calories + item.calories_per_100g * factor,
          protein: acc.protein + item.protein_per_100g * factor,
          carbs: acc.carbs + item.carbs_per_100g * factor,
          fat: acc.fat + item.fat_per_100g * factor,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [meal]);

  if (!meal) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4 flex flex-col gap-4 max-w-xl mx-auto">
        <p className="text-xl text-center pt-2">{meal.name}</p>

        {/* Items list */}
        <div className="flex flex-col gap-2">
          {meal.items.map((item) => {
            const factor = (item.serving_size_g * item.quantity) / 100;
            const itemCals = Math.round(item.calories_per_100g * factor);

            return (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b border-slate-700/50"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm truncate">{item.food_name}</p>
                  <p className="font-body text-xs text-slate-400">
                    {item.serving_size_g}g x {item.quantity}
                  </p>
                </div>
                <span className="font-body text-sm text-slate-400 shrink-0">
                  {itemCals} kcal
                </span>
              </div>
            );
          })}
        </div>

        {/* Total nutrition */}
        <NutritionInfo
          calories={totals.calories}
          protein={totals.protein}
          carbs={totals.carbs}
          fat={totals.fat}
          per100g={false}
        />

        {/* Meal type picker */}
        <MealTypePicker
          selected={mealType}
          onSelect={setMealType}
          customTypes={customMealTypes}
        />

        {/* Log button */}
        <button
          onClick={() => onLog({ mealId: meal.id, mealType })}
          disabled={isLogging}
          className="btn-save w-full mt-2 cursor-pointer"
        >
          {isLogging ? t("savedMeals.logMeal") + "..." : t("savedMeals.logMeal")}
        </button>
      </div>
    </Modal>
  );
}
