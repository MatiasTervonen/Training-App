import { useMemo } from "react";
import NutritionShareCard from "@/features/nutrition/components/NutritionShareCard";
import { useTranslation } from "react-i18next";
import ShareModalShell from "@/lib/components/share/ShareModalShell";
import { DailyFoodLog } from "@/database/nutrition/get-daily-logs";

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
          meals={meals}
          theme={theme}
          size={size}
        />
      )}
    />
  );
}
