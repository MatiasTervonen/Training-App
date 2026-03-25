import { useState, useEffect, useCallback, useMemo } from "react";
import { View, TextInput, Keyboard, Pressable, Alert } from "react-native";
import FullScreenModal from "@/components/FullScreenModal";
import PageContainer from "@/components/PageContainer";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import BodyTextNC from "@/components/BodyTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import NutritionInfo from "@/features/nutrition/components/NutritionInfo";
import FoodSearchList from "@/features/nutrition/components/FoodSearchList";
import FavoriteFoodsList from "@/features/nutrition/components/FavoriteFoodsList";
import RecentFoodsList from "@/features/nutrition/components/RecentFoodsList";
import BarcodeScannerModal from "@/features/nutrition/components/BarcodeScannerModal";
import { useFoodSearch } from "@/features/nutrition/hooks/useFoodSearch";
import { useBarcodeLookup } from "@/features/nutrition/hooks/useBarcodeLookup";
import { saveSharedFood } from "@/database/nutrition/save-shared-food";
import useSaveMealDraft from "@/features/nutrition/hooks/useSaveMealDraft";
import { useTranslation } from "react-i18next";
import { Plus, X, Search, ScanLine, Heart, Clock } from "lucide-react-native";
import Toast from "react-native-toast-message";
import type { SavedMeal } from "@/database/nutrition/get-saved-meals";
import type { NutritionSearchResult } from "@/features/nutrition/hooks/useFoodSearch";

type MealBuilderItem = {
  localId: string;
  food_id: string | null;
  custom_food_id: string | null;
  food_name: string;
  brand: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  serving_size_g: number;
  quantity: number;
};

type CreateEditMealModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (params: {
    mealId?: string;
    name: string;
    items: {
      food_id: string | null;
      custom_food_id: string | null;
      serving_size_g: number;
      quantity: number;
      sort_order: number;
    }[];
  }) => void;
  onDelete?: (mealId: string) => void;
  editingMeal?: SavedMeal | null;
  isSaving: boolean;
};

type AddFoodTab = "search" | "scan" | "favorites" | "recent";

