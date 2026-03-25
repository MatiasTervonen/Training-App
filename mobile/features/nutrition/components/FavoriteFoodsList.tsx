import { View, FlatList } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useFavorites } from "@/features/nutrition/hooks/useFavorites";
import { NutritionSearchResult } from "@/features/nutrition/hooks/useFoodSearch";
import { FavoriteFood } from "@/database/nutrition/get-favorites";
import { useTranslation } from "react-i18next";

type FavoriteFoodsListProps = {
  onSelect: (food: NutritionSearchResult) => void;
};

function mapFavoriteToSearchResult(fav: FavoriteFood): NutritionSearchResult {
  return {
    id: fav.food_id ?? fav.custom_food_id,
    name: fav.name,
    brand: fav.brand,
    calories_per_100g: fav.calories_per_100g,
    protein_per_100g: fav.protein_per_100g,
    carbs_per_100g: fav.carbs_per_100g,
    fat_per_100g: fav.fat_per_100g,
    saturated_fat_per_100g: null,
    sugar_per_100g: null,
    fiber_per_100g: null,
    sodium_per_100g: null,
    serving_size_g: fav.serving_size_g,
    serving_description: fav.serving_description,
    image_url: fav.image_url,
    image_nutrition_url: null,
    barcode: fav.barcode,
    is_custom: fav.is_custom,
    source: fav.is_custom ? "custom" : "local",
  };
}

export default function FavoriteFoodsList({
  onSelect,
}: FavoriteFoodsListProps) {
  const { t } = useTranslation("nutrition");
  const { data: favorites, isLoading } = useFavorites();

  if (isLoading) {
    return (
      <View className="items-center py-10">
        <BodyText className="text-sm">{t("log.searching")}</BodyText>
      </View>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <View className="items-center py-10 px-6">
        <AppText className="text-base mb-2">{t("log.noFavorites")}</AppText>
        <BodyText className="text-sm text-center">
          {t("log.noFavoritesDesc")}
        </BodyText>
      </View>
    );
  }

  return (
    <FlatList
      data={favorites}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <AnimatedButton
          onPress={() => onSelect(mapFavoriteToSearchResult(item))}
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
