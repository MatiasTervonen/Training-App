"use client";

import { useMemo } from "react";
import CalorieRing from "@/features/nutrition/components/CalorieRing";
import MacroRing from "@/features/nutrition/components/MacroRing";
import MacroProgressBar from "@/features/nutrition/components/MacroProgressBar";
import { useTranslation } from "react-i18next";

type DailySummaryProps = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calorieGoal: number;
  proteinGoal: number | null;
  carbsGoal: number | null;
  fatGoal: number | null;
  fiber: number;
  sugar: number;
  sodium: number;
  saturatedFat: number;
  fiberGoal: number | null;
  sugarGoal: number | null;
  sodiumGoal: number | null;
  saturatedFatGoal: number | null;
  visibleNutrients: string[];
};

export default function DailySummary(props: DailySummaryProps) {
  const { t } = useTranslation("nutrition");

  const visibleBars = useMemo(() => {
    const optionalBars: {
      key: string;
      label: string;
      current: number;
      goal: number | null;
      color: string;
      unit: string;
    }[] = [
      { key: "fiber", label: t("daily.fiber"), current: props.fiber, goal: props.fiberGoal, color: "bg-green-500", unit: "g" },
      { key: "sugar", label: t("daily.sugar"), current: props.sugar, goal: props.sugarGoal, color: "bg-purple-500", unit: "g" },
      { key: "sodium", label: t("daily.sodium"), current: props.sodium, goal: props.sodiumGoal, color: "bg-cyan-500", unit: "mg" },
      { key: "saturated_fat", label: t("daily.saturatedFat"), current: props.saturatedFat, goal: props.saturatedFatGoal, color: "bg-fuchsia-400", unit: "g" },
    ];

    return optionalBars.filter((bar) => props.visibleNutrients.includes(bar.key));
  }, [t, props.fiber, props.fiberGoal, props.sugar, props.sugarGoal, props.sodium, props.sodiumGoal, props.saturatedFat, props.saturatedFatGoal, props.visibleNutrients]);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <CalorieRing
        consumed={Math.round(props.calories)}
        goal={props.calorieGoal}
      />

      {/* Macro rings row */}
      <div className="flex justify-evenly w-full mt-2">
        <MacroRing
          label={t("daily.protein")}
          current={props.protein}
          goal={props.proteinGoal}
          color="#38bdf8"
          totalMacros={props.protein + props.carbs + props.fat}
        />
        <MacroRing
          label={t("daily.carbs")}
          current={props.carbs}
          goal={props.carbsGoal}
          color="#f59e0b"
          totalMacros={props.protein + props.carbs + props.fat}
        />
        <MacroRing
          label={t("daily.fat")}
          current={props.fat}
          goal={props.fatGoal}
          color="#f43f5e"
          totalMacros={props.protein + props.carbs + props.fat}
        />
      </div>

      {/* Optional nutrient bars */}
      {visibleBars.length > 0 && (
        <div className="w-full flex flex-col gap-3 mt-2">
          {visibleBars.map((bar) => (
            <MacroProgressBar
              key={bar.key}
              label={bar.label}
              current={bar.current}
              goal={bar.goal}
              color={bar.color}
              unit={bar.unit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
