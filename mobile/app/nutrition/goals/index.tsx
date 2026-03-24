import { useState, useEffect } from "react";
import { View, ScrollView, TextInput, Keyboard, Pressable, Alert } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";
import PageContainer from "@/components/PageContainer";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useNutritionGoals } from "@/features/nutrition/hooks/useNutritionGoals";
import { useSaveGoals } from "@/features/nutrition/hooks/useSaveGoals";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react-native";

export default function NutritionGoalsScreen() {
  const { t } = useTranslation("nutrition");
  const { t: tCommon } = useTranslation();
  const { data: goals, isLoading } = useNutritionGoals();
  const { handleSave, isSaving } = useSaveGoals();

  const [calorieGoal, setCalorieGoal] = useState("2000");
  const [proteinGoal, setProteinGoal] = useState("");
  const [carbsGoal, setCarbsGoal] = useState("");
  const [fatGoal, setFatGoal] = useState("");
  const [customMealTypes, setCustomMealTypes] = useState<string[]>([]);
  const [newMealType, setNewMealType] = useState("");

  // Populate form when goals load
  useEffect(() => {
    if (goals) {
      setCalorieGoal(String(goals.calorie_goal ?? 2000));
      setProteinGoal(goals.protein_goal ? String(goals.protein_goal) : "");
      setCarbsGoal(goals.carbs_goal ? String(goals.carbs_goal) : "");
      setFatGoal(goals.fat_goal ? String(goals.fat_goal) : "");
      setCustomMealTypes(goals.custom_meal_types ?? []);
    }
  }, [goals]);

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
    <ScrollView className="flex-1">
      <Pressable onPress={Keyboard.dismiss}>
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

          {/* Save button */}
          <AnimatedButton
            onPress={onSave}
            className="btn-base py-3"
            label={isSaving ? tCommon("common.saving") : tCommon("common.save")}
            disabled={isSaving}
          />
        </PageContainer>
      </Pressable>
    </ScrollView>
  );
}
