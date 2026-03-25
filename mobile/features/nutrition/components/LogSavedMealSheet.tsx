import { useState, useEffect } from "react";
import { View } from "react-native";
import FullScreenModal from "@/components/FullScreenModal";
import PageContainer from "@/components/PageContainer";
import AppText from "@/components/AppText";
import BodyTextNC from "@/components/BodyTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import NutritionInfo from "@/features/nutrition/components/NutritionInfo";
import MealTypePicker from "@/features/nutrition/components/MealTypePicker";
import { useTranslation } from "react-i18next";
import type { SavedMeal } from "@/database/nutrition/get-saved-meals";

type LogSavedMealSheetProps = {
  meal: SavedMeal | null;
  visible: boolean;
  onClose: () => void;
  onLog: (params: { savedMealId: string; mealType: string }) => void;
  customMealTypes: string[];
  defaultMealType?: string;
};

export default function LogSavedMealSheet({
  meal,
  visible,
  onClose,
  onLog,
  customMealTypes,
  defaultMealType = "snack",
}: LogSavedMealSheetProps) {
  const { t } = useTranslation("nutrition");
  const [mealType, setMealType] = useState(defaultMealType);

  useEffect(() => {
    if (visible) {
      setMealType(defaultMealType);
    }
  }, [visible, defaultMealType]);

  if (!meal) return null;

  const totals = meal.items.reduce(
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

  return (
    <FullScreenModal isOpen={visible} onClose={onClose}>
      <PageContainer className="justify-between">
        <View>
          <AppText className="text-xl text-center mb-4">{meal.name}</AppText>

          {/* Items list */}
          <View className="mb-4">
            {meal.items.map((item) => {
              const cal = Math.round((item.calories_per_100g * item.serving_size_g * item.quantity) / 100);
              return (
                <View key={item.id} className="flex-row items-center justify-between py-2 border-b border-slate-700/50">
                  <View className="flex-1 mr-3">
                    <AppText className="text-sm" numberOfLines={1}>{item.food_name}</AppText>
                    <BodyTextNC className="text-xs text-slate-500">
                      {item.serving_size_g}g × {item.quantity}
                    </BodyTextNC>
                  </View>
                  <BodyTextNC className="text-sm text-slate-400">{cal} kcal</BodyTextNC>
                </View>
              );
            })}
          </View>

          {/* Total nutrition */}
          <View className="mb-4">
            <NutritionInfo
              calories={totals.calories}
              protein={totals.protein}
              carbs={totals.carbs}
              fat={totals.fat}
              per100g={false}
            />
          </View>

        </View>

        {/* Meal type picker + Log button */}
        <View>
          <View className="mb-4">
            <MealTypePicker
              selected={mealType}
              onSelect={setMealType}
              customTypes={customMealTypes}
            />
          </View>
          <AnimatedButton
            onPress={() => onLog({ savedMealId: meal.id, mealType })}
            className="btn-save py-3"
            label={t("savedMeals.logMeal")}
          />
        </View>
      </PageContainer>
    </FullScreenModal>
  );
}
