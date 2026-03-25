import { useState, useEffect, useMemo } from "react";
import { View, Keyboard, Pressable } from "react-native";
import FullScreenModal from "@/components/FullScreenModal";
import PageContainer from "@/components/PageContainer";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import BodyTextNC from "@/components/BodyTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import NutritionInfo from "@/features/nutrition/components/NutritionInfo";
import MealTypePicker from "@/features/nutrition/components/MealTypePicker";
import { Heart } from "lucide-react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import ImageViewerModal from "@/features/notes/components/ImageViewerModal";

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
  apiSource?: "openfoodfacts" | "usda";
};

type FoodDetailSheetProps = {
  food: FoodForDetail | null;
  visible: boolean;
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

export default function FoodDetailSheet({
  food,
  visible,
  onClose,
  onLog,
  isFavorite,
  onToggleFavorite,
  customMealTypes,
  defaultMealType = "snack",
}: FoodDetailSheetProps) {
  const { t } = useTranslation("nutrition");

  const [servingSizeG, setServingSizeG] = useState("100");
  const [quantity, setQuantity] = useState("1");
  const [mealType, setMealType] = useState(defaultMealType);
  const [viewerIndex, setViewerIndex] = useState(-1);
  useEffect(() => {
    if (food) {
      setServingSizeG(String(food.serving_size_g));
      setQuantity("1");
      setMealType(defaultMealType);
    }
  }, [food, defaultMealType]);

  const servingG = parseFloat(servingSizeG) || 0;
  const qty = parseFloat(quantity) || 0;

  const calculatedCalories = food
    ? (food.calories_per_100g * servingG * qty) / 100
    : 0;
  const calculatedProtein = food
    ? (food.protein_per_100g * servingG * qty) / 100
    : 0;
  const calculatedCarbs = food
    ? (food.carbs_per_100g * servingG * qty) / 100
    : 0;
  const calculatedFat = food
    ? (food.fat_per_100g * servingG * qty) / 100
    : 0;

  const handleLog = () => {
    if (!food) return;

    onLog({
      food,
      servingSizeG: servingG,
      quantity: qty,
      mealType,
      calories: calculatedCalories,
      protein: calculatedProtein,
      carbs: calculatedCarbs,
      fat: calculatedFat,
    });
  };

  const images = useMemo(
    () => [
      ...(food?.image_url ? [{ id: "front", uri: food.image_url }] : []),
      ...(food?.image_nutrition_url ? [{ id: "label", uri: food.image_nutrition_url }] : []),
    ],
    [food?.image_url, food?.image_nutrition_url],
  );

  if (!food) return null;

  return (
    <FullScreenModal isOpen={visible} onClose={onClose}>
      <PageContainer className="justify-between">
        <Pressable onPress={Keyboard.dismiss}>
          {/* Header */}
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 mr-3">
              <AppText className="text-lg">{food.name}</AppText>
              {food.brand && (
                <BodyTextNC className="text-sm text-slate-400">
                  {food.brand}
                </BodyTextNC>
              )}
              {food.serving_description && (
                <BodyTextNC className="text-xs text-slate-500 mt-1">
                  {food.serving_description}
                </BodyTextNC>
              )}
            </View>
            <AnimatedButton onPress={onToggleFavorite} hitSlop={10}>
              <Heart
                size={24}
                color={isFavorite ? "#f97316" : "#64748b"}
                fill={isFavorite ? "#f97316" : "transparent"}
              />
            </AnimatedButton>
          </View>

          {/* Product images */}
          {(food.image_url || food.image_nutrition_url) && (
            <View className="flex-row gap-3 mb-4">
              {food.image_url && (
                <AnimatedButton onPress={() => setViewerIndex(0)}>
                  <Image
                    source={{ uri: food.image_url }}
                    className="w-24 h-24 rounded-lg"
                    contentFit="cover"
                  />
                </AnimatedButton>
              )}
              {food.image_nutrition_url && (
                <AnimatedButton onPress={() => setViewerIndex(food.image_url ? 1 : 0)}>
                  <Image
                    source={{ uri: food.image_nutrition_url }}
                    className="w-24 h-24 rounded-lg"
                    contentFit="cover"
                  />
                </AnimatedButton>
              )}
            </View>
          )}

          {/* Nutrition per 100g */}
          <View className="mb-4">
            <NutritionInfo
              calories={food.calories_per_100g}
              protein={food.protein_per_100g}
              carbs={food.carbs_per_100g}
              fat={food.fat_per_100g}
              saturatedFat={food.saturated_fat_per_100g}
              sugar={food.sugar_per_100g}
              fiber={food.fiber_per_100g}
              sodium={food.sodium_per_100g}
              per100g
            />
          </View>

          {/* Serving size input */}
          <View className="mb-4">
            <AppInput
              value={servingSizeG}
              setValue={setServingSizeG}
              label={t("detail.servingSize")}
              keyboardType="decimal-pad"
              placeholder="100"
            />
          </View>

          {/* Quantity input */}
          <View className="mb-4">
            <AppInput
              value={quantity}
              setValue={setQuantity}
              label={t("detail.quantity")}
              keyboardType="decimal-pad"
              placeholder="1"
            />
          </View>

          {/* Calculated nutrition */}
          <View className="mb-4">
            <NutritionInfo
              calories={calculatedCalories}
              protein={calculatedProtein}
              carbs={calculatedCarbs}
              fat={calculatedFat}
              per100g={false}
            />
          </View>

          {/* Meal type picker */}
          <View className="mb-4">
            <MealTypePicker
              selected={mealType}
              onSelect={setMealType}
              customTypes={customMealTypes}
            />
          </View>

        </Pressable>

        {/* Log button at bottom */}
        <AnimatedButton
          onPress={handleLog}
          className="btn-save py-3 mt-6"
          label={t("detail.logFood")}
        />
      </PageContainer>

      {images.length > 0 && viewerIndex >= 0 && (
        <ImageViewerModal
          images={images}
          initialIndex={viewerIndex}
          visible={viewerIndex >= 0}
          onClose={() => setViewerIndex(-1)}
        />
      )}
    </FullScreenModal>
  );
}
