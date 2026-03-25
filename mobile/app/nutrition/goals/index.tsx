import { useState, useEffect, useRef } from "react";
import { View, TextInput } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import Toggle from "@/components/toggle";
import PageContainer from "@/components/PageContainer";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useNutritionGoals } from "@/features/nutrition/hooks/useNutritionGoals";
import { useSaveGoals } from "@/features/nutrition/hooks/useSaveGoals";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react-native";

const OPTIONAL_NUTRIENTS = ["fiber", "sugar", "sodium", "saturated_fat"] as const;

export default function NutritionGoalsScreen() {
  const { t } = useTranslation("nutrition");
  const { t: tCommon } = useTranslation();
  const { data: goals, isLoading } = useNutritionGoals();
  const { handleSave, isSaving } = useSaveGoals();

  const [calorieGoal, setCalorieGoal] = useState("2000");
  const [proteinGoal, setProteinGoal] = useState("");
  const [carbsGoal, setCarbsGoal] = useState("");
  const [fatGoal, setFatGoal] = useState("");
  const [fiberGoal, setFiberGoal] = useState("");
  const [sugarGoal, setSugarGoal] = useState("");
  const [sodiumGoal, setSodiumGoal] = useState("");
  const [saturatedFatGoal, setSaturatedFatGoal] = useState("");
  const [visibleNutrients, setVisibleNutrients] = useState<string[]>([]);
  const [customMealTypes, setCustomMealTypes] = useState<string[]>([]);
  const [newMealType, setNewMealType] = useState("");

  // Populate form when goals load (only on initial load to avoid overwriting in-progress edits)
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (goals && !hasInitialized.current) {
      hasInitialized.current = true;
      setCalorieGoal(String(goals.calorie_goal ?? 2000));
      setProteinGoal(goals.protein_goal ? String(goals.protein_goal) : "");
      setCarbsGoal(goals.carbs_goal ? String(goals.carbs_goal) : "");
      setFatGoal(goals.fat_goal ? String(goals.fat_goal) : "");
      setFiberGoal(goals.fiber_goal ? String(goals.fiber_goal) : "");
      setSugarGoal(goals.sugar_goal ? String(goals.sugar_goal) : "");
      setSodiumGoal(goals.sodium_goal ? String(goals.sodium_goal) : "");
      setSaturatedFatGoal(goals.saturated_fat_goal ? String(goals.saturated_fat_goal) : "");
      setVisibleNutrients(goals.visible_nutrients ?? []);
      setCustomMealTypes(goals.custom_meal_types ?? []);
    }
  }, [goals]);

  const toggleNutrient = (key: string) => {
    setVisibleNutrients((prev) =>
      prev.includes(key) ? prev.filter((n) => n !== key) : [...prev, key],
    );
  };

  const addMealType = () => {
    const trimmed = newMealType.trim();
    if (!trimmed) return;
    if (customMealTypes.includes(trimmed)) return;
    setCustomMealTypes([...customMealTypes, trimmed]);
    setNewMealType("");
  };

  const removeMealType = (index: number) => {
    setCustomMealTypes(customMealTypes.filter((_, i) => i !== index));
  };

  const onSave = () => {
    handleSave({
      calorieGoal: Number(calorieGoal) || 2000,
      proteinGoal: proteinGoal ? Number(proteinGoal) : null,
      carbsGoal: carbsGoal ? Number(carbsGoal) : null,
      fatGoal: fatGoal ? Number(fatGoal) : null,
      fiberGoal: fiberGoal ? Number(fiberGoal) : null,
      sugarGoal: sugarGoal ? Number(sugarGoal) : null,
      sodiumGoal: sodiumGoal ? Number(sodiumGoal) : null,
      saturatedFatGoal: saturatedFatGoal ? Number(saturatedFatGoal) : null,
      visibleNutrients,
      customMealTypes,
    });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <BodyText className="text-center mt-10">{tCommon("common.loading")}</BodyText>
      </PageContainer>
    );
  }

  return (
    <View className="flex-1">
    <KeyboardAwareScrollView bottomOffset={50} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <PageContainer>
          <AppText className="text-xl text-center mb-6">{t("goals.title")}</AppText>

          {/* Calorie goal */}
          <View className="mb-5">
            <AppText className="text-sm mb-2">{t("goals.calorieGoal")}</AppText>
            <TextInput
              value={calorieGoal}
              onChangeText={setCalorieGoal}
              keyboardType="number-pad"
              placeholderTextColor="#9ca3af"
              placeholder="2000"
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
            />
          </View>

          {/* Protein goal */}
          <View className="mb-5">
            <AppText className="text-sm mb-2">{t("goals.proteinGoal")}</AppText>
            <TextInput
              value={proteinGoal}
              onChangeText={setProteinGoal}
              keyboardType="decimal-pad"
              placeholderTextColor="#9ca3af"
              placeholder={t("goals.noGoal")}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
            />
          </View>

          {/* Carbs goal */}
          <View className="mb-5">
            <AppText className="text-sm mb-2">{t("goals.carbsGoal")}</AppText>
            <TextInput
              value={carbsGoal}
              onChangeText={setCarbsGoal}
              keyboardType="decimal-pad"
              placeholderTextColor="#9ca3af"
              placeholder={t("goals.noGoal")}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
            />
          </View>

          {/* Fat goal */}
          <View className="mb-5">
            <AppText className="text-sm mb-2">{t("goals.fatGoal")}</AppText>
            <TextInput
              value={fatGoal}
              onChangeText={setFatGoal}
              keyboardType="decimal-pad"
              placeholderTextColor="#9ca3af"
              placeholder={t("goals.noGoal")}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
            />
          </View>

          {/* Optional nutrients toggles */}
          <View className="mb-6">
            <AppText className="text-sm mb-3">{t("goals.optionalNutrients")}</AppText>
            <BodyText className="text-xs mb-3">{t("goals.optionalNutrientsDesc")}</BodyText>

            {OPTIONAL_NUTRIENTS.map((key) => {
              const enabled = visibleNutrients.includes(key);
              const goalValue =
                key === "fiber" ? fiberGoal :
                key === "sugar" ? sugarGoal :
                key === "sodium" ? sodiumGoal :
                saturatedFatGoal;
              const setGoalValue =
                key === "fiber" ? setFiberGoal :
                key === "sugar" ? setSugarGoal :
                key === "sodium" ? setSodiumGoal :
                setSaturatedFatGoal;

              return (
                <View key={key} className="mb-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <AppText className="text-sm">
                      {t(`goals.${key}Toggle` as "goals.fiberToggle")}
                    </AppText>
                    <Toggle
                      isOn={enabled}
                      onToggle={() => toggleNutrient(key)}
                    />
                  </View>
                  {enabled && (
                    <TextInput
                      value={goalValue}
                      onChangeText={setGoalValue}
                      keyboardType="decimal-pad"
                      placeholderTextColor="#9ca3af"
                      placeholder={t("goals.noGoal")}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* Custom meal types */}
          <View className="mb-6">
            <AppText className="text-sm mb-3">{t("goals.customMeals")}</AppText>

            {customMealTypes.map((type, index) => (
              <View
                key={type}
                className="flex-row items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 mb-2"
              >
                <BodyText className="text-sm">{type}</BodyText>
                <AnimatedButton onPress={() => removeMealType(index)} hitSlop={10}>
                  <X size={16} color="#ef4444" />
                </AnimatedButton>
              </View>
            ))}

            <View className="flex-row gap-2">
              <TextInput
                value={newMealType}
                onChangeText={setNewMealType}
                placeholder={t("goals.mealTypePlaceholder")}
                placeholderTextColor="#9ca3af"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
                onSubmitEditing={addMealType}
              />
              <AnimatedButton
                onPress={addMealType}
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 items-center justify-center"
              >
                <Plus size={20} color="#94a3b8" />
              </AnimatedButton>
            </View>
          </View>
      </PageContainer>
    </KeyboardAwareScrollView>

    {/* Sticky save button */}
    <View className="border-t border-slate-700/50 px-5 py-4 pb-8">
      <AnimatedButton
        onPress={onSave}
        className="btn-save py-3"
        label={isSaving ? tCommon("common.saving") : tCommon("common.save")}
        disabled={isSaving}
      />
    </View>
    </View>
  );
}
