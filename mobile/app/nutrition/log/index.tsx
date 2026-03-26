import { useState, useCallback, useMemo } from "react";
import { View, TextInput, Keyboard, Pressable } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import PageContainer from "@/components/PageContainer";
import FoodSearchList from "@/features/nutrition/components/FoodSearchList";
import FoodDetailSheet from "@/features/nutrition/components/FoodDetailSheet";
import BarcodeScannerModal from "@/features/nutrition/components/BarcodeScannerModal";
import FavoriteFoodsList from "@/features/nutrition/components/FavoriteFoodsList";
import RecentFoodsList from "@/features/nutrition/components/RecentFoodsList";
import CustomFoodForm from "@/features/nutrition/components/CustomFoodForm";
import SavedMealsList from "@/features/nutrition/components/SavedMealsList";
import CreateEditMealModal from "@/features/nutrition/components/CreateEditMealModal";
import LogSavedMealSheet from "@/features/nutrition/components/LogSavedMealSheet";
import { useFoodSearch } from "@/features/nutrition/hooks/useFoodSearch";
import { useBarcodeLookup } from "@/features/nutrition/hooks/useBarcodeLookup";
import { useLogFood } from "@/features/nutrition/hooks/useLogFood";
import { useToggleFavorite } from "@/features/nutrition/hooks/useToggleFavorite";
import { useFavorites } from "@/features/nutrition/hooks/useFavorites";
import { useNutritionGoals } from "@/features/nutrition/hooks/useNutritionGoals";
import { useSaveMeal } from "@/features/nutrition/hooks/useSaveMeal";
import { useDeleteSavedMeal } from "@/features/nutrition/hooks/useDeleteSavedMeal";
import { useLogSavedMeal } from "@/features/nutrition/hooks/useLogSavedMeal";
import { saveSharedFood } from "@/database/nutrition/save-shared-food";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams } from "expo-router";
import { Search, ScanLine, Heart, Clock, PenLine, UtensilsCrossed } from "lucide-react-native";
import type { NutritionSearchResult } from "@/features/nutrition/hooks/useFoodSearch";
import { getTrackingDate } from "@/lib/formatDate";
import type { SavedMeal } from "@/database/nutrition/get-saved-meals";

type Tab = "search" | "scan" | "favorites" | "recent" | "custom" | "meals";

