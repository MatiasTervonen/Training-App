"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import {
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
} from "lucide-react";
import { useDailyLogs } from "@/features/nutrition/hooks/useDailyLogs";
import { useNutritionGoals } from "@/features/nutrition/hooks/useNutritionGoals";
import { useDeleteFoodLog } from "@/features/nutrition/hooks/useDeleteFoodLog";
import { useToggleFavorite } from "@/features/nutrition/hooks/useToggleFavorite";
import { useFavorites } from "@/features/nutrition/hooks/useFavorites";
import DailySummary from "@/features/nutrition/components/DailySummary";
import MealSection from "@/features/nutrition/components/MealSection";
import dynamic from "next/dynamic";

const FoodDetailModal = dynamic(() => import("@/features/nutrition/components/FoodDetailModal"), { ssr: false });
import Spinner from "@/components/spinner";
import EmptyState from "@/components/EmptyState";
import type { DailyFoodLog } from "@/types/nutrition";

const DEFAULT_MEALS = ["breakfast", "lunch", "dinner", "snack"];

export default function NutritionPage() {
  const { t } = useTranslation("nutrition");
  const [date, setDate] = useState(() =>
    new Date().toLocaleDateString("en-CA"),
  );
  const [selectedLog, setSelectedLog] = useState<DailyFoodLog | null>(null);

  const { data: logs, isLoading } = useDailyLogs(date);
  const { data: goals } = useNutritionGoals();
  const { handleDelete } = useDeleteFoodLog();
  const { handleToggle } = useToggleFavorite();
  const { data: favorites } = useFavorites();

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

  const calorieGoal = goals?.calorie_goal ?? 2000;
  const proteinGoal = goals?.protein_goal ?? null;
  const carbsGoal = goals?.carbs_goal ?? null;
  const fatGoal = goals?.fat_goal ?? null;
  const fiberGoal = goals?.fiber_goal ?? null;
  const sugarGoal = goals?.sugar_goal ?? null;
  const sodiumGoal = goals?.sodium_goal ?? null;
  const saturatedFatGoal = goals?.saturated_fat_goal ?? null;
  const visibleNutrients = goals?.visible_nutrients ?? [];
  const customMealTypes = useMemo(
    () => goals?.custom_meal_types ?? [],
    [goals?.custom_meal_types],
  );

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

  const getMealLabel = useCallback(
    (type: string) => {
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
    },
    [t],
  );

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
    <div className="page-padding h-full relative">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl">{t("title")}</span>
          <Link
            href="/nutrition/goals"
            className="p-2 rounded-full hover:bg-slate-700/50 transition-colors"
          >
            <Settings size={22} className="text-slate-400" />
          </Link>
        </div>

        {/* Date picker */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => changeDate(-1)}
            className="p-1 cursor-pointer hover:bg-slate-700/50 rounded transition-colors"
          >
            <ChevronLeft size={24} className="text-slate-400" />
          </button>
          <span className="text-base">{formatDisplayDate(date)}</span>
          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className="p-1 cursor-pointer hover:bg-slate-700/50 rounded transition-colors disabled:opacity-30 disabled:cursor-default"
          >
            <ChevronRight
              size={24}
              className={isToday ? "text-slate-700" : "text-slate-400"}
            />
          </button>
        </div>

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

        {/* Meal sections */}
        {isLoading ? (
          <div className="flex justify-center mt-6">
            <Spinner />
          </div>
        ) : logs && logs.length > 0 ? (
          <div className="mt-4">
            {orderedMeals.map((mealType) => (
              <MealSection
                key={mealType}
                title={getMealLabel(mealType)}
                items={mealGroups.get(mealType) ?? []}
                onPress={(item) => setSelectedLog(item)}
                onDelete={(id) => handleDelete(id, date)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={UtensilsCrossed}
            title={t("daily.noLogs")}
            description={t("daily.noLogsDesc")}
          />
        )}
      </div>

      {/* Floating Action Button */}
      <div className="absolute bottom-8 right-6 z-50 pointer-events-none">
        <Link
          href={`/nutrition/log?date=${date}`}
          className="pointer-events-auto w-14 h-14 rounded-full bg-slate-800 border-[1.5px] border-fuchsia-400/60 shadow-lg shadow-fuchsia-400/30 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Plus size={30} className="text-fuchsia-400" />
        </Link>
      </div>

      {/* Food Detail Modal (read-only view from dashboard) */}
      <FoodDetailModal
        food={selectedFood}
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        onLog={() => setSelectedLog(null)}
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
    </div>
  );
}
