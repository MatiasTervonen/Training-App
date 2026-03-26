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

  // Show spinner only when searching AND there are no results to display
  // (when results exist from a previous query, keep showing them via keepPreviousData)
  if (isSearching && results.length === 0) {
    return (
      <View className="items-center py-10">
        <ActivityIndicator />
        <BodyText className="text-sm mt-2">{t("log.searching")}</BodyText>
      </View>
    );
  }

  // Only show "no results" when the query meets the search threshold (2+ chars)
  // and we're not mid-search
  if (query.trim().length >= 2 && !isSearching && results.length === 0) {
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
      keyExtractor={(item, index) =>
        `${item.source}-${item.barcode ?? item.id ?? index}`
      }
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={CONTENT_CONTAINER_STYLE}
      ListHeaderComponent={
        isSearching ? (
          <View className="items-center py-2">
            <ActivityIndicator size="small" />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <AnimatedButton
          onPress={() => onSelect(item)}
          className="px-4 py-3 border-b border-slate-700/50"
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-1 mr-3">
              <BodyText className="text-sm" numberOfLines={1}>
                {item.name}
              </BodyText>
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