export default function LogFoodScreen() {
  const { t } = useTranslation("nutrition");
  const { date } = useLocalSearchParams<{ date: string }>();
  const loggedAt = date || getTrackingDate();

  const [activeTab, setActiveTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<NutritionSearchResult | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [showCreateMeal, setShowCreateMeal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<SavedMeal | null>(null);
  const [loggingMeal, setLoggingMeal] = useState<SavedMeal | null>(null);

  const { results, isSearching } = useFoodSearch(query);
  const { lookup, isLooking } = useBarcodeLookup();
  const { handleLogFood } = useLogFood();
  const { handleToggle } = useToggleFavorite();
  const { data: favorites } = useFavorites();
  const { data: goals } = useNutritionGoals();
  const { handleSaveMeal, isSaving: isSavingMeal } = useSaveMeal();
  const { handleDeleteMeal } = useDeleteSavedMeal();
  const { handleLogMeal } = useLogSavedMeal();

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
    setNotFoundBarcode(null);
    const result = await lookup(barcode);
    if (result) {
      setSelectedFood(result);
      setShowDetail(true);
    } else {
      setNotFoundBarcode(barcode);
      setActiveTab("custom");
    }
  };

  const handleLog = async (params: {
    food: NutritionSearchResult;
    servingSizeG: number;
    quantity: number;
    mealType: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => {
    let foodId = params.food.is_custom ? null : params.food.id;
    const customFoodId = params.food.is_custom ? params.food.id : null;

    // Cache API result before logging so we have a food_id
    if (params.food.source === "api" && !foodId && params.food.barcode) {
      try {
        foodId = await saveSharedFood({
          barcode: params.food.barcode,
          name: params.food.name,
          brand: params.food.brand,
          servingSizeG: params.food.serving_size_g,
          servingDescription: params.food.serving_description,
          caloriesPer100g: params.food.calories_per_100g,
          proteinPer100g: params.food.protein_per_100g,
          carbsPer100g: params.food.carbs_per_100g,
          fatPer100g: params.food.fat_per_100g,
          fiberPer100g: params.food.fiber_per_100g,
          sugarPer100g: params.food.sugar_per_100g,
          sodiumPer100g: params.food.sodium_per_100g,
          saturatedFatPer100g: params.food.saturated_fat_per_100g,
          imageUrl: params.food.image_url,
          nutritionLabelUrl: params.food.image_nutrition_url ?? null,
          source: params.food.apiSource ?? "openfoodfacts",
        });
      } catch {
        // Save failed — log without food_id
      }
    }

    await handleLogFood({
      foodId,
      customFoodId,
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
  };

  const handleToggleFavorite = () => {
    if (!selectedFood) return;
    handleToggle({
      foodId: selectedFood.is_custom ? null : selectedFood.id,
      customFoodId: selectedFood.is_custom ? selectedFood.id : null,
    });
  };

  const tabs = useMemo<{ id: Tab; label: string; icon: typeof Search }[]>(
    () => [
      { id: "search", label: t("log.search"), icon: Search },
      { id: "scan", label: t("log.scan"), icon: ScanLine },
      { id: "favorites", label: t("log.favorites"), icon: Heart },
      { id: "recent", label: t("log.recent"), icon: Clock },
      { id: "custom", label: t("log.custom"), icon: PenLine },
      { id: "meals", label: t("log.meals"), icon: UtensilsCrossed },
    ],
    [t],
  );

  const renderTabs = () => (
    <View className="mb-6 gap-2 pb-4 border-b border-slate-700/50">
      <View className="flex-row gap-2">
        {tabs.slice(0, 3).map((tab) => {
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
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg border ${
                isActive
                  ? "bg-fuchsia-500/20 border-fuchsia-500/50"
                  : "bg-slate-800/50 border-slate-700/50"
              }`}
            >
              <Icon size={14} color={isActive ? "#ff00ff" : "#94a3b8"} />
              <AppText className={`text-xs ${isActive ? "" : "text-slate-400"}`}>
                {tab.label}
              </AppText>
            </AnimatedButton>
          );
        })}
      </View>
      <View className="flex-row gap-2">
        {tabs.slice(3).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <AnimatedButton
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg border ${
                isActive
                  ? "bg-fuchsia-500/20 border-fuchsia-500/50"
                  : "bg-slate-800/50 border-slate-700/50"
              }`}
            >
              <Icon size={14} color={isActive ? "#ff00ff" : "#94a3b8"} />
              <AppText className={`text-xs ${isActive ? "" : "text-slate-400"}`}>
                {tab.label}
              </AppText>
            </AnimatedButton>
          );
        })}
      </View>
    </View>
  );

  // Custom tab uses KeyboardAwareScrollView wrapping PageContainer (same pattern as notes)
  if (activeTab === "custom") {
    return (
      <View className="flex-1">
        <KeyboardAwareScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          bottomOffset={50}
          showsVerticalScrollIndicator={false}
        >
          <PageContainer>
            <AppText className="text-xl text-center mb-4">{t("log.title")}</AppText>
            {renderTabs()}
            <CustomFoodForm barcode={notFoundBarcode} onSaved={() => { setNotFoundBarcode(null); setActiveTab("search"); }} />
          </PageContainer>
        </KeyboardAwareScrollView>
      </View>
    );
  }

  // Other tabs: no keyboard scroll needed
  return (
    <View className="flex-1">
      <Pressable onPress={Keyboard.dismiss} className="px-5 pt-5">
        <AppText className="text-xl text-center mb-4">{t("log.title")}</AppText>
        {renderTabs()}
      </Pressable>

      <View className="flex-1 px-5">
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

        {activeTab === "meals" && (
          <SavedMealsList
            onCreate={() => { setEditingMeal(null); setShowCreateMeal(true); }}
            onEdit={(meal) => { setEditingMeal(meal); setShowCreateMeal(true); }}
            onLog={(meal) => setLoggingMeal(meal)}
          />
        )}
      </View>

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

      {/* Create/Edit meal modal */}
      <CreateEditMealModal
        visible={showCreateMeal}
        onClose={() => { setShowCreateMeal(false); setEditingMeal(null); }}
        onSave={async (params) => {
          await handleSaveMeal(params);
          setShowCreateMeal(false);
          setEditingMeal(null);
        }}
        onDelete={async (mealId) => {
          await handleDeleteMeal(mealId);
          setShowCreateMeal(false);
          setEditingMeal(null);
        }}
        editingMeal={editingMeal}
        isSaving={isSavingMeal}
      />

      {/* Log saved meal sheet */}
      <LogSavedMealSheet
        meal={loggingMeal}
        visible={!!loggingMeal}
        onClose={() => setLoggingMeal(null)}
        customMealTypes={customMealTypes}
        onLog={async (params) => {
          await handleLogMeal({ ...params, loggedAt });
          setLoggingMeal(null);
        }}
      />
    </View>
  );
}
