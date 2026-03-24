import { useState } from "react";
import { View, ScrollView, Keyboard, Pressable, TextInput } from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useTranslation } from "react-i18next";
import { useSaveCustomFood } from "@/features/nutrition/hooks/useSaveCustomFood";
import Toast from "react-native-toast-message";

type CustomFoodFormProps = {
  onSaved: () => void;
};

export default function CustomFoodForm({ onSaved }: CustomFoodFormProps) {
  const { t } = useTranslation("nutrition");
  const { t: tCommon } = useTranslation();
  const { handleSave, isSaving } = useSaveCustomFood();

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [servingSizeG, setServingSizeG] = useState("100");
  const [servingDescription, setServingDescription] = useState("");
  const [caloriesPer100g, setCaloriesPer100g] = useState("");
  const [proteinPer100g, setProteinPer100g] = useState("");
  const [carbsPer100g, setCarbsPer100g] = useState("");
  const [fatPer100g, setFatPer100g] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      Toast.show({
        type: "error",
        text1: tCommon("common.error"),
        text2: t("custom.missingName"),
      });
      return;
    }

    if (!caloriesPer100g.trim()) {
      Toast.show({
        type: "error",
        text1: tCommon("common.error"),
        text2: t("custom.missingCalories"),
      });
      return;
    }

    const success = await handleSave({
      name: name.trim(),
      brand: brand.trim() || null,
      servingSizeG: parseFloat(servingSizeG) || 100,
      servingDescription: servingDescription.trim() || null,
      caloriesPer100g: parseFloat(caloriesPer100g) || 0,
      proteinPer100g: parseFloat(proteinPer100g) || null,
      carbsPer100g: parseFloat(carbsPer100g) || null,
      fatPer100g: parseFloat(fatPer100g) || null,
      fiberPer100g: null,
      sugarPer100g: null,
      sodiumPer100g: null,
      saturatedFatPer100g: null,
    });

    if (success) onSaved();
  };

  return (
    <Pressable onPress={Keyboard.dismiss} className="flex-1">
      <ScrollView
        contentContainerClassName="px-4 py-4 gap-4 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <AppInput
          value={name}
          setValue={setName}
          label={t("custom.name")}
          placeholder={t("custom.name")}
        />

        <AppInput
          value={brand}
          setValue={setBrand}
          label={t("custom.brand")}
          placeholder={t("custom.brand")}
        />

        <View className="gap-1">
          <AppText className="text-sm">{t("custom.servingSize")}</AppText>
          <TextInput
            value={servingSizeG}
            onChangeText={setServingSizeG}
            keyboardType="decimal-pad"
            placeholderTextColor="#9ca3af"
            placeholder="100"
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
          />
        </View>

        <AppInput
          value={servingDescription}
          setValue={setServingDescription}
          label={t("custom.servingDesc")}
          placeholder={t("custom.servingDescPlaceholder")}
        />

        <View className="gap-1">
          <AppText className="text-sm">{t("custom.caloriesPer100g")}</AppText>
          <TextInput
            value={caloriesPer100g}
            onChangeText={setCaloriesPer100g}
            keyboardType="decimal-pad"
            placeholderTextColor="#9ca3af"
            placeholder="0"
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
          />
        </View>

        <View className="gap-1">
          <AppText className="text-sm">{t("custom.proteinPer100g")}</AppText>
          <TextInput
            value={proteinPer100g}
            onChangeText={setProteinPer100g}
            keyboardType="decimal-pad"
            placeholderTextColor="#9ca3af"
            placeholder="0"
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
          />
        </View>

        <View className="gap-1">
          <AppText className="text-sm">{t("custom.carbsPer100g")}</AppText>
          <TextInput
            value={carbsPer100g}
            onChangeText={setCarbsPer100g}
            keyboardType="decimal-pad"
            placeholderTextColor="#9ca3af"
            placeholder="0"
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
          />
        </View>

        <View className="gap-1">
          <AppText className="text-sm">{t("custom.fatPer100g")}</AppText>
          <TextInput
            value={fatPer100g}
            onChangeText={setFatPer100g}
            keyboardType="decimal-pad"
            placeholderTextColor="#9ca3af"
            placeholder="0"
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
          />
        </View>

        <AnimatedButton
          onPress={handleSubmit}
          className="btn-base py-3 mt-2"
          label={isSaving ? tCommon("common.saving") : tCommon("common.save")}
          disabled={isSaving}
        />
      </ScrollView>
    </Pressable>
  );
}
