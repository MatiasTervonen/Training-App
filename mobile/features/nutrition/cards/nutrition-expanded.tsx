import { View, ScrollView, ActivityIndicator } from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import DailySummary from "@/features/nutrition/components/DailySummary";
import MealSection from "@/features/nutrition/components/MealSection";
import { FeedItemUI } from "@/types/session";
import { useDailyLogs } from "@/features/nutrition/hooks/useDailyLogs";
import { useNutritionGoals } from "@/features/nutrition/hooks/useNutritionGoals";
import { useDeleteFoodLog } from "@/features/nutrition/hooks/useDeleteFoodLog";
import { useTranslation } from "react-i18next";

type NutritionExpandedProps = {
  item: FeedItemUI;
};

type NutritionPayload = {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  entry_count: number;
  calorie_goal: number;
};

export default function NutritionExpanded({ item }: NutritionExpandedProps) {
  const { t } = useTranslation("nutrition");
  const date = new Date(item.created_at).toLocaleDateString("en-CA");
  const payload = item.extra_fields as NutritionPayload;
  const { data: logs, isLoading } = useDailyLogs(date);
  const { data: goals } = useNutritionGoals();
  const { handleDelete } = useDeleteFoodLog();

  // Group logs by meal type
  const defaultMeals = ["breakfast", "lunch", "dinner", "snack"];
  const mealGroups = new Map<string, NonNullable<typeof logs>>();

  if (logs) {
    for (const log of logs) {
      const group = mealGroups.get(log.meal_type) ?? [];
      group.push(log);
      mealGroups.set(log.meal_type, group);
    }
  }

  // Get meal label (translate default meals, use raw name for custom)
  const getMealLabel = (type: string) => {
    if (defaultMeals.includes(type)) {
      return t(`meals.${type}`);
    }
    return type;
  };

  // Order: defaults first, then custom
  const orderedMeals = [
    ...defaultMeals.filter((m) => mealGroups.has(m)),
    ...Array.from(mealGroups.keys()).filter((m) => !defaultMeals.includes(m)),
  ];

  // Compute micro totals from per_100g values in daily logs
  const microTotals = (logs ?? []).reduce(
    (acc, log) => {
      const factor = (Number(log.serving_size_g) * Number(log.quantity)) / 100;
      return {
        fiber: acc.fiber + Number(log.fiber_per_100g ?? 0) * factor,
        sugar: acc.sugar + Number(log.sugar_per_100g ?? 0) * factor,
        sodium: acc.sodium + Number(log.sodium_per_100g ?? 0) * factor * 1000,
        saturatedFat:
          acc.saturatedFat + Number(log.saturated_fat_per_100g ?? 0) * factor,
      };
    },
    { fiber: 0, sugar: 0, sodium: 0, saturatedFat: 0 },
  );

  return (
    <ScrollView scrollEventThrottle={16}>
      <PageContainer>
        <AppText className="text-xl text-center mb-4">
          {t("daily.title")}
        </AppText>

        <DailySummary
          calories={payload.total_calories}
          protein={payload.total_protein}
          carbs={payload.total_carbs}
          fat={payload.total_fat}
          calorieGoal={payload.calorie_goal}
          proteinGoal={goals?.protein_goal ?? null}
          carbsGoal={goals?.carbs_goal ?? null}
          fatGoal={goals?.fat_goal ?? null}
          fiber={microTotals.fiber}
          sugar={microTotals.sugar}
          sodium={microTotals.sodium}
          saturatedFat={microTotals.saturatedFat}
          fiberGoal={goals?.fiber_goal ?? null}
          sugarGoal={goals?.sugar_goal ?? null}
          sodiumGoal={goals?.sodium_goal ?? null}
          saturatedFatGoal={goals?.saturated_fat_goal ?? null}
          visibleNutrients={goals?.visible_nutrients ?? []}
        />

        {isLoading ? (
          <ActivityIndicator className="mt-4" />
        ) : (
          <View className="mt-4">
            {orderedMeals.map((mealType) => (
              <MealSection
                key={mealType}
                title={getMealLabel(mealType)}
                items={mealGroups.get(mealType) ?? []}
                onDelete={(id) => handleDelete(id, date)}
              />
            ))}
          </View>
        )}
      </PageContainer>
    </ScrollView>
  );
}