export default function CreateEditMealModal({
  visible,
  onClose,
  onSave,
  onDelete,
  editingMeal,
  isSaving,
}: CreateEditMealModalProps) {
  const { t } = useTranslation("nutrition");
  const { t: tCommon } = useTranslation();

  const [name, setName] = useState("");
  const [items, setItems] = useState<MealBuilderItem[]>([]);
  const [showAddFood, setShowAddFood] = useState(false);
  const [addFoodTab, setAddFoodTab] = useState<AddFoodTab>("search");
  const [searchQuery, setSearchQuery] = useState("");

  const { results, isSearching } = useFoodSearch(searchQuery);
  const { lookup } = useBarcodeLookup();
  const [showScanner, setShowScanner] = useState(false);

  const { clearDraft } = useSaveMealDraft({
    name,
    items,
    editingMealId: editingMeal?.id,
    setName,
    setItems,
  });

  // Populate when editing (overrides draft)
  useEffect(() => {
    if (editingMeal) {
      setName(editingMeal.name);
      setItems(
        editingMeal.items.map((item) => ({
          localId: item.id,
          food_id: item.food_id,
          custom_food_id: item.custom_food_id,
          food_name: item.food_name,
          brand: item.brand,
          calories_per_100g: item.calories_per_100g,
          protein_per_100g: item.protein_per_100g,
          carbs_per_100g: item.carbs_per_100g,
          fat_per_100g: item.fat_per_100g,
          serving_size_g: item.serving_size_g,
          quantity: item.quantity,
        })),
      );
    }
    setShowAddFood(false);
    setSearchQuery("");
  }, [editingMeal, visible]);

  const handleAddFood = useCallback(async (food: NutritionSearchResult) => {
    let foodId = food.is_custom ? null : food.id;
    const customFoodId = food.is_custom ? food.id : null;

    // Cache API result so we have a food_id
    if (food.source === "api" && !foodId && food.barcode) {
      try {
        foodId = await saveSharedFood({
          barcode: food.barcode,
          name: food.name,
          brand: food.brand,
          servingSizeG: food.serving_size_g,
          servingDescription: food.serving_description,
          caloriesPer100g: food.calories_per_100g,
          proteinPer100g: food.protein_per_100g,
          carbsPer100g: food.carbs_per_100g,
          fatPer100g: food.fat_per_100g,
          fiberPer100g: null,
          sugarPer100g: null,
          sodiumPer100g: null,
          saturatedFatPer100g: null,
          imageUrl: food.image_url,
          nutritionLabelUrl: food.image_nutrition_url ?? null,
        });
      } catch {
        // Cache failed — skip this food
        return;
      }
    }

    setItems((prev) => [
      ...prev,
      {
        localId: `${Date.now()}-${Math.random()}`,
        food_id: foodId,
        custom_food_id: customFoodId,
        food_name: food.name,
        brand: food.brand,
        calories_per_100g: food.calories_per_100g,
        protein_per_100g: food.protein_per_100g,
        carbs_per_100g: food.carbs_per_100g,
        fat_per_100g: food.fat_per_100g,
        serving_size_g: food.serving_size_g,
        quantity: 1,
      },
    ]);
    setShowAddFood(false);
    setSearchQuery("");
  }, []);

  const handleBarcodeScan = async (barcode: string) => {
    setShowScanner(false);
    const result = await lookup(barcode);
    if (result) {
      handleAddFood(result);
    } else {
      Toast.show({ type: "error", text1: t("log.notFound"), text2: t("log.notFoundDesc") });
    }
  };

  const removeItem = (localId: string) => {
    Alert.alert(
      tCommon("deleteButton.confirmDeleteTitle"),
      tCommon("deleteButton.confirmDeleteMessage"),
      [
        { text: tCommon("common.cancel"), style: "cancel" },
        { text: tCommon("common.delete"), style: "destructive", onPress: () => setItems((prev) => prev.filter((i) => i.localId !== localId)) },
      ],
    );
  };

  const updateItem = (localId: string, field: "serving_size_g" | "quantity", value: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.localId === localId ? { ...i, [field]: parseFloat(value) || 0 } : i,
      ),
    );
  };

  const totals = useMemo(
    () =>
      items.reduce(
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
      ),
    [items],
  );

  const handleSave = () => {
    if (!name.trim()) {
      Toast.show({ type: "error", text1: t("savedMeals.mealName") });
      return;
    }
    if (items.length === 0) {
      Toast.show({ type: "error", text1: t("savedMeals.emptyMeal") });
      return;
    }

    clearDraft();
    onSave({
      mealId: editingMeal?.id,
      name: name.trim(),
      items: items.map((item, index) => ({
        food_id: item.food_id,
        custom_food_id: item.custom_food_id,
        serving_size_g: item.serving_size_g,
        quantity: item.quantity,
        sort_order: index,
      })),
    });
    setName("");
    setItems([]);
  };

  const handleDelete = () => {
    if (!editingMeal || !onDelete) return;
    Alert.alert(
      tCommon("deleteButton.confirmDeleteTitle"),
      t("savedMeals.deleteConfirm"),
      [
        { text: tCommon("common.cancel"), style: "cancel" },
        { text: tCommon("common.delete"), style: "destructive", onPress: () => onDelete(editingMeal.id) },
      ],
    );
  };

  const addTabs = useMemo<{ id: AddFoodTab; icon: typeof Search; label: string }[]>(
    () => [
      { id: "search", icon: Search, label: t("log.search") },
      { id: "scan", icon: ScanLine, label: t("log.scan") },
      { id: "favorites", icon: Heart, label: t("log.favorites") },
      { id: "recent", icon: Clock, label: t("log.recent") },
    ],
    [t],
  );

  return (
    <>
    <FullScreenModal isOpen={visible} onClose={onClose}>
      <PageContainer className="justify-between">
        <View>
          <AppText className="text-xl text-center mb-4">
            {editingMeal ? t("savedMeals.edit") : t("savedMeals.create")}
          </AppText>

          {/* Meal name */}
          <View className="mb-4">
            <AppInput
              value={name}
              setValue={setName}
              label={t("savedMeals.mealName")}
              placeholder={t("savedMeals.mealNamePlaceholder")}
            />
          </View>

          {/* Items list */}
          {items.length > 0 && (
            <View className="mb-4">
              {items.map((item) => {
                const cal = Math.round((item.calories_per_100g * item.serving_size_g * item.quantity) / 100);
                return (
                  <View key={item.localId} className="flex-row items-center py-3 border-b border-slate-700/50">
                    <View className="flex-1 mr-2">
                      <AppText className="text-sm" numberOfLines={1}>{item.food_name}</AppText>
                      {item.brand && (
                        <BodyTextNC className="text-xs text-slate-400" numberOfLines={1}>{item.brand}</BodyTextNC>
                      )}
                      <View className="flex-row gap-2 mt-1">
                        <TextInput
                          value={item.serving_size_g ? String(item.serving_size_g) : ""}
                          onChangeText={(v) => updateItem(item.localId, "serving_size_g", v)}
                          keyboardType="decimal-pad"
                          placeholder="100"
                          placeholderTextColor="#4b5563"
                          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-gray-100 font-lexend text-xs w-16"
                        />
                        <BodyTextNC className="text-xs text-slate-500 self-center">g ×</BodyTextNC>
                        <TextInput
                          value={item.quantity ? String(item.quantity) : ""}
                          onChangeText={(v) => updateItem(item.localId, "quantity", v)}
                          keyboardType="decimal-pad"
                          placeholder="1"
                          placeholderTextColor="#4b5563"
                          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-gray-100 font-lexend text-xs w-12"
                        />
                      </View>
                    </View>
                    <BodyTextNC className="text-sm text-slate-400 mr-2">{cal} kcal</BodyTextNC>
                    <AnimatedButton onPress={() => removeItem(item.localId)} hitSlop={10}>
                      <X size={16} color="#ef4444" />
                    </AnimatedButton>
                  </View>
                );
              })}
            </View>
          )}

          {/* Add food button */}
          <AnimatedButton
            onPress={() => setShowAddFood(true)}
            className="btn-add py-3 mb-4"
          >
            <View className="flex-row items-center justify-center gap-2">
              <Plus size={18} color="#60a5fa" />
              <AppText className="text-sm">{t("savedMeals.addFood")}</AppText>
            </View>
          </AnimatedButton>

          {/* Total nutrition */}
          {items.length > 0 && (
            <View className="mb-4">
              <AppText className="text-sm mb-2">{t("savedMeals.totalNutrition")}</AppText>
              <NutritionInfo
                calories={totals.calories}
                protein={totals.protein}
                carbs={totals.carbs}
                fat={totals.fat}
                per100g={false}
              />
            </View>
          )}
        </View>

        {/* Action buttons pinned to bottom */}
        <View className="flex-row gap-3">
          {editingMeal && onDelete && (
            <AnimatedButton
              onPress={handleDelete}
              className="btn-danger py-3 flex-1"
              label={tCommon("common.delete")}
            />
          )}
          <AnimatedButton
            onPress={handleSave}
            className="btn-save py-3 flex-1"
            label={isSaving ? tCommon("common.saving") : tCommon("common.save")}
            disabled={isSaving}
          />
        </View>
      </PageContainer>
    </FullScreenModal>

    <FullScreenModal isOpen={showAddFood} onClose={() => setShowAddFood(false)} scrollable={false}>
      <Pressable onPress={Keyboard.dismiss} className="flex-1">
        <View className="px-5 pt-5">
          <AppText className="text-xl text-center mb-4">{t("savedMeals.addFood")}</AppText>

          <View className="gap-2 mb-4">
            {[addTabs.slice(0, 2), addTabs.slice(2)].map((row, rowIndex) => (
              <View key={rowIndex} className="flex-row gap-2">
                {row.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = addFoodTab === tab.id;
                  return (
                    <AnimatedButton
                      key={tab.id}
                      onPress={() => {
                        if (tab.id === "scan") {
                          setShowScanner(true);
                        } else {
                          setAddFoodTab(tab.id);
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
            ))}
          </View>

          {addFoodTab === "search" && (
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("log.searchPlaceholder")}
              placeholderTextColor="#9ca3af"
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm mb-4"
              autoFocus
            />
          )}
        </View>

        <View className="flex-1 px-5">
          {addFoodTab === "search" && (
            <FoodSearchList
              results={results}
              isSearching={isSearching}
              query={searchQuery}
              onSelect={handleAddFood}
            />
          )}
          {addFoodTab === "favorites" && (
            <FavoriteFoodsList onSelect={handleAddFood} />
          )}
          {addFoodTab === "recent" && (
            <RecentFoodsList onSelect={handleAddFood} />
          )}
        </View>
      </Pressable>

      <BarcodeScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanned={handleBarcodeScan}
      />
    </FullScreenModal>
    </>
  );
}
