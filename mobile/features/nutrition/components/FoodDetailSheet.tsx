import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { View, TextInput, Keyboard, Pressable } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import NutritionInfo from "@/features/nutrition/components/NutritionInfo";
import MealTypePicker from "@/features/nutrition/components/MealTypePicker";
import { Heart } from "lucide-react-native";
import { useTranslation } from "react-i18next";

type FoodForDetail = {
  id: string | null;
  name: string;
  brand: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  serving_size_g: number;
  serving_description: string | null;
  is_custom: boolean;
  barcode: string | null;
  image_url?: string | null;
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
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["75%", "90%"], []);
  const { t } = useTranslation("nutrition");

  const [servingSizeG, setServingSizeG] = useState("100");
  const [quantity, setQuantity] = useState("1");
  const [mealType, setMealType] = useState(defaultMealType);

  // Reset state when food changes
  useEffect(() => {
    if (food) {
      setServingSizeG(String(food.serving_size_g));
      setQuantity("1");
      setMealType(defaultMealType);
    }
  }, [food, defaultMealType]);

  // Present/dismiss sheet based on visibility
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

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

  if (!food) return null;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onDismiss={onClose}
      enablePanDownToClose
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: "#0f172a" }}
      handleIndicatorStyle={{ backgroundColor: "#475569" }}
    >
      <Pressable onPress={Keyboard.dismiss} className="flex-1">
        <BottomSheetScrollView
          contentContainerClassName="px-4 pb-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row justify-between items-start mb-4">
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

          {/* Nutrition per 100g */}
          <View className="mb-4">
            <NutritionInfo
              calories={food.calories_per_100g}
              protein={food.protein_per_100g}
              carbs={food.carbs_per_100g}
              fat={food.fat_per_100g}
              per100g
            />
          </View>

          {/* Serving size input */}
          <View className="mb-4">
            <AppText className="text-sm mb-2">
              {t("detail.servingSize")}
            </AppText>
            <TextInput
              value={servingSizeG}
              onChangeText={setServingSizeG}
              keyboardType="decimal-pad"
              placeholderTextColor="#9ca3af"
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
            />
          </View>

          {/* Quantity input */}
          <View className="mb-4">
            <AppText className="text-sm mb-2">{t("detail.quantity")}</AppText>
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              placeholderTextColor="#9ca3af"
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
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
          <View className="mb-6">
            <MealTypePicker
              selected={mealType}
              onSelect={setMealType}
              customTypes={customMealTypes}
            />
          </View>

          {/* Log button */}
          <AnimatedButton
            onPress={handleLog}
            className="btn-base py-3"
            label={t("detail.logFood")}
          />
        </BottomSheetScrollView>
      </Pressable>
    </BottomSheetModal>
  );
}
