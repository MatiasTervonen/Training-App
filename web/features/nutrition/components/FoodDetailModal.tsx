"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import Modal from "@/components/modal";
import CustomInput from "@/ui/CustomInput";
import NutritionInfo from "@/features/nutrition/components/NutritionInfo";
import DetailedNutrients from "@/features/nutrition/components/DetailedNutrients";
import MealTypePicker from "@/features/nutrition/components/MealTypePicker";

type FoodForDetail = {
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

type FoodDetailModalProps = {
  food: FoodForDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onLog: (params: {
    food: FoodForDetail;
    servingSizeG: number;
    quantity: number;
    mealType: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  customMealTypes: string[];
  defaultMealType?: string;
};

export default function FoodDetailModal({
  food,
  isOpen,
  onClose,
  onLog,
  isFavorite,
  onToggleFavorite,
  customMealTypes,
  defaultMealType = "breakfast",
}: FoodDetailModalProps) {
  const { t } = useTranslation("nutrition");

  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [servingSizeG, setServingSizeG] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [mealType, setMealType] = useState(defaultMealType);

  // Reset state when food changes
  const [prevFoodId, setPrevFoodId] = useState<string | null>(null);
  const currentFoodKey = food ? (food.barcode ?? food.id ?? food.name) : null;
  if (currentFoodKey !== prevFoodId) {
    setPrevFoodId(currentFoodKey);
    if (food) {
      setServingSizeG(String(food.serving_size_g));
      setQuantity("1");
      setMealType(defaultMealType);
    }
  }

  const servingSizeNum = parseFloat(servingSizeG) || 0;
  const quantityNum = parseFloat(quantity) || 0;

  const calculated = useMemo(() => {
    if (!food) return { calories: 0, protein: 0, carbs: 0, fat: 0, saturatedFat: null as number | null, sugar: null as number | null, fiber: null as number | null, sodium: null as number | null };
    const factor = (servingSizeNum * quantityNum) / 100;
    return {
      calories: food.calories_per_100g * factor,
      protein: food.protein_per_100g * factor,
      carbs: food.carbs_per_100g * factor,
      fat: food.fat_per_100g * factor,
      saturatedFat: food.saturated_fat_per_100g != null ? food.saturated_fat_per_100g * factor : null,
      sugar: food.sugar_per_100g != null ? food.sugar_per_100g * factor : null,
      fiber: food.fiber_per_100g != null ? food.fiber_per_100g * factor : null,
      sodium: food.sodium_per_100g != null ? food.sodium_per_100g * factor : null,
    };
  }, [food, servingSizeNum, quantityNum]);

  const handleLog = () => {
    if (!food) return;
    onLog({
      food,
      servingSizeG: servingSizeNum,
      quantity: quantityNum,
      mealType,
      calories: calculated.calories,
      protein: calculated.protein,
      carbs: calculated.carbs,
      fat: calculated.fat,
    });
  };

  const sourceLabel = food?.source === "custom"
    ? t("detail.source_custom")
    : food?.apiSource
      ? t(`detail.source_${food.apiSource}`)
      : null;

  if (!food) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4 flex flex-col gap-4 max-w-xl mx-auto min-h-full justify-between">
        <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pt-2">
          <div className="flex-1 min-w-0">
            <p className="text-lg truncate">{food.name}</p>
            {food.brand && (
              <p className="font-body text-sm text-slate-400 truncate">{food.brand}</p>
            )}
            {food.serving_description && (
              <p className="font-body text-xs text-slate-500 mt-1">
                {food.serving_description}
              </p>
            )}
            {sourceLabel && (
              <p className="font-body text-xs text-slate-500 mt-1">
                {t("detail.source", { source: sourceLabel })}
              </p>
            )}
          </div>
          <button
            onClick={onToggleFavorite}
            className="p-2 rounded-full hover:bg-slate-700/50 transition-colors cursor-pointer shrink-0"
            aria-label={t("detail.toggleFavorite")}
          >
            <Heart
              size={22}
              className={isFavorite ? "fill-red-500 text-red-500" : "text-slate-400"}
            />
          </button>
        </div>

        {/* Product images */}
        {(food.image_url || food.image_nutrition_url) && (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {food.image_url && (
              <button onClick={() => setViewingImage(food.image_url)} className="shrink-0 cursor-pointer">
                <Image
                  src={food.image_url}
                  alt={food.name}
                  width={96}
                  height={96}
                  unoptimized
                  className="w-24 h-24 object-cover rounded-lg"
                />
              </button>
            )}
            {food.image_nutrition_url && (
              <button onClick={() => setViewingImage(food.image_nutrition_url)} className="shrink-0 cursor-pointer">
                <Image
                  src={food.image_nutrition_url}
                  alt={t("detail.nutritionLabel")}
                  width={96}
                  height={96}
                  unoptimized
                  className="w-24 h-24 object-cover rounded-lg"
                />
              </button>
            )}
          </div>
        )}

        {/* Image viewer overlay */}
        {viewingImage && (
          <div
            data-swipe-block
            className="fixed inset-0 z-9999 bg-black/90 flex items-center justify-center cursor-pointer"
            onClick={() => setViewingImage(null)}
          >
            <Image
              src={viewingImage}
              alt=""
              width={800}
              height={800}
              unoptimized
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        )}

        {/* Serving size input */}
        <div className="grid grid-cols-2 gap-3">
          <CustomInput
            label={t("detail.servingSize")}
            value={servingSizeG}
            setValue={setServingSizeG}
            type="number"
            inputMode="decimal"
            min="0"
          />
          <CustomInput
            label={t("detail.quantity")}
            value={quantity}
            setValue={setQuantity}
            type="number"
            inputMode="decimal"
            min="0"
          />
        </div>

        {/* Calculated nutrition */}
        <NutritionInfo
          calories={calculated.calories}
          protein={calculated.protein}
          carbs={calculated.carbs}
          fat={calculated.fat}
          saturatedFat={calculated.saturatedFat}
          sugar={calculated.sugar}
          fiber={calculated.fiber}
          sodium={calculated.sodium}
          per100g={false}
        />

        {/* Detailed nutrients (only for foods in local DB) */}
        {food.id && (
          <DetailedNutrients foodId={food.id} scale={(servingSizeNum * quantityNum) / 100} />
        )}

        {/* Meal type picker */}
        <MealTypePicker
          selected={mealType}
          onSelect={setMealType}
          customTypes={customMealTypes}
        />

        </div>

        {/* Log button */}
        <button
          onClick={handleLog}
          className="btn-save w-full mt-2 mb-4"
          disabled={servingSizeNum <= 0 || quantityNum <= 0}
        >
          {t("detail.logFood")}
        </button>
      </div>
    </Modal>
  );
}
