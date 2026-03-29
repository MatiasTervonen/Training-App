"use client";

import { Bookmark, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import TimePicker from "@/components/TimePicker";
import FoodLogItem from "@/features/nutrition/components/FoodLogItem";
import type { DailyFoodLog } from "@/types/nutrition";

type MealSectionProps = {
  title: string;
  items: DailyFoodLog[];
  onPress?: (item: DailyFoodLog) => void;
  onDelete: (id: string) => void;
  onUpdateMealTime?: (mealTime: string) => void;
  onSaveAsMeal?: () => void;
};

function getMealTime(items: DailyFoodLog[]): string | null {
  const first = items.find((item) => item.meal_time != null);
  return first?.meal_time ?? null;
}

function formatMealTime(time: string): string {
  return time.slice(0, 5);
}

export default function MealSection({
  title,
  items,
  onPress,
  onDelete,
  onUpdateMealTime,
  onSaveAsMeal,
}: MealSectionProps) {
  const { t } = useTranslation("nutrition");

  if (items.length === 0) return null;

  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = items.reduce((sum, item) => sum + (item.protein ?? 0), 0);
  const totalCarbs = items.reduce((sum, item) => sum + (item.carbs ?? 0), 0);
  const totalFat = items.reduce((sum, item) => sum + (item.fat ?? 0), 0);
  const mealTime = getMealTime(items);

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-base">{title}</span>
          {onUpdateMealTime ? (
            <div className="flex items-center gap-1">
              {!mealTime && <Clock size={14} className="text-slate-500" />}
              <TimePicker
                value={mealTime ? formatMealTime(mealTime) : null}
                onChange={(time) => onUpdateMealTime(time)}
                className="w-16 p-0.5 text-center rounded border border-transparent font-body text-sm text-slate-500 bg-transparent cursor-pointer hover:text-slate-300 hover:border-slate-600 focus:outline-none focus:border-green-300"
              />
            </div>
          ) : mealTime ? (
            <span className="font-body text-sm text-slate-500">
              {formatMealTime(mealTime)}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {onSaveAsMeal && (
            <button
              onClick={onSaveAsMeal}
              className="p-1 rounded hover:bg-slate-700/50 transition-colors cursor-pointer"
              title={t("savedMeals.saveAsMeal")}
            >
              <Bookmark size={14} className="text-slate-500 hover:text-slate-300" />
            </button>
          )}
          <span className="font-body text-sm text-slate-400">
            {Math.round(totalCalories)} kcal
          </span>
        </div>
      </div>
      <div className="flex gap-3">
        <span className="font-body text-xs text-slate-500">
          {t("daily.protein")} {Math.round(totalProtein)}g
        </span>
        <span className="font-body text-xs text-slate-500">
          {t("daily.carbs")} {Math.round(totalCarbs)}g
        </span>
        <span className="font-body text-xs text-slate-500">
          {t("daily.fat")} {Math.round(totalFat)}g
        </span>
      </div>
      <div className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50">
        {items.map((item, index) => (
          <FoodLogItem
            key={item.id}
            item={item}
            onPress={() => onPress?.(item)}
            onDelete={() => onDelete(item.id)}
            showBorder={index < items.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
