import { View, FlatList } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useSavedMeals } from "@/features/nutrition/hooks/useSavedMeals";
import { useTranslation } from "react-i18next";
import { Plus, Pencil } from "lucide-react-native";
import type { SavedMeal } from "@/database/nutrition/get-saved-meals";

type SavedMealsListProps = {
  onCreate: () => void;
  onEdit: (meal: SavedMeal) => void;
  onLog: (meal: SavedMeal) => void;
};

export default function SavedMealsList({ onCreate, onEdit, onLog }: SavedMealsListProps) {
  const { t } = useTranslation("nutrition");
  const { data: meals, isLoading } = useSavedMeals();

  const getTotalCalories = (meal: SavedMeal) =>
    meal.items.reduce((sum, item) => {
      return sum + (item.calories_per_100g * item.serving_size_g * item.quantity) / 100;
    }, 0);

  if (isLoading) {
    return (
      <BodyText className="text-center mt-10">{t("daily.title")}</BodyText>
    );
  }

  if (!meals || meals.length === 0) {
    return (
      <View className="items-center py-10">
        <AppText className="text-base mb-2">{t("savedMeals.noMeals")}</AppText>
        <BodyText className="text-sm text-center mb-6">{t("savedMeals.noMealsDesc")}</BodyText>
        <AnimatedButton onPress={onCreate} className="btn-add py-3 px-6">
          <View className="flex-row items-center gap-2">
            <Plus size={18} color="#60a5fa" />
            <AppText className="text-sm">{t("savedMeals.create")}</AppText>
          </View>
        </AnimatedButton>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <AnimatedButton onPress={onCreate} className="btn-add py-3 mb-4">
        <View className="flex-row items-center justify-center gap-2">
          <Plus size={18} color="#60a5fa" />
          <AppText className="text-sm">{t("savedMeals.create")}</AppText>
        </View>
      </AnimatedButton>

      <FlatList
        data={meals}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: meal }) => {
          const totalCal = Math.round(getTotalCalories(meal));
          const itemCount = meal.items.length;

          return (
            <View className="flex-row items-center py-3 border-b border-slate-700/50">
              <AnimatedButton onPress={() => onEdit(meal)} className="flex-1 mr-3">
                <AppText className="text-sm" numberOfLines={1}>{meal.name}</AppText>
                <BodyTextNC className="text-xs text-slate-400">
                  {itemCount} {itemCount === 1 ? t("savedMeals.item") : t("savedMeals.items")} · {totalCal} kcal
                </BodyTextNC>
              </AnimatedButton>
              <View className="flex-row items-center gap-4">
                <AnimatedButton onPress={() => onEdit(meal)} hitSlop={8}>
                  <Pencil size={16} color="#94a3b8" />
                </AnimatedButton>
                <AnimatedButton onPress={() => onLog(meal)} className="btn-start px-3 py-1.5">
                  <AppText className="text-xs">{t("savedMeals.logMeal")}</AppText>
                </AnimatedButton>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
