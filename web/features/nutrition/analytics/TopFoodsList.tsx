"use client";

import { useTranslation } from "react-i18next";
import type { TopFood } from "@/database/nutrition/get-analytics";

type TopFoodsListProps = {
  foods: TopFood[];
};

export default function TopFoodsList({ foods }: TopFoodsListProps) {
  const { t } = useTranslation("nutrition");

  if (foods.length === 0) return null;

  return (
    <div className="bg-slate-900 rounded-2xl p-4">
      <h3 className="text-lg text-center mb-3 text-gray-100">
        {t("analytics.topFoods.title")}
      </h3>
      <div className="flex flex-col gap-2">
        {foods.map((food, index) => (
          <div
            key={food.food_name}
            className="flex items-center bg-slate-800 rounded-xl px-3 py-3"
          >
            <span className="text-green-400 w-7 text-center">{index + 1}</span>
            <div className="flex-1 ml-2">
              <p className="font-body text-gray-200 truncate">{food.food_name}</p>
              <p className="font-body text-xs text-gray-400 mt-0.5">
                {food.log_count} {t("analytics.topFoods.times")} · {food.total_calories}{" "}
                {t("analytics.topFoods.kcal")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
