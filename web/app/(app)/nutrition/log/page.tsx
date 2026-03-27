"use client";

import { Suspense, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Search,
  Heart,
  Clock,
  PenLine,
  UtensilsCrossed,
} from "lucide-react";
import CustomInput from "@/ui/CustomInput";
import Spinner from "@/components/spinner";
import FoodSearchList from "@/features/nutrition/components/FoodSearchList";
import FavoriteFoodsList from "@/features/nutrition/components/FavoriteFoodsList";
import RecentFoodsList from "@/features/nutrition/components/RecentFoodsList";
import CustomFoodForm from "@/features/nutrition/components/CustomFoodForm";
import SavedMealsList from "@/features/nutrition/components/SavedMealsList";
import dynamic from "next/dynamic";

const FoodDetailModal = dynamic(() => import("@/features/nutrition/components/FoodDetailModal"), { ssr: false });
const CreateEditMealModal = dynamic(() => import("@/features/nutrition/components/CreateEditMealModal"), { ssr: false });
const LogSavedMealModal = dynamic(() => import("@/features/nutrition/components/LogSavedMealModal"), { ssr: false });
import { useFoodSearch } from "@/features/nutrition/hooks/useFoodSearch";
import { useLogFood } from "@/features/nutrition/hooks/useLogFood";
import { useToggleFavorite } from "@/features/nutrition/hooks/useToggleFavorite";
import { useFavorites } from "@/features/nutrition/hooks/useFavorites";
import { useNutritionGoals } from "@/features/nutrition/hooks/useNutritionGoals";
import { useLogSavedMeal } from "@/features/nutrition/hooks/useLogSavedMeal";
import { saveSharedFood } from "@/database/nutrition/save-shared-food";
import { getTrackingDate } from "@/lib/formatDate";
import type { NutritionSearchResult, SavedMeal } from "@/types/nutrition";

type Tab = "search" | "favorites" | "recent" | "custom" | "meals";

