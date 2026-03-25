import { View, FlatList, ActivityIndicator } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import { NutritionSearchResult } from "@/features/nutrition/hooks/useFoodSearch";
import { useTranslation } from "react-i18next";

const CONTENT_CONTAINER_STYLE = { paddingBottom: 100 };

type FoodSearchListProps = {
  results: NutritionSearchResult[];
  isSearching: boolean;
  query: string;
  onSelect: (food: NutritionSearchResult) => void;
};

export default function FoodSearchList({
  results,
  isSearching,
  query,
  onSelect,
}: FoodSearchListProps) {
  const { t } = useTranslation("nutrition");

  if (isSearching) {
    return (
      <View className="items-center py-10">
        <ActivityIndicator />
        <BodyText className="text-sm mt-2">{t("log.searching")}</BodyText>
      </View>
    );
  }

  if (query.length > 0 && results.length === 0) {
    return (
      <View className="items-center py-10 px-6">
        <AppText className="text-base mb-2">{t("log.noResults")}</AppText>
        <BodyText className="text-sm text-center">
          {t("log.noResultsDesc")}
        </BodyText>
      </View>
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={(item, index) => item.barcode ?? item.id ?? `${index}`}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={CONTENT_CONTAINER_STYLE}
      renderItem={({ item }) => (
        <AnimatedButton
          onPress={() => onSelect(item)}
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
