import { View } from "react-native";
import CalorieRing from "@/features/nutrition/components/CalorieRing";
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
};

export default function DailySummary(props: DailySummaryProps) {
  const { t } = useTranslation("nutrition");

  return (
    <View className="items-center gap-4 py-4">
      <CalorieRing
        consumed={Math.round(props.calories)}
        goal={props.calorieGoal}
      />
      <View className="w-full gap-3 mt-2">
        <MacroProgressBar
          label={t("daily.protein")}
          current={props.protein}
          goal={props.proteinGoal}
          color="bg-blue-500"
        />
        <MacroProgressBar
          label={t("daily.carbs")}
          current={props.carbs}
          goal={props.carbsGoal}
          color="bg-amber-500"
        />
        <MacroProgressBar
          label={t("daily.fat")}
          current={props.fat}
          goal={props.fatGoal}
          color="bg-rose-500"
        />
      </View>
    </View>
  );
}
