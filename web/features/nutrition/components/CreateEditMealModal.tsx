"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { X, Plus, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import Modal from "@/components/modal";
import CustomInput from "@/ui/CustomInput";
import NutritionInfo from "@/features/nutrition/components/NutritionInfo";
import FoodSearchList from "@/features/nutrition/components/FoodSearchList";
import FavoriteFoodsList from "@/features/nutrition/components/FavoriteFoodsList";
import RecentFoodsList from "@/features/nutrition/components/RecentFoodsList";
import { useFoodSearch } from "@/features/nutrition/hooks/useFoodSearch";
import { useSaveMeal } from "@/features/nutrition/hooks/useSaveMeal";
import { useDeleteSavedMeal } from "@/features/nutrition/hooks/useDeleteSavedMeal";
import { saveSharedFood } from "@/database/nutrition/save-shared-food";
import { generateUUID } from "@/lib/generateUUID";
import type { NutritionSearchResult, SavedMeal } from "@/types/nutrition";

type MealBuilderItem = {
  localId: string;
  food_id: string | null;
  custom_food_id: string | null;
  food_name: string;
  brand: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  serving_size_g: number;
  quantity: number;
};

type CreateEditMealModalProps = {
  isOpen: boolean;
  onClose: () => void;
  meal?: SavedMeal | null;
};

type NestedSearchTab = "search" | "favorites" | "recent";

const DRAFT_KEY = "nutrition-meal-draft";

type MealDraft = {
  name: string;
  items: MealBuilderItem[];
};

function loadDraft(): MealDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MealDraft;
  } catch {
    return null;
  }
}

function saveDraft(name: string, items: MealBuilderItem[]) {
  if (!name && items.length === 0) {
    localStorage.removeItem(DRAFT_KEY);
    return;
  }
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, items }));
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

function searchResultToBuilderItem(
  result: NutritionSearchResult,
): MealBuilderItem {
  return {
    localId: generateUUID(),
    food_id: result.is_custom ? null : result.id,
    custom_food_id: result.is_custom ? result.id : null,
    food_name: result.name,
    brand: result.brand,
    calories_per_100g: result.calories_per_100g,
    protein_per_100g: result.protein_per_100g,
    carbs_per_100g: result.carbs_per_100g,
    fat_per_100g: result.fat_per_100g,
    serving_size_g: result.serving_size_g,
    quantity: 1,
  };
}

