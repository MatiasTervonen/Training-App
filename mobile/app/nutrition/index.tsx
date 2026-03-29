import { useState, useMemo, useCallback, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import Animated from "react-native-reanimated";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import PageContainer from "@/components/PageContainer";
import AnimatedButton from "@/components/buttons/animatedButton";
import FloatingActionButton from "@/components/buttons/FloatingActionButton";
import DailySummary from "@/features/nutrition/components/DailySummary";
import MealSection from "@/features/nutrition/components/MealSection";
import NutritionShareModal from "@/features/nutrition/components/NutritionShareModal";
import CreateEditMealModal from "@/features/nutrition/components/CreateEditMealModal";
import type { MealBuilderItem } from "@/features/nutrition/components/CreateEditMealModal";
import { useDailyLogs } from "@/features/nutrition/hooks/useDailyLogs";
import { useNutritionGoals } from "@/features/nutrition/hooks/useNutritionGoals";
import { useDeleteFoodLog } from "@/features/nutrition/hooks/useDeleteFoodLog";
import { useUpdateMealTime } from "@/features/nutrition/hooks/useUpdateMealTime";
import { useSaveMeal } from "@/features/nutrition/hooks/useSaveMeal";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Plus, Settings, ChevronLeft, ChevronRight, Share2, BarChart3 } from "lucide-react-native";
import FoodDetailSheet from "@/features/nutrition/components/FoodDetailSheet";
import EnergyBalanceCard from "@/features/energy-balance/components/EnergyBalanceCard";
import { useEnergyBalance } from "@/features/energy-balance/hooks/useEnergyBalance";
import { useLogFood } from "@/features/nutrition/hooks/useLogFood";
import { useToggleFavorite } from "@/features/nutrition/hooks/useToggleFavorite";
import { useFavorites } from "@/features/nutrition/hooks/useFavorites";
import { getTrackingDate } from "@/lib/formatDate";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import { useNutritionDateStore } from "@/lib/stores/nutritionDateStore";
import { useModalPageScroll } from "@/components/ModalPageWrapper";
import type { DailyFoodLog } from "@/database/nutrition/get-daily-logs";

const DEFAULT_MEALS = ["breakfast", "lunch", "dinner", "snack"];

