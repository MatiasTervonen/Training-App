import { useState, useCallback } from "react";
import { View, TextInput, Keyboard, Pressable } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import PageContainer from "@/components/PageContainer";
import FoodSearchList from "@/features/nutrition/components/FoodSearchList";
import FoodDetailSheet from "@/features/nutrition/components/FoodDetailSheet";
import BarcodeScannerModal from "@/features/nutrition/components/BarcodeScannerModal";
import FavoriteFoodsList from "@/features/nutrition/components/FavoriteFoodsList";
import RecentFoodsList from "@/features/nutrition/components/RecentFoodsList";
import CustomFoodForm from "@/features/nutrition/components/CustomFoodForm";
import { useFoodSearch } from "@/features/nutrition/hooks/useFoodSearch";
import { useBarcodeLookup } from "@/features/nutrition/hooks/useBarcodeLookup";
import { useLogFood } from "@/features/nutrition/hooks/useLogFood";
import { useToggleFavorite } from "@/features/nutrition/hooks/useToggleFavorite";
import { useFavorites } from "@/features/nutrition/hooks/useFavorites";
import { useNutritionGoals } from "@/features/nutrition/hooks/useNutritionGoals";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams } from "expo-router";
import { Search, ScanLine, Heart, Clock, PenLine } from "lucide-react-native";
import Toast from "react-native-toast-message";
import type { NutritionSearchResult } from "@/features/nutrition/hooks/useFoodSearch";

type Tab = "search" | "scan" | "favorites" | "recent" | "custom";

export default function LogFoodScreen() {
  const { t } = useTranslation("nutrition");
  const { date } = useLocalSearchParams<{ date: string }>();
  const loggedAt = date || new Date().toLocaleDateString("en-CA");

  const [activeTab, setActiveTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<NutritionSearchResult | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const { results, isSearching } = useFoodSearch(query);
  const { lookup, isLooking } = useBarcodeLookup();
  const { handleLogFood, isLogging } = useLogFood();
  const { handleToggle } = useToggleFavorite();
  const { data: favorites } = useFavorites();
  const { data: goals } = useNutritionGoals();

  const customMealTypes = goals?.custom_meal_types ?? [];

  const isFavorite = useCallback(
    (food: NutritionSearchResult) => {
      if (!favorites) return false;
      if (food.is_custom) {
        return favorites.some((f) => f.custom_food_id === food.id);
      }
      return favorites.some((f) => f.food_id === food.id);
    },
    [favorites],
  );

  const handleSelectFood = (food: NutritionSearchResult) => {
    setSelectedFood(food);
    setShowDetail(true);
  };

  const handleBarcodeScan = async (barcode: string) => {
    setShowScanner(false);
    const result = await lookup(barcode);
    if (result) {
      setSelectedFood(result);
      setShowDetail(true);
    } else {
      Toast.show({
        type: "info",
        text1: t("log.notFound"),
        text2: t("log.notFoundDesc"),
      });
    }
  };

  const handleLog = (params: {
    food: NutritionSearchResult;
    servingSizeG: number;
    quantity: number;
    mealType: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => {
    handleLogFood({
      foodId: params.food.is_custom ? null : params.food.id,
      customFoodId: params.food.is_custom ? params.food.id : null,
      foodName: params.food.name,
      mealType: params.mealType,
      servingSizeG: params.servingSizeG,
      quantity: params.quantity,
      calories: params.calories,
      protein: params.protein,
      carbs: params.carbs,
      fat: params.fat,
      loggedAt,
    });
    setShowDetail(false);
    setSelectedFood(null);
  };

  const handleToggleFavorite = () => {
    if (!selectedFood) return;
    handleToggle({
      foodId: selectedFood.is_custom ? null : selectedFood.id,
      customFoodId: selectedFood.is_custom ? selectedFood.id : null,
    });
  };

  const tabs: { id: Tab; label: string; icon: typeof Search }[] = [
    { id: "search", label: t("log.search"), icon: Search },
    { id: "scan", label: t("log.scan"), icon: ScanLine },
    { id: "favorites", label: t("log.favorites"), icon: Heart },
    { id: "recent", label: t("log.recent"), icon: Clock },
    { id: "custom", label: t("log.createCustom"), icon: PenLine },
  ];

  return (
    <Pressable onPress={Keyboard.dismiss} className="flex-1">
      <PageContainer>
        <AppText className="text-xl text-center mb-4">{t("log.title")}</AppText>

        {/* Tabs */}
        <View className="flex-row mb-4 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <AnimatedButton
                key={tab.id}
                onPress={() => {
                  if (tab.id === "scan") {
                    setShowScanner(true);
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`flex-1 items-center py-2 rounded-lg border ${
                  isActive
                    ? "bg-orange-500/20 border-orange-500/50"
                    : "bg-slate-800/50 border-slate-700/50"
                }`}
              >
                <Icon size={16} color={isActive ? "#f97316" : "#94a3b8"} />
                <AppText
                  className={`text-xs mt-1 ${isActive ? "" : "text-slate-400"}`}
                >
                  {tab.label}
                </AppText>
              </AnimatedButton>
            );
          })}
        </View>

        {/* Tab content */}
        {activeTab === "search" && (
          <View className="flex-1">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("log.searchPlaceholder")}
              placeholderTextColor="#9ca3af"
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm mb-4"
              autoFocus
            />
            <FoodSearchList
              results={results}
              isSearching={isSearching || isLooking}
              query={query}
              onSelect={handleSelectFood}
            />
          </View>
        )}

        {activeTab === "favorites" && (
          <FavoriteFoodsList onSelect={handleSelectFood} />
        )}

        {activeTab === "recent" && (
          <RecentFoodsList onSelect={handleSelectFood} />
        )}

        {activeTab === "custom" && (
          <CustomFoodForm onSaved={() => setActiveTab("search")} />
        )}
      </PageContainer>

      {/* Barcode scanner modal */}
      <BarcodeScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanned={handleBarcodeScan}
      />

      {/* Food detail bottom sheet */}
      <FoodDetailSheet
        food={selectedFood}
        visible={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedFood(null);
        }}
        onLog={handleLog}
        isFavorite={selectedFood ? isFavorite(selectedFood) : false}
        onToggleFavorite={handleToggleFavorite}
        customMealTypes={customMealTypes}
      />
    </Pressable>
  );
}
