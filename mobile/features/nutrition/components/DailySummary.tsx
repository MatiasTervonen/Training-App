import { useMemo } from "react";
import { View } from "react-native";
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
      { key: "saturated_fat", label: t("daily.saturatedFat"), current: props.saturatedFat, goal: props.saturatedFatGoal, color: "bg-fuchsia-500", unit: "g" },
    ];

    return optionalBars.filter((bar) => props.visibleNutrients.includes(bar.key));
  }, [t, props.fiber, props.fiberGoal, props.sugar, props.sugarGoal, props.sodium, props.sodiumGoal, props.saturatedFat, props.saturatedFatGoal, props.visibleNutrients]);

  return (
    <View className="items-center gap-4 py-4">
      <CalorieRing
        consumed={Math.round(props.calories)}
        goal={props.calorieGoal}
      />
      <View className="flex-row justify-evenly w-full mt-2">
        <MacroRing
          value={props.protein}
          goal={props.proteinGoal}
          label={t("daily.protein")}
          color="#3b82f6"
        />
        <MacroRing
          value={props.carbs}
          goal={props.carbsGoal}
          label={t("daily.carbs")}
          color="#f59e0b"
        />
        <MacroRing
          value={props.fat}
          goal={props.fatGoal}
          label={t("daily.fat")}
          color="#f43f5e"
        />
      </View>
      <View className="w-full gap-3">
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
      </View>
    </View>
  );
}
