import { useState, useEffect, useMemo } from "react";
import { View, Keyboard, Pressable, TextInput } from "react-native";
import FullScreenModal from "@/components/FullScreenModal";
import PageContainer from "@/components/PageContainer";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import BodyTextNC from "@/components/BodyTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import FoodReportModal from "@/features/nutrition/components/FoodReportModal";
import NutritionInfo from "@/features/nutrition/components/NutritionInfo";
import DetailedNutrients from "@/features/nutrition/components/DetailedNutrients";
import MealTypePicker from "@/features/nutrition/components/MealTypePicker";
import { Heart, ChevronDown, ChevronUp } from "lucide-react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import ImageViewerModal from "@/features/notes/components/ImageViewerModal";

type FoodForDetail = {
  id: string | null;
  name: string;
  brand: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  saturated_fat_per_100g: number | null;
  sugar_per_100g: number | null;
  fiber_per_100g: number | null;
  sodium_per_100g: number | null;
  serving_size_g: number;
  serving_description: string | null;
  is_custom: boolean;
  barcode: string | null;
  image_url: string | null;
  image_nutrition_url: string | null;
  source: "local" | "custom" | "api";
  apiSource?: "openfoodfacts" | "usda" | "manual";
};

type ReportSubmitData = {
  foodId: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  saturatedFatPer100g: number | null;
  sugarPer100g: number | null;
  fiberPer100g: number | null;
  sodiumPer100g: number | null;
  imageUri: string | null;
  nutritionLabelUri: string | null;
  explanation: string;
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
  onReport?: (data: ReportSubmitData) => void;
  isReporting?: boolean;
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
  onReport,
  isReporting = false,
  isFavorite,
  onToggleFavorite,
  customMealTypes,
  defaultMealType = "snack",
}: FoodDetailSheetProps) {
  const { t } = useTranslation("nutrition");

  const [servingSizeG, setServingSizeG] = useState("100");
  const [quantity, setQuantity] = useState("1");
  const [mealType, setMealType] = useState(defaultMealType);
  const [viewerIndex, setViewerIndex] = useState(-1);

  const [editedCalories, setEditedCalories] = useState("");
  const [editedProtein, setEditedProtein] = useState("");
  const [editedCarbs, setEditedCarbs] = useState("");
  const [editedFat, setEditedFat] = useState("");
  const [editedSaturatedFat, setEditedSaturatedFat] = useState("");
  const [editedSugar, setEditedSugar] = useState("");
  const [editedFiber, setEditedFiber] = useState("");
  const [editedSodium, setEditedSodium] = useState("");
  const [editedSalt, setEditedSalt] = useState("");
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [per100gExpanded, setPer100gExpanded] = useState(false);

  useEffect(() => {
    if (food) {
      setServingSizeG(String(food.serving_size_g));
      setQuantity("1");
      setMealType(defaultMealType);
      setEditedCalories(String(food.calories_per_100g));
      setEditedProtein(String(food.protein_per_100g));
      setEditedCarbs(String(food.carbs_per_100g));
      setEditedFat(String(food.fat_per_100g));
      setEditedSaturatedFat(food.saturated_fat_per_100g != null ? String(food.saturated_fat_per_100g) : "");
      setEditedSugar(food.sugar_per_100g != null ? String(food.sugar_per_100g) : "");
      setEditedFiber(food.fiber_per_100g != null ? String(food.fiber_per_100g) : "");
      setEditedSodium(food.sodium_per_100g != null ? String(food.sodium_per_100g) : "");
      setEditedSalt(food.sodium_per_100g != null ? String(Math.round(food.sodium_per_100g * 2.5 * 1000) / 1000) : "");
      setReportModalVisible(false);
      setPer100gExpanded(false);
    }
  }, [food, defaultMealType]);

  const servingG = parseFloat(servingSizeG) || 0;
  const qty = parseFloat(quantity) || 0;

  const effectiveCalsPer100g = parseFloat(editedCalories) || 0;
  const effectiveProteinPer100g = parseFloat(editedProtein) || 0;
  const effectiveCarbsPer100g = parseFloat(editedCarbs) || 0;
  const effectiveFatPer100g = parseFloat(editedFat) || 0;
  const effectiveSatFatPer100g = editedSaturatedFat ? parseFloat(editedSaturatedFat) || 0 : null;
  const effectiveSugarPer100g = editedSugar ? parseFloat(editedSugar) || 0 : null;
  const effectiveFiberPer100g = editedFiber ? parseFloat(editedFiber) || 0 : null;
  const effectiveSodiumPer100g = editedSodium ? parseFloat(editedSodium) || 0 : null;

  const scale = food ? (servingG * qty) / 100 : 0;
  const calculatedCalories = effectiveCalsPer100g * scale;
  const calculatedProtein = effectiveProteinPer100g * scale;
  const calculatedCarbs = effectiveCarbsPer100g * scale;
  const calculatedFat = effectiveFatPer100g * scale;
  const calculatedSaturatedFat = effectiveSatFatPer100g != null ? effectiveSatFatPer100g * scale : null;
  const calculatedSugar = effectiveSugarPer100g != null ? effectiveSugarPer100g * scale : null;
  const calculatedFiber = effectiveFiberPer100g != null ? effectiveFiberPer100g * scale : null;
  const calculatedSodium = effectiveSodiumPer100g != null ? effectiveSodiumPer100g * scale : null;

  const hasModifiedPer100g = useMemo(() => {
    if (!food) return false;
    return (
      effectiveCalsPer100g !== food.calories_per_100g ||
      effectiveProteinPer100g !== food.protein_per_100g ||
      effectiveCarbsPer100g !== food.carbs_per_100g ||
      effectiveFatPer100g !== food.fat_per_100g ||
      (food.saturated_fat_per_100g != null && effectiveSatFatPer100g !== food.saturated_fat_per_100g) ||
      (food.sugar_per_100g != null && effectiveSugarPer100g !== food.sugar_per_100g) ||
      (food.fiber_per_100g != null && effectiveFiberPer100g !== food.fiber_per_100g) ||
      (food.sodium_per_100g != null && effectiveSodiumPer100g !== food.sodium_per_100g)
    );
  }, [food, effectiveCalsPer100g, effectiveProteinPer100g, effectiveCarbsPer100g, effectiveFatPer100g, effectiveSatFatPer100g, effectiveSugarPer100g, effectiveFiberPer100g, effectiveSodiumPer100g]);

  const handleSodiumEditChange = (val: string) => {
    setEditedSodium(val);
    const g = parseFloat(val.replace(",", "."));
    // sodium g → salt g: g * 2.5
    setEditedSalt(!val.trim() || isNaN(g) ? "" : String(Math.round(g * 2.5 * 1000) / 1000));
  };

  const handleSaltEditChange = (val: string) => {
    setEditedSalt(val);
    const g = parseFloat(val.replace(",", "."));
    // salt g → sodium g: g / 2.5
    setEditedSodium(!val.trim() || isNaN(g) ? "" : String(Math.round((g / 2.5) * 1000) / 1000));
  };

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

  const handleReportSubmit = (data: {
    imageUri: string | null;
    nutritionLabelUri: string | null;
    explanation: string;
  }) => {
    if (!food?.id) return;
    onReport?.({
      foodId: food.id,
      caloriesPer100g: effectiveCalsPer100g,
      proteinPer100g: effectiveProteinPer100g,
      carbsPer100g: effectiveCarbsPer100g,
      fatPer100g: effectiveFatPer100g,
      saturatedFatPer100g: effectiveSatFatPer100g,
      sugarPer100g: effectiveSugarPer100g,
      fiberPer100g: effectiveFiberPer100g,
      sodiumPer100g: effectiveSodiumPer100g,
      ...data,
    });
    setReportModalVisible(false);
  };

  const images = useMemo(
    () => [
      ...(food?.image_url ? [{ id: "front", uri: food.image_url }] : []),
      ...(food?.image_nutrition_url ? [{ id: "label", uri: food.image_nutrition_url }] : []),
    ],
    [food?.image_url, food?.image_nutrition_url],
  );

  const sourceLabel = useMemo(() => {
    if (food?.source === "custom") return t("detail.source_custom");
    if (food?.apiSource) return t(`detail.source_${food.apiSource}`);
    return null;
  }, [food?.source, food?.apiSource, t]);

  if (!food) return null;

  return (
    <FullScreenModal isOpen={visible} onClose={onClose}>
      <PageContainer className="justify-between">
        <Pressable onPress={Keyboard.dismiss}>
          {/* Header */}
          <View className={`flex-row justify-between items-start ${food.brand ? "mb-2" : "mb-4"}`}>
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
              {sourceLabel && (
                <BodyTextNC className="text-xs text-slate-500 mt-1">
                  {t("detail.source", { source: sourceLabel })}
                </BodyTextNC>
              )}
            </View>
            <AnimatedButton onPress={onToggleFavorite} hitSlop={10}>
              <Heart
                size={24}
                color={isFavorite ? "#ff00ff" : "#ff00ff"}
                fill={isFavorite ? "#ff00ff" : "transparent"}
              />
            </AnimatedButton>
          </View>

          {/* Product images */}
          {(food.image_url || food.image_nutrition_url) && (
            <View className="flex-row gap-3 mb-4">
              {food.image_url && (
                <AnimatedButton onPress={() => setViewerIndex(0)}>
                  <Image
                    source={{ uri: food.image_url }}
                    className="w-24 h-24 rounded-lg"
                    contentFit="cover"
                  />
                </AnimatedButton>
              )}
              {food.image_nutrition_url && (
                <AnimatedButton onPress={() => setViewerIndex(food.image_url ? 1 : 0)}>
                  <Image
                    source={{ uri: food.image_nutrition_url }}
                    className="w-24 h-24 rounded-lg"
                    contentFit="cover"
                  />
                </AnimatedButton>
              )}
            </View>
          )}

          {/* Serving size input */}
          <View className="mb-4">
            <AppInput
              value={servingSizeG}
              setValue={setServingSizeG}
              label={t("detail.servingSize")}
              keyboardType="decimal-pad"
              placeholder="100"
            />
          </View>

          {/* Quantity input */}
          <View className="mb-4">
            <AppInput
              value={quantity}
              setValue={setQuantity}
              label={t("detail.quantity")}
              keyboardType="decimal-pad"
              placeholder="1"
            />
          </View>

          {/* Collapsible per-100g editing section */}
          <View className="mb-4">
            <AnimatedButton
              onPress={() => setPer100gExpanded((v) => !v)}
              className="flex-row items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3"
            >
              <AppText className="text-sm">{t("detail.editPer100g")}</AppText>
              {per100gExpanded ? (
                <ChevronUp size={18} color="#94a3b8" />
              ) : (
                <ChevronDown size={18} color="#94a3b8" />
              )}
            </AnimatedButton>
            {per100gExpanded && (
              <View className="mt-3 gap-3">
                <View className="gap-1">
                  <AppText className="text-sm">{t("custom.caloriesPer100g")}</AppText>
                  <TextInput
                    value={editedCalories}
                    onChangeText={setEditedCalories}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#9ca3af"
                    placeholder="0 kcal"
                    className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
                  />
                </View>
                <View className="gap-1">
                  <AppText className="text-sm">{t("custom.proteinPer100g")}</AppText>
                  <TextInput
                    value={editedProtein}
                    onChangeText={setEditedProtein}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#9ca3af"
                    placeholder="0 g"
                    className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
                  />
                </View>
                <View className="gap-1">
                  <AppText className="text-sm">{t("custom.carbsPer100g")}</AppText>
                  <TextInput
                    value={editedCarbs}
                    onChangeText={setEditedCarbs}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#9ca3af"
                    placeholder="0 g"
                    className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
                  />
                </View>
                <View className="gap-1">
                  <AppText className="text-sm">{t("custom.fatPer100g")}</AppText>
                  <TextInput
                    value={editedFat}
                    onChangeText={setEditedFat}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#9ca3af"
                    placeholder="0 g"
                    className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
                  />
                </View>
                {food.saturated_fat_per_100g != null && (
                  <View className="gap-1">
                    <AppText className="text-sm">{t("custom.saturatedFatPer100g")}</AppText>
                    <TextInput
                      value={editedSaturatedFat}
                      onChangeText={setEditedSaturatedFat}
                      keyboardType="decimal-pad"
                      placeholderTextColor="#9ca3af"
                      placeholder="0 g"
                      className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
                    />
                  </View>
                )}
                {food.sugar_per_100g != null && (
                  <View className="gap-1">
                    <AppText className="text-sm">{t("custom.sugarPer100g")}</AppText>
                    <TextInput
                      value={editedSugar}
                      onChangeText={setEditedSugar}
                      keyboardType="decimal-pad"
                      placeholderTextColor="#9ca3af"
                      placeholder="0 g"
                      className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
                    />
                  </View>
                )}
                {food.fiber_per_100g != null && (
                  <View className="gap-1">
                    <AppText className="text-sm">{t("custom.fiberPer100g")}</AppText>
                    <TextInput
                      value={editedFiber}
                      onChangeText={setEditedFiber}
                      keyboardType="decimal-pad"
                      placeholderTextColor="#9ca3af"
                      placeholder="0 g"
                      className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
                    />
                  </View>
                )}
                {food.sodium_per_100g != null && (
                  <View className="flex-row gap-3 items-end">
                    <View className="flex-1 gap-1">
                      <AppText className="text-sm">{t("custom.saltPer100g")}</AppText>
                      <TextInput
                        value={editedSalt}
                        onChangeText={handleSaltEditChange}
                        keyboardType="decimal-pad"
                        placeholderTextColor="#9ca3af"
                        placeholder="0 g"
                        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
                      />
                    </View>
                    <BodyTextNC className="text-slate-500 text-xs pb-3.5">
                      {t("login:login.or")}
                    </BodyTextNC>
                    <View className="flex-1 gap-1">
                      <AppText className="text-sm">{t("custom.sodiumPer100g")}</AppText>
                      <TextInput
                        value={editedSodium}
                        onChangeText={handleSodiumEditChange}
                        keyboardType="decimal-pad"
                        placeholderTextColor="#9ca3af"
                        placeholder="0 mg"
                        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
                      />
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Report wrong data button */}
          {hasModifiedPer100g && !food.is_custom && food.id && (
            <View className="mb-4">
              <AnimatedButton
                onPress={() => setReportModalVisible(true)}
                className="btn-neutral py-2.5"
                label={t("detail.reportWrongData")}
              />
            </View>
          )}

          {/* Nutrition */}
          <View className="mb-4">
            <NutritionInfo
              calories={calculatedCalories}
              protein={calculatedProtein}
              carbs={calculatedCarbs}
              fat={calculatedFat}
              saturatedFat={calculatedSaturatedFat}
              sugar={calculatedSugar}
              fiber={calculatedFiber}
              sodium={calculatedSodium}
              per100g={false}
            />
          </View>

          {/* Detailed nutrients (only for foods in local DB) */}
          {food.id && (
            <View className="mb-4">
              <DetailedNutrients foodId={food.id} scale={scale} />
            </View>
          )}

          {/* Meal type picker */}
          <View className="mb-4">
            <MealTypePicker
              selected={mealType}
              onSelect={setMealType}
              customTypes={customMealTypes}
            />
          </View>

        </Pressable>

        {/* Log button at bottom */}
        <AnimatedButton
          onPress={handleLog}
          className="btn-save py-3 mt-6"
          label={t("detail.logFood")}
        />
      </PageContainer>

      {images.length > 0 && viewerIndex >= 0 && (
        <ImageViewerModal
          images={images}
          initialIndex={viewerIndex}
          visible={viewerIndex >= 0}
          onClose={() => setViewerIndex(-1)}
        />
      )}

      <FoodReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSubmit={handleReportSubmit}
        isSubmitting={isReporting}
        food={{ name: food.name, brand: food.brand }}
        editedValues={{
          calories: effectiveCalsPer100g,
          protein: effectiveProteinPer100g,
          carbs: effectiveCarbsPer100g,
          fat: effectiveFatPer100g,
          saturatedFat: effectiveSatFatPer100g,
          sugar: effectiveSugarPer100g,
          fiber: effectiveFiberPer100g,
          sodium: effectiveSodiumPer100g,
        }}
        originalValues={{
          calories: food.calories_per_100g,
          protein: food.protein_per_100g,
          carbs: food.carbs_per_100g,
          fat: food.fat_per_100g,
          saturatedFat: food.saturated_fat_per_100g,
          sugar: food.sugar_per_100g,
          fiber: food.fiber_per_100g,
          sodium: food.sodium_per_100g,
        }}
      />
    </FullScreenModal>
  );
}
