import { useMemo, useState } from "react";
import { View } from "react-native";
import NutritionShareCard from "@/features/nutrition/components/NutritionShareCard";
import { useTranslation } from "react-i18next";
import ShareModalShell from "@/lib/components/share/ShareModalShell";
import { DailyFoodLog } from "@/database/nutrition/get-daily-logs";
import { useEnergyBalance } from "@/features/energy-balance/hooks/useEnergyBalance";
import AnimatedButton from "@/components/buttons/animatedButton";
import AppTextNC from "@/components/AppTextNC";

type MealSummary = {
  label: string;
  calories: number;
  entryCount: number;
};

type NutritionShareModalProps = {
  visible: boolean;
  onClose: () => void;
  date: string;
  calories: number;
  calorieGoal: number;
  protein: number;
  proteinGoal: number | null;
  carbs: number;
  carbsGoal: number | null;
  fat: number;
  fatGoal: number | null;
  logs: DailyFoodLog[] | null;
  getMealLabel: (type: string) => string;
};

export default function NutritionShareModal({
  visible,
  onClose,
  date,
  calories,
  calorieGoal,
  protein,
  proteinGoal,
  carbs,
  carbsGoal,
  fat,
  fatGoal,
  logs,
  getMealLabel,
}: NutritionShareModalProps) {
  const { t } = useTranslation("nutrition");
  const [showMacros, setShowMacros] = useState(true);
  const [showMeals, setShowMeals] = useState(true);
  const [showEnergyBalance, setShowEnergyBalance] = useState(false);
  const { data: energyBalanceData } = useEnergyBalance(date);

  const hasEnergyBalance = energyBalanceData?.has_profile === true;

  const energyBalance = showEnergyBalance && energyBalanceData
    ? { balance: energyBalanceData.balance, tdee: energyBalanceData.tdee }
    : null;

  const meals = useMemo<MealSummary[]>(() => {
    if (!logs || logs.length === 0) return [];

    const grouped = new Map<string, { calories: number; count: number }>();
    const defaultMeals = ["breakfast", "lunch", "dinner", "snack"];

    for (const log of logs) {
      const existing = grouped.get(log.meal_type) ?? { calories: 0, count: 0 };
      existing.calories += Number(log.calories);
      existing.count += 1;
      grouped.set(log.meal_type, existing);
    }

    const orderedKeys = [
      ...defaultMeals.filter((m) => grouped.has(m)),
      ...Array.from(grouped.keys()).filter((m) => !defaultMeals.includes(m)),
    ];

    return orderedKeys.map((key) => ({
      label: getMealLabel(key),
      calories: grouped.get(key)!.calories,
      entryCount: grouped.get(key)!.count,
    }));
  }, [logs, getMealLabel]);

  return (
    <ShareModalShell
      visible={visible}
      onClose={onClose}
      prefix="nutrition-"
      scrollable
      labels={{
        save: t("share.save"),
        saving: t("share.saving"),
        share: t("share.share"),
        sharing: t("share.sharing"),
        close: t("share.close"),
        saveSuccess: t("share.saveSuccess"),
        saveError: t("share.saveError"),
        shareError: t("share.shareError"),
        error: t("toast.error"),
      }}
      renderCard={({ cardRef, theme, size }) => (
        <NutritionShareCard
          ref={cardRef}
          date={date}
          calories={calories}
          calorieGoal={calorieGoal}
          protein={protein}
          proteinGoal={proteinGoal}
          carbs={carbs}
          carbsGoal={carbsGoal}
          fat={fat}
          fatGoal={fatGoal}
          meals={showMeals ? meals : []}
          theme={theme}
          size={size}
          energyBalance={energyBalance}
          showMacros={showMacros}
        />
      )}
      middleContent={() => (
        <View className="w-full mt-4">
          <AppTextNC className="text-sm text-gray-400 mb-2">
            {t("share.showOnCard")}
          </AppTextNC>
          <View className="flex-row flex-wrap gap-2">
            <AnimatedButton
              onPress={() => setShowMacros((prev) => !prev)}
              className={`px-4 py-2 rounded-full border ${
                showMacros
                  ? "bg-blue-700 border-blue-500"
                  : "bg-transparent border-gray-500"
              }`}
            >
              <AppTextNC
                className={`text-sm ${showMacros ? "text-gray-100" : "text-gray-400"}`}
              >
                {t("share.macros")}
              </AppTextNC>
            </AnimatedButton>
            <AnimatedButton
              onPress={() => setShowMeals((prev) => !prev)}
              className={`px-4 py-2 rounded-full border ${
                showMeals
                  ? "bg-blue-700 border-blue-500"
                  : "bg-transparent border-gray-500"
              }`}
            >
              <AppTextNC
                className={`text-sm ${showMeals ? "text-gray-100" : "text-gray-400"}`}
              >
                {t("share.meals")}
              </AppTextNC>
            </AnimatedButton>
            {hasEnergyBalance && (
              <AnimatedButton
                onPress={() => setShowEnergyBalance((prev) => !prev)}
                className={`px-4 py-2 rounded-full border ${
                  showEnergyBalance
                    ? "bg-blue-700 border-blue-500"
                    : "bg-transparent border-gray-500"
                }`}
              >
                <AppTextNC
                  className={`text-sm ${showEnergyBalance ? "text-gray-100" : "text-gray-400"}`}
                >
                  {t("share.balance")}
                </AppTextNC>
              </AnimatedButton>
            )}
          </View>
        </View>
      )}
    />
  );
}
