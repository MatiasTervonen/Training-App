import { useState } from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";
import PageContainer from "@/components/PageContainer";
import AnimatedButton from "@/components/buttons/animatedButton";
import DailySummary from "@/features/nutrition/components/DailySummary";
import MealSection from "@/features/nutrition/components/MealSection";
import { useDailyLogs } from "@/features/nutrition/hooks/useDailyLogs";
import { useNutritionGoals } from "@/features/nutrition/hooks/useNutritionGoals";
import { useDeleteFoodLog } from "@/features/nutrition/hooks/useDeleteFoodLog";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Plus, Settings, ChevronLeft, ChevronRight } from "lucide-react-native";

export default function NutritionScreen() {
  const { t } = useTranslation("nutrition");
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA"));

  const { data: logs, isLoading } = useDailyLogs(date);
  const { data: goals } = useNutritionGoals();
  const { handleDelete } = useDeleteFoodLog();

  const calorieGoal = goals?.calorie_goal ?? 2000;
  const proteinGoal = goals?.protein_goal ?? null;
  const carbsGoal = goals?.carbs_goal ?? null;
  const fatGoal = goals?.fat_goal ?? null;
  const customMealTypes = goals?.custom_meal_types ?? [];

  // Aggregate daily totals from logs
  const totals = (logs ?? []).reduce(
    (acc, log) => ({
      calories: acc.calories + Number(log.calories),
      protein: acc.protein + Number(log.protein ?? 0),
      carbs: acc.carbs + Number(log.carbs ?? 0),
      fat: acc.fat + Number(log.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

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

  const getMealLabel = (type: string) => {
    if (defaultMeals.includes(type)) {
      return t(`meals.${type}` as "meals.breakfast" | "meals.lunch" | "meals.dinner" | "meals.snack");
    }
    return type;
  };

  // Order: defaults first, then custom
  const orderedMeals = [
    ...defaultMeals.filter((m) => mealGroups.has(m)),
    ...(customMealTypes ?? []).filter((m) => mealGroups.has(m)),
    ...Array.from(mealGroups.keys()).filter(
      (m) => !defaultMeals.includes(m) && !(customMealTypes ?? []).includes(m),
    ),
  ];

  const changeDate = (offset: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    setDate(d.toLocaleDateString("en-CA"));
  };

  const today = new Date().toLocaleDateString("en-CA");
  const isToday = date === today;

  const formatDisplayDate = (dateStr: string) => {
    if (dateStr === today) return t("daily.title");
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <ScrollView className="flex-1">
      <PageContainer>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <AppText className="text-xl">{t("title")}</AppText>
          <AnimatedButton
            onPress={() => router.push("/nutrition/goals")}
            hitSlop={10}
          >
            <Settings size={22} color="#94a3b8" />
          </AnimatedButton>
        </View>

        {/* Date picker */}
        <View className="flex-row items-center justify-center gap-4 mb-4">
          <AnimatedButton onPress={() => changeDate(-1)} hitSlop={10}>
            <ChevronLeft size={24} color="#94a3b8" />
          </AnimatedButton>
          <AppText className="text-base">{formatDisplayDate(date)}</AppText>
          <AnimatedButton
            onPress={() => changeDate(1)}
            hitSlop={10}
            disabled={isToday}
          >
            <ChevronRight
              size={24}
              color={isToday ? "#334155" : "#94a3b8"}
            />
          </AnimatedButton>
        </View>

        {/* Daily summary */}
        <DailySummary
          calories={totals.calories}
          protein={totals.protein}
          carbs={totals.carbs}
          fat={totals.fat}
          calorieGoal={calorieGoal}
          proteinGoal={proteinGoal}
          carbsGoal={carbsGoal}
          fatGoal={fatGoal}
        />

        {/* Meal sections */}
        {isLoading ? (
          <ActivityIndicator className="mt-6" />
        ) : logs && logs.length > 0 ? (
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
        ) : (
          <View className="items-center py-10">
            <AppText className="text-base mb-2">{t("daily.noLogs")}</AppText>
            <BodyText className="text-sm text-center">
              {t("daily.noLogsDesc")}
            </BodyText>
          </View>
        )}
      </PageContainer>

      {/* FAB */}
      <View className="absolute bottom-8 right-6">
        <AnimatedButton
          onPress={() => router.push(`/nutrition/log?date=${date}`)}
          className="w-14 h-14 rounded-full bg-orange-500 items-center justify-center shadow-lg"
        >
          <Plus size={28} color="#ffffff" />
        </AnimatedButton>
      </View>
    </ScrollView>
  );
}