export default function NutritionScreen() {
  const { t } = useTranslation(["nutrition", "common"]);
  const router = useRouter();
  const date = useNutritionDateStore((s) => s.date);
  const setDate = useNutritionDateStore((s) => s.setDate);
  const setModalPageConfig = useModalPageConfig((s) => s.setModalPageConfig);
  const handleModalScroll = useModalPageScroll();

  useEffect(() => {
    setModalPageConfig({
      rightLabel: t("common:navigation.log"),
      onSwipeLeft: () => router.push(`/nutrition/log?date=${date}`),
      topLabel: t("nutrition:log.scan"),
      onSwipeDown: () => router.push(`/nutrition/log?date=${date}&tab=scan`),
    });
    return () => setModalPageConfig(null);
  }, [router, setModalPageConfig, t, date]);
  const [selectedLog, setSelectedLog] = useState<DailyFoodLog | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showSaveAsMeal, setShowSaveAsMeal] = useState(false);
  const [saveAsMealItems, setSaveAsMealItems] = useState<MealBuilderItem[]>([]);
  const [saveAsMealName, setSaveAsMealName] = useState("");

  const { data: logs } = useDailyLogs(date);
  const { data: goals } = useNutritionGoals();
  const { handleDelete } = useDeleteFoodLog();
  const { updateMealTime } = useUpdateMealTime();
  const { handleLogFood } = useLogFood({ skipBack: true });
  const { handleToggle } = useToggleFavorite();
  const { data: favorites } = useFavorites();
  const { handleSaveMeal, isSaving: isSavingMeal } = useSaveMeal();

  const selectedFood = selectedLog
    ? {
        id: selectedLog.food_id ?? selectedLog.custom_food_id,
        name: selectedLog.food_name,
        brand: selectedLog.brand,
        calories_per_100g: Number(selectedLog.calories_per_100g ?? 0),
        protein_per_100g: Number(selectedLog.protein_per_100g ?? 0),
        carbs_per_100g: Number(selectedLog.carbs_per_100g ?? 0),
        fat_per_100g: Number(selectedLog.fat_per_100g ?? 0),
        saturated_fat_per_100g:
          selectedLog.saturated_fat_per_100g != null
            ? Number(selectedLog.saturated_fat_per_100g)
            : null,
        sugar_per_100g:
          selectedLog.sugar_per_100g != null
            ? Number(selectedLog.sugar_per_100g)
            : null,
        fiber_per_100g:
          selectedLog.fiber_per_100g != null
            ? Number(selectedLog.fiber_per_100g)
            : null,
        sodium_per_100g:
          selectedLog.sodium_per_100g != null
            ? Number(selectedLog.sodium_per_100g)
            : null,
        serving_size_g: Number(selectedLog.serving_size_g),
        serving_description: selectedLog.serving_description,
        is_custom: selectedLog.is_custom,
        barcode: null,
        image_url: selectedLog.image_url ?? null,
        image_nutrition_url: selectedLog.nutrition_label_url ?? null,
        source: "local" as const,
      }
    : null;

  const isSelectedFavorite = selectedLog
    ? (favorites ?? []).some((f) =>
        selectedLog.is_custom
          ? f.custom_food_id === selectedLog.custom_food_id
          : f.food_id === selectedLog.food_id,
      )
    : false;

  const calorieRingTarget = goals?.calorie_ring_target ?? "goal";
  const { data: energyBalance } = useEnergyBalance(calorieRingTarget === "tdee" ? date : "");
  const calorieGoal = goals?.calorie_goal ?? 2000;
  const ringGoal = calorieRingTarget === "tdee" && energyBalance?.tdee ? energyBalance.tdee : calorieGoal;
  const proteinGoal = goals?.protein_goal ?? null;
  const carbsGoal = goals?.carbs_goal ?? null;
  const fatGoal = goals?.fat_goal ?? null;
  const fiberGoal = goals?.fiber_goal ?? null;
  const sugarGoal = goals?.sugar_goal ?? null;
  const sodiumGoal = goals?.sodium_goal ?? null;
  const saturatedFatGoal = goals?.saturated_fat_goal ?? null;
  const visibleNutrients = goals?.visible_nutrients ?? [];
  const customMealTypes = useMemo(() => goals?.custom_meal_types ?? [], [goals?.custom_meal_types]);

  // Aggregate daily totals from logs
  // Macros are stored directly on food_logs; micros are computed from per_100g values
  const totals = useMemo(
    () =>
      (logs ?? []).reduce(
        (acc, log) => {
          const factor =
            (Number(log.serving_size_g) * Number(log.quantity)) / 100;
          return {
            calories: acc.calories + Number(log.calories),
            protein: acc.protein + Number(log.protein ?? 0),
            carbs: acc.carbs + Number(log.carbs ?? 0),
            fat: acc.fat + Number(log.fat ?? 0),
            fiber: acc.fiber + Number(log.fiber_per_100g ?? 0) * factor,
            sugar: acc.sugar + Number(log.sugar_per_100g ?? 0) * factor,
            sodium:
              acc.sodium + Number(log.sodium_per_100g ?? 0) * factor * 1000,
            saturatedFat:
              acc.saturatedFat +
              Number(log.saturated_fat_per_100g ?? 0) * factor,
          };
        },
        {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
          saturatedFat: 0,
        },
      ),
    [logs],
  );

  // Group logs by meal type and compute ordered meal list
  const { mealGroups, orderedMeals } = useMemo(() => {
    const groups = new Map<string, NonNullable<typeof logs>>();

    if (logs) {
      for (const log of logs) {
        const group = groups.get(log.meal_type) ?? [];
        group.push(log);
        groups.set(log.meal_type, group);
      }
    }

    const ordered = [
      ...DEFAULT_MEALS.filter((m) => groups.has(m)),
      ...(customMealTypes ?? []).filter((m) => groups.has(m)),
      ...Array.from(groups.keys()).filter(
        (m) =>
          !DEFAULT_MEALS.includes(m) && !(customMealTypes ?? []).includes(m),
      ),
    ];

    return { mealGroups: groups, orderedMeals: ordered };
  }, [logs, customMealTypes]);

  const getMealLabel = useCallback((type: string) => {
    if (DEFAULT_MEALS.includes(type)) {
      return t(
        `meals.${type}` as
          | "meals.breakfast"
          | "meals.lunch"
          | "meals.dinner"
          | "meals.snack",
      );
    }
    return type;
  }, [t]);

  const handleSaveAsMeal = useCallback((mealType: string, items: DailyFoodLog[]) => {
    const builderItems: MealBuilderItem[] = items.map((log) => ({
      localId: `${Date.now()}-${Math.random()}`,
      food_id: log.food_id,
      custom_food_id: log.custom_food_id,
      food_name: log.food_name,
      brand: log.brand,
      calories_per_100g: Number(log.calories_per_100g ?? 0),
      protein_per_100g: Number(log.protein_per_100g ?? 0),
      carbs_per_100g: Number(log.carbs_per_100g ?? 0),
      fat_per_100g: Number(log.fat_per_100g ?? 0),
      serving_size_g: Number(log.serving_size_g),
      quantity: Number(log.quantity),
    }));
    setSaveAsMealItems(builderItems);
    setSaveAsMealName(getMealLabel(mealType));
    setShowSaveAsMeal(true);
  }, [getMealLabel]);

  const changeDate = (offset: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    setDate(d.toLocaleDateString("en-CA"));
  };

  const today = getTrackingDate();
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
    <View className="flex-1">
      <Animated.ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} onScroll={handleModalScroll} scrollEventThrottle={16}>
        <PageContainer>
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <AppText className="text-xl">{t("title")}</AppText>
            <View className="flex-row items-center gap-3">
              <AnimatedButton
                onPress={() => setIsShareModalOpen(true)}
                className="btn-base"
              >
                <View className="px-1 py-0.5">
                  <Share2 size={18} color="#94a3b8" />
                </View>
              </AnimatedButton>
              <AnimatedButton
                onPress={() => router.push("/nutrition/analytics")}
                className="btn-base"
              >
                <View className="px-1 py-0.5">
                  <BarChart3 size={18} color="#94a3b8" />
                </View>
              </AnimatedButton>
              <AnimatedButton
                onPress={() => router.push("/nutrition/goals")}
                className="btn-base"
              >
                <View className="px-1 py-0.5">
                  <Settings size={18} color="#94a3b8" />
                </View>
              </AnimatedButton>
            </View>
          </View>

          {/* Date picker */}
          <View className="flex-row items-center justify-center mb-4">
            <AnimatedButton onPress={() => changeDate(-1)} hitSlop={20} className="p-2">
              <ChevronLeft size={24} color="#94a3b8" />
            </AnimatedButton>
            <AppText className="text-base text-center w-40" numberOfLines={1}>{formatDisplayDate(date)}</AppText>
            <AnimatedButton
              onPress={() => changeDate(1)}
              hitSlop={20}
              disabled={isToday}
              className="p-2"
            >
              <ChevronRight size={24} color={isToday ? "#334155" : "#94a3b8"} />
            </AnimatedButton>
          </View>

          {/* Daily summary */}
          <DailySummary
            calories={totals.calories}
            protein={totals.protein}
            carbs={totals.carbs}
            fat={totals.fat}
            calorieGoal={ringGoal}
            proteinGoal={proteinGoal}
            carbsGoal={carbsGoal}
            fatGoal={fatGoal}
            fiber={totals.fiber}
            sugar={totals.sugar}
            sodium={totals.sodium}
            saturatedFat={totals.saturatedFat}
            fiberGoal={fiberGoal}
            sugarGoal={sugarGoal}
            sodiumGoal={sodiumGoal}
            saturatedFatGoal={saturatedFatGoal}
            visibleNutrients={visibleNutrients}
          />

          {/* Energy Balance */}
          <EnergyBalanceCard date={date} />

          {/* Meal sections */}
          {logs === undefined ? (
            <ActivityIndicator className="mt-6" />
          ) : logs.length > 0 ? (
            <View className="mt-4">
              {orderedMeals.map((mealType) => (
                <MealSection
                  key={mealType}
                  title={getMealLabel(mealType)}
                  items={mealGroups.get(mealType) ?? []}
                  onPress={(item) => setSelectedLog(item)}
                  onDelete={(id) => handleDelete(id, date)}
                  onUpdateMealTime={(mealTime) =>
                    updateMealTime({ loggedAt: date, mealType, mealTime })
                  }
                  onSaveAsMeal={() =>
                    handleSaveAsMeal(mealType, mealGroups.get(mealType) ?? [])
                  }
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
      </Animated.ScrollView>

      <FloatingActionButton
        onPress={() => router.push(`/nutrition/log?date=${date}`)}
        color="#ff00ff"
      >
        <Plus size={30} color="#ff00ff" />
      </FloatingActionButton>

      <FoodDetailSheet
        food={selectedFood}
        visible={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        onLog={async (params) => {
          if (!selectedLog) return;
          setSelectedLog(null);
          await handleLogFood({
            foodId: selectedLog.is_custom ? null : selectedLog.food_id,
            customFoodId: selectedLog.is_custom ? selectedLog.custom_food_id : null,
            foodName: params.food.name,
            mealType: params.mealType,
            servingSizeG: params.servingSizeG,
            quantity: params.quantity,
            calories: params.calories,
            protein: params.protein,
            carbs: params.carbs,
            fat: params.fat,
            loggedAt: date,
          });
        }}
        isFavorite={isSelectedFavorite}
        onToggleFavorite={() => {
          if (!selectedLog) return;
          handleToggle({
            foodId: selectedLog.is_custom ? null : selectedLog.food_id,
            customFoodId: selectedLog.is_custom
              ? selectedLog.custom_food_id
              : null,
          });
        }}
        customMealTypes={customMealTypes}
      />

      <CreateEditMealModal
        visible={showSaveAsMeal}
        onClose={() => {
          setShowSaveAsMeal(false);
          setSaveAsMealItems([]);
          setSaveAsMealName("");
        }}
        onSave={async (params) => {
          await handleSaveMeal(params);
          setShowSaveAsMeal(false);
          setSaveAsMealItems([]);
          setSaveAsMealName("");
        }}
        editingMeal={null}
        isSaving={isSavingMeal}
        initialItems={saveAsMealItems}
        initialName={saveAsMealName}
      />

      <NutritionShareModal
        visible={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        date={date}
        calories={totals.calories}
        calorieGoal={calorieGoal}
        protein={totals.protein}
        proteinGoal={proteinGoal}
        carbs={totals.carbs}
        carbsGoal={carbsGoal}
        fat={totals.fat}
        fatGoal={fatGoal}
        logs={logs ?? null}
        getMealLabel={getMealLabel}
      />
    </View>
  );
}