function LogFoodContent() {
  const { t } = useTranslation("nutrition");
  const searchParams = useSearchParams();
  const loggedAt =
    searchParams.get("date") || getTrackingDate();

  const [activeTab, setActiveTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<NutritionSearchResult | null>(
    null,
  );
  const [showDetail, setShowDetail] = useState(false);
  const [showCreateMeal, setShowCreateMeal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<SavedMeal | null>(null);
  const [loggingMeal, setLoggingMeal] = useState<SavedMeal | null>(null);

  const { results, isSearching } = useFoodSearch(query);
  const { handleLogFood } = useLogFood();
  const { handleToggle } = useToggleFavorite();
  const { data: favorites } = useFavorites();
  const { data: goals } = useNutritionGoals();
  const { handleLogMeal } = useLogSavedMeal();

  const customMealTypes = goals?.custom_meal_types ?? [];

  const isFavorite = useCallback(
    (food: NutritionSearchResult) => {
      if (!favorites) return false;
      if (food.is_custom) {
        return favorites.some((f) => f.custom_food_id === food.id);
      }
      return favorites.some((f) => f.food_id === food.id);
    },
    [favorites],
  );

  const handleSelectFood = (food: NutritionSearchResult) => {
    setSelectedFood(food);
    setShowDetail(true);
  };

  const handleLog = async (params: {
    food: {
      id: string | null;
      name: string;
      brand: string | null;
      calories_per_100g: number;
      protein_per_100g: number;
      carbs_per_100g: number;
      fat_per_100g: number;
      saturated_fat_per_100g: number | null;
      sugar_per_100g: number | null;
      fiber_per_100g: number | null;
      sodium_per_100g: number | null;
      serving_size_g: number;
      serving_description: string | null;
      is_custom: boolean;
      barcode: string | null;
      image_url: string | null;
      image_nutrition_url: string | null;
      source: "local" | "custom" | "api";
      apiSource?: "openfoodfacts" | "usda" | "manual";
    };
    servingSizeG: number;
    quantity: number;
    mealType: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => {
    let foodId = params.food.is_custom ? null : params.food.id;
    const customFoodId = params.food.is_custom ? params.food.id : null;

    if (params.food.source === "api" && !foodId && params.food.barcode) {
      try {
        foodId = await saveSharedFood({
          barcode: params.food.barcode,
          name: params.food.name,
          brand: params.food.brand,
          servingSizeG: params.food.serving_size_g,
          servingDescription: params.food.serving_description,
          caloriesPer100g: params.food.calories_per_100g,
          proteinPer100g: params.food.protein_per_100g,
          carbsPer100g: params.food.carbs_per_100g,
          fatPer100g: params.food.fat_per_100g,
          fiberPer100g: params.food.fiber_per_100g,
          sugarPer100g: params.food.sugar_per_100g,
          sodiumPer100g: params.food.sodium_per_100g,
          saturatedFatPer100g: params.food.saturated_fat_per_100g,
          imageUrl: params.food.image_url,
          nutritionLabelUrl: params.food.image_nutrition_url ?? null,
        });
      } catch {
        // Save failed -- log without food_id
      }
    }

    await handleLogFood({
      foodId: foodId ?? undefined,
      customFoodId: customFoodId ?? undefined,
      foodName: params.food.name,
      mealType: params.mealType,
      servingSizeG: params.servingSizeG,
      quantity: params.quantity,
      calories: params.calories,
      protein: params.protein,
      carbs: params.carbs,
      fat: params.fat,
      loggedAt,
    });

    setShowDetail(false);
    setSelectedFood(null);
  };

  const handleToggleFavorite = () => {
    if (!selectedFood) return;
    handleToggle({
      foodId: selectedFood.is_custom ? null : selectedFood.id,
      customFoodId: selectedFood.is_custom ? selectedFood.id : null,
    });
  };

  const tabs = useMemo<{ id: Tab; label: string; icon: typeof Search }[]>(
    () => [
      { id: "search", label: t("log.search"), icon: Search },
      { id: "favorites", label: t("log.favorites"), icon: Heart },
      { id: "recent", label: t("log.recent"), icon: Clock },
      { id: "custom", label: t("log.custom"), icon: PenLine },
      { id: "meals", label: t("log.meals"), icon: UtensilsCrossed },
    ],
    [t],
  );

  return (
    <div className="page-padding min-h-[calc(100dvh-72px)] flex flex-col">
      <div className="max-w-xl mx-auto w-full flex-1 flex flex-col">
        <p className="text-xl text-center mb-4">{t("log.title")}</p>

        {/* Tab bar */}
        <div className="mb-6 flex flex-col gap-2 pb-4 border-b border-slate-700/50">
          <div className="flex gap-2">
            {tabs.slice(0, 3).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    isActive
                      ? "bg-fuchsia-500/20 border-fuchsia-500/50"
                      : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50"
                  }`}
                >
                  <Icon
                    size={14}
                    color={isActive ? "#ff00ff" : "#94a3b8"}
                  />
                  <span className={isActive ? "" : "text-slate-400"}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            {tabs.slice(3).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    isActive
                      ? "bg-fuchsia-500/20 border-fuchsia-500/50"
                      : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50"
                  }`}
                >
                  <Icon
                    size={14}
                    color={isActive ? "#ff00ff" : "#94a3b8"}
                  />
                  <span className={isActive ? "" : "text-slate-400"}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === "search" && (
          <div>
            <div className="mb-4">
              <CustomInput
                value={query}
                setValue={setQuery}
                placeholder={t("log.searchPlaceholder")}
                autoFocus
              />
            </div>
            <FoodSearchList
              results={results}
              isSearching={isSearching}
              query={query}
              onSelect={handleSelectFood}
            />
          </div>
        )}

        {activeTab === "favorites" && (
          <FavoriteFoodsList onSelect={handleSelectFood} />
        )}

        {activeTab === "recent" && (
          <RecentFoodsList onSelect={handleSelectFood} />
        )}

        {activeTab === "custom" && (
          <div className="flex-1 flex flex-col">
            <CustomFoodForm
              onSaved={() => {
                setActiveTab("search");
              }}
            />
          </div>
        )}

        {activeTab === "meals" && (
          <SavedMealsList
            onCreate={() => {
              setEditingMeal(null);
              setShowCreateMeal(true);
            }}
            onEdit={(meal) => {
              setEditingMeal(meal);
              setShowCreateMeal(true);
            }}
            onLog={(meal) => setLoggingMeal(meal)}
          />
        )}
      </div>

      {/* Food detail modal */}
      <FoodDetailModal
        food={selectedFood}
        isOpen={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedFood(null);
        }}
        onLog={handleLog}
        isFavorite={selectedFood ? isFavorite(selectedFood) : false}
        onToggleFavorite={handleToggleFavorite}
        customMealTypes={customMealTypes}
      />

      {/* Create/Edit meal modal */}
      <CreateEditMealModal
        isOpen={showCreateMeal}
        onClose={() => {
          setShowCreateMeal(false);
          setEditingMeal(null);
        }}
        meal={editingMeal}
      />

      {/* Log saved meal modal */}
      <LogSavedMealModal
        meal={loggingMeal}
        isOpen={!!loggingMeal}
        onClose={() => setLoggingMeal(null)}
        onLog={async (params) => {
          await handleLogMeal({
            savedMealId: params.mealId,
            mealType: params.mealType,
            loggedAt,
          });
          setLoggingMeal(null);
        }}
        customMealTypes={customMealTypes}
      />
    </div>
  );
}

export default function LogFoodPage() {
  return (
    <Suspense
      fallback={
        <div className="page-padding flex items-center justify-center h-full">
          <Spinner />
        </div>
      }
    >
      <LogFoodContent />
    </Suspense>
  );
}
