import { View, FlatList } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useRecentFoods } from "@/features/nutrition/hooks/useRecentFoods";
import { NutritionSearchResult } from "@/features/nutrition/hooks/useFoodSearch";
import { RecentFood } from "@/database/nutrition/get-recent-foods";
import { useTranslation } from "react-i18next";

type RecentFoodsListProps = {
  onSelect: (food: NutritionSearchResult) => void;
};

function mapRecentToSearchResult(recent: RecentFood): NutritionSearchResult {
  return {
    id: recent.food_id ?? recent.custom_food_id,
    name: recent.name,
    brand: recent.brand,
    calories_per_100g: recent.calories_per_100g,
    protein_per_100g: recent.protein_per_100g,
    carbs_per_100g: recent.carbs_per_100g,
    fat_per_100g: recent.fat_per_100g,
    serving_size_g: recent.serving_size_g,
    serving_description: recent.serving_description,
    image_url: recent.image_url,
    barcode: recent.barcode,
    is_custom: recent.is_custom,
    source: recent.is_custom ? "custom" : "local",
  };
}

export default function RecentFoodsList({ onSelect }: RecentFoodsListProps) {
  const { t } = useTranslation("nutrition");
  const { data: recentFoods, isLoading } = useRecentFoods();

  if (isLoading) {
    return (
      <View className="items-center py-10">
        <BodyText className="text-sm">{t("log.searching")}</BodyText>
      </View>
    );
  }

  if (!recentFoods || recentFoods.length === 0) {
    return (
      <View className="items-center py-10 px-6">
        <AppText className="text-base mb-2">{t("log.noRecent")}</AppText>
        <BodyText className="text-sm text-center">
          {t("log.noRecentDesc")}
        </BodyText>
      </View>
    );
  }

  return (
    <FlatList
      data={recentFoods}
      keyExtractor={(item) =>
        item.food_id ?? item.custom_food_id ?? item.name
      }
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <AnimatedButton
          onPress={() => onSelect(mapRecentToSearchResult(item))}
          className="px-4 py-3 border-b border-slate-700/50"
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-1 mr-3">
              <AppText className="text-sm" numberOfLines={1}>
                {item.name}
              </AppText>
              {item.brand && (
                <BodyTextNC
                  className="text-xs text-slate-400"
                  numberOfLines={1}
                >
                  {item.brand}
                </BodyTextNC>
              )}
            </View>
            <BodyTextNC className="text-sm text-slate-400">
              {Math.round(item.calories_per_100g)} kcal
            </BodyTextNC>
          </View>
        </AnimatedButton>
      )}
    />
  );
}