export default function CreateEditMealModal({
  isOpen,
  onClose,
  meal,
}: CreateEditMealModalProps) {
  const { t } = useTranslation("nutrition");
  const { handleSaveMeal, isSaving } = useSaveMeal();
  const { handleDeleteMeal, isDeleting } = useDeleteSavedMeal();
  const isEditing = !!meal;

  const [mealName, setMealName] = useState(() => {
    if (meal) return meal.name;
    const draft = loadDraft();
    return draft?.name ?? "";
  });
  const [items, setItems] = useState<MealBuilderItem[]>(() => {
    if (meal) {
      return meal.items.map((item) => ({
        localId: generateUUID(),
        food_id: item.food_id,
        custom_food_id: item.custom_food_id,
        food_name: item.food_name,
        brand: item.brand,
        calories_per_100g: item.calories_per_100g,
        protein_per_100g: item.protein_per_100g,
        carbs_per_100g: item.carbs_per_100g,
        fat_per_100g: item.fat_per_100g,
        serving_size_g: item.serving_size_g,
        quantity: item.quantity,
      }));
    }
    const draft = loadDraft();
    return draft?.items ?? [];
  });
  const [showSearch, setShowSearch] = useState(false);
  const [searchTab, setSearchTab] = useState<NestedSearchTab>("search");
  const [searchQuery, setSearchQuery] = useState("");

  const { results, isSearching } = useFoodSearch(searchQuery);

  // Reset when meal prop changes (switching between create/edit)
  const [prevMealId, setPrevMealId] = useState<string | null>(null);
  const currentMealId = meal?.id ?? null;
  if (currentMealId !== prevMealId) {
    setPrevMealId(currentMealId);
    if (meal) {
      setMealName(meal.name);
      setItems(
        meal.items.map((item) => ({
          localId: generateUUID(),
          food_id: item.food_id,
          custom_food_id: item.custom_food_id,
          food_name: item.food_name,
          brand: item.brand,
          calories_per_100g: item.calories_per_100g,
          protein_per_100g: item.protein_per_100g,
          carbs_per_100g: item.carbs_per_100g,
          fat_per_100g: item.fat_per_100g,
          serving_size_g: item.serving_size_g,
          quantity: item.quantity,
        })),
      );
    } else {
      const draft = loadDraft();
      setMealName(draft?.name ?? "");
      setItems(draft?.items ?? []);
    }
  }

  // Persist draft to localStorage for create mode
  useEffect(() => {
    if (!isEditing) {
      saveDraft(mealName, items);
    }
  }, [mealName, items, isEditing]);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const factor = (item.serving_size_g * item.quantity) / 100;
        return {
          calories: acc.calories + item.calories_per_100g * factor,
          protein: acc.protein + item.protein_per_100g * factor,
          carbs: acc.carbs + item.carbs_per_100g * factor,
          fat: acc.fat + item.fat_per_100g * factor,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [items]);

  const updateItemServingSize = (localId: string, value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.localId === localId
          ? { ...item, serving_size_g: parseFloat(value) || 0 }
          : item,
      ),
    );
  };

  const updateItemQuantity = (localId: string, value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.localId === localId
          ? { ...item, quantity: parseFloat(value) || 0 }
          : item,
      ),
    );
  };

  const removeItem = (localId: string) => {
    setItems((prev) => prev.filter((item) => item.localId !== localId));
  };

  const handleSelectFood = useCallback(
    async (food: NutritionSearchResult) => {
      // Cache API results in shared_foods table
      if (food.source === "api" && food.barcode) {
        try {
          const savedId = await saveSharedFood({
            barcode: food.barcode,
            name: food.name,
            brand: food.brand,
            servingSizeG: food.serving_size_g,
            servingDescription: food.serving_description,
            caloriesPer100g: food.calories_per_100g,
            proteinPer100g: food.protein_per_100g,
            carbsPer100g: food.carbs_per_100g,
            fatPer100g: food.fat_per_100g,
            fiberPer100g: food.fiber_per_100g,
            sugarPer100g: food.sugar_per_100g,
            sodiumPer100g: food.sodium_per_100g,
            saturatedFatPer100g: food.saturated_fat_per_100g,
            imageUrl: food.image_url,
            nutritionLabelUrl: food.image_nutrition_url,
          });
          const builderItem = searchResultToBuilderItem({
            ...food,
            id: savedId,
            is_custom: false,
            source: "local",
          });
          setItems((prev) => [...prev, builderItem]);
        } catch {
          setItems((prev) => [...prev, searchResultToBuilderItem(food)]);
        }
      } else {
        setItems((prev) => [...prev, searchResultToBuilderItem(food)]);
      }
      setShowSearch(false);
      setSearchQuery("");
    },
    [],
  );

  const handleSave = async () => {
    if (!mealName.trim()) return;
    if (items.length === 0) return;

    try {
      await handleSaveMeal({
        name: mealName.trim(),
        items: items.map((item, index) => ({
          food_id: item.food_id,
          custom_food_id: item.custom_food_id,
          serving_size_g: item.serving_size_g,
          quantity: item.quantity,
          sort_order: index,
        })),
        mealId: meal?.id ?? undefined,
      });
      clearDraft();
      onClose();
    } catch {
      // Error handled by hook
    }
  };

  const handleDelete = () => {
    if (!meal?.id) return;
    const confirmed = window.confirm(t("savedMeals.deleteConfirm"));
    if (!confirmed) return;

    handleDeleteMeal(meal.id);
    onClose();
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      confirmBeforeClose={isEditing}
    >
      <div className="p-4 flex flex-col gap-4 max-w-xl mx-auto min-h-full justify-between">
        <div className="flex flex-col gap-4">
        <p className="text-lg pt-2 text-center">
          {meal ? t("savedMeals.edit") : t("savedMeals.create")}
        </p>

        {/* Meal name */}
        <CustomInput
          label={t("savedMeals.mealName")}
          value={mealName}
          setValue={setMealName}
          placeholder={t("savedMeals.mealNamePlaceholder")}
        />

        {/* Items list */}
        <div className="flex flex-col gap-2">
          <p className="text-sm">{t("savedMeals.foodItems")}</p>

          {items.length === 0 && (
            <p className="font-body text-sm text-slate-400 text-center py-4">
              {t("savedMeals.emptyMeal")}
            </p>
          )}

          {items.map((item) => {
            const factor = (item.serving_size_g * item.quantity) / 100;
            const itemCals = Math.round(item.calories_per_100g * factor);

            return (
              <div
                key={item.localId}
                className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.food_name}</p>
                    {item.brand && (
                      <p className="font-body text-xs text-slate-400 truncate">
                        {item.brand}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-body text-sm text-slate-400">
                      {itemCals} kcal
                    </span>
                    <button
                      onClick={() => removeItem(item.localId)}
                      className="p-1 rounded-full hover:bg-slate-700/50 transition-colors cursor-pointer"
                      aria-label={t("savedMeals.removeItem")}
                    >
                      <X size={14} className="text-slate-400" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <CustomInput
                    label={t("detail.servingSize")}
                    value={String(item.serving_size_g)}
                    setValue={(v) => updateItemServingSize(item.localId, v)}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    className="text-sm"
                  />
                  <CustomInput
                    label={t("detail.quantity")}
                    value={String(item.quantity)}
                    setValue={(v) => updateItemQuantity(item.localId, v)}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    className="text-sm"
                  />
                </div>
              </div>
            );
          })}

          {/* Add food button */}
          <button
            onClick={() => setShowSearch(true)}
            className="btn-base flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            {t("savedMeals.addFood")}
          </button>
        </div>

        {/* Total nutrition */}
        {items.length > 0 && (
          <NutritionInfo
            calories={totals.calories}
            protein={totals.protein}
            carbs={totals.carbs}
            fat={totals.fat}
            per100g={false}
          />
        )}

        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-2 pb-4">
          {meal && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn-danger flex-1"
            >
              {isDeleting
                ? t("savedMeals.deleting")
                : t("savedMeals.delete")}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={
              isSaving ||
              !mealName.trim() ||
              items.length === 0
            }
            className="btn-save flex-1"
          >
            {isSaving ? t("savedMeals.saving") : t("savedMeals.saveMeal")}
          </button>
        </div>
      </div>

    </Modal>

      {/* Add Food — separate modal that stacks on top */}
      <Modal
        isOpen={showSearch}
        onClose={() => {
          setShowSearch(false);
          setSearchQuery("");
        }}
      >
        <div className="flex flex-col h-full max-w-xl mx-auto w-full">
          {/* Title */}
          <p className="text-lg text-center pt-4 pb-2">{t("savedMeals.addFood")}</p>

          {/* Tabs */}
          <div className="flex px-4 pt-2 pb-2 gap-2">
            {(["search", "favorites", "recent"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSearchTab(tab)}
                className={`flex-1 py-2 rounded-lg text-sm cursor-pointer transition-colors border ${
                  searchTab === tab
                    ? "bg-fuchsia-500/20 border-fuchsia-500/50"
                    : "bg-slate-800/50 border-slate-700/50 text-slate-400"
                }`}
              >
                {tab === "search" && t("log.search")}
                {tab === "favorites" && t("log.favorites")}
                {tab === "recent" && t("log.recent")}
              </button>
            ))}
          </div>

          {/* Search input */}
          {searchTab === "search" && (
            <div className="px-4 py-2">
              <CustomInput
                value={searchQuery}
                setValue={setSearchQuery}
                placeholder={t("log.searchPlaceholder")}
                autoFocus
              />
            </div>
          )}

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {searchTab === "search" && (
              <FoodSearchList
                results={results}
                isSearching={isSearching}
                query={searchQuery}
                onSelect={handleSelectFood}
              />
            )}
            {searchTab === "favorites" && (
              <FavoriteFoodsList onSelect={handleSelectFood} />
            )}
            {searchTab === "recent" && (
              <RecentFoodsList onSelect={handleSelectFood} />
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
