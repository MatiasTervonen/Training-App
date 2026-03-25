"use client";

import FoodLogItem from "@/features/nutrition/components/FoodLogItem";
import type { DailyFoodLog } from "@/types/nutrition";

type MealSectionProps = {
  title: string;
  items: DailyFoodLog[];
  onPress?: (item: DailyFoodLog) => void;
  onDelete: (id: string) => void;
};

export default function MealSection({
  title,
  items,
  onPress,
  onDelete,
}: MealSectionProps) {
  if (items.length === 0) return null;

  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex justify-between items-center">
        <span className="text-base">{title}</span>
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
