"use client";

import { useRef } from "react";
import { Clock } from "lucide-react";
import FoodLogItem from "@/features/nutrition/components/FoodLogItem";
import type { DailyFoodLog } from "@/types/nutrition";

type MealSectionProps = {
  title: string;
  items: DailyFoodLog[];
  onPress?: (item: DailyFoodLog) => void;
  onDelete: (id: string) => void;
  onUpdateMealTime?: (mealTime: string) => void;
};

function getMealTime(items: DailyFoodLog[]): string | null {
  const first = items.find((item) => item.meal_time != null);
  return first?.meal_time ?? null;
}

function formatMealTime(time: string): string {
  // meal_time comes as "HH:MM:SS" from Postgres TIME — show only HH:MM
  return time.slice(0, 5);
}

export default function MealSection({
  title,
  items,
  onPress,
  onDelete,
  onUpdateMealTime,
}: MealSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (items.length === 0) return null;

  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);
  const mealTime = getMealTime(items);

  const handleTimeClick = () => {
    inputRef.current?.showPicker();
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value && onUpdateMealTime) {
      onUpdateMealTime(e.target.value);
    }
  };

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-base">{title}</span>
          {mealTime ? (
            <button
              onClick={handleTimeClick}
              className="font-body text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              {formatMealTime(mealTime)}
            </button>
          ) : onUpdateMealTime ? (
            <button
              onClick={handleTimeClick}
              className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <Clock size={14} />
            </button>
          ) : null}
          {onUpdateMealTime && (
            <input
              ref={inputRef}
              type="time"
              value={mealTime ? formatMealTime(mealTime) : ""}
              onChange={handleTimeChange}
              className="sr-only"
              tabIndex={-1}
            />
          )}
        </div>
        <span className="font-body text-sm text-slate-400">
          {Math.round(totalCalories)} kcal
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
