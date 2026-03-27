import { useState, useEffect } from "react";
import { View, TextInput, Alert } from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Image } from "expo-image";
import * as ExpoImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Image as ImageCompressor } from "react-native-compressor";
import { Camera, X, Check } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useSaveCustomFood } from "@/features/nutrition/hooks/useSaveCustomFood";
import { useBarcodeDraft } from "@/features/nutrition/hooks/useBarcodeDraft";
import { saveSharedFood } from "@/database/nutrition/save-shared-food";
import { lookupBarcode } from "@/database/nutrition/lookup-barcode";
import { mapFoodItem } from "@/features/nutrition/hooks/useBarcodeLookup";
import type { FoodItem } from "@/database/nutrition/lookup-barcode";
import type { NutritionSearchResult } from "@/features/nutrition/hooks/useFoodSearch";
import Toast from "react-native-toast-message";

const MAX_IMAGE_SIZE_MB = 5;

type CustomFoodFormProps = {
  onSaved: () => void;
  onExistingFound?: (food: NutritionSearchResult) => void;
  barcode?: string | null;
};

export default function CustomFoodForm({ onSaved, onExistingFound, barcode }: CustomFoodFormProps) {
  const { t } = useTranslation("nutrition");
  const { t: tCommon } = useTranslation();
  const { t: tNotes } = useTranslation("notes");
  const { handleSave, isSaving } = useSaveCustomFood();
  const { draft, isLoaded, saveDraft, clearDraft } = useBarcodeDraft(barcode);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [servingSizeG, setServingSizeG] = useState("100");
  const [servingDescription, setServingDescription] = useState("");
  const [caloriesPer100g, setCaloriesPer100g] = useState("");
  const [proteinPer100g, setProteinPer100g] = useState("");
  const [carbsPer100g, setCarbsPer100g] = useState("");
  const [fatPer100g, setFatPer100g] = useState("");
  const [saturatedFatPer100g, setSaturatedFatPer100g] = useState("");
  const [sugarPer100g, setSugarPer100g] = useState("");
  const [fiberPer100g, setFiberPer100g] = useState("");
  const [sodiumPer100g, setSodiumPer100g] = useState("");
  const [saltPer100g, setSaltPer100g] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState<FoodItem | null>(null);

  const handleSodiumChange = (val: string) => {
    setSodiumPer100g(val);
    const mg = parseFloat(val.replace(",", "."));
    // sodium mg → salt g: (mg / 1000) * 2.5
    setSaltPer100g(!val.trim() || isNaN(mg) ? "" : String(Math.round((mg / 1000) * 2.5 * 1000) / 1000));
  };

  const handleSaltChange = (val: string) => {
    setSaltPer100g(val);
    const g = parseFloat(val.replace(",", "."));
    // salt g → sodium mg: (g / 2.5) * 1000
    setSodiumPer100g(!val.trim() || isNaN(g) ? "" : String(Math.round((g / 2.5) * 1000)));
  };
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [nutritionLabelUri, setNutritionLabelUri] = useState<string | null>(null);

  // Restore draft on load
  useEffect(() => {
    if (!draft) return;
    setName(draft.name);
    setBrand(draft.brand);
    setServingSizeG(draft.servingSizeG);
    setServingDescription(draft.servingDescription);
    setCaloriesPer100g(draft.caloriesPer100g);
    setProteinPer100g(draft.proteinPer100g);
    setCarbsPer100g(draft.carbsPer100g);
    setFatPer100g(draft.fatPer100g);
    setSaturatedFatPer100g(draft.saturatedFatPer100g);
    setSugarPer100g(draft.sugarPer100g);
    setFiberPer100g(draft.fiberPer100g);
    setSodiumPer100g(draft.sodiumPer100g);
    setSaltPer100g(draft.saltPer100g);
  }, [draft]);

  // Save draft on field changes (debounced via hook)
  useEffect(() => {
    if (!barcode || !isLoaded) return;
    saveDraft({
      name,
      brand,
      servingSizeG,
      servingDescription,
      caloriesPer100g,
      proteinPer100g,
      carbsPer100g,
      fatPer100g,
      saturatedFatPer100g,
      sugarPer100g,
      fiberPer100g,
      sodiumPer100g,
      saltPer100g,
    });
  }, [
    barcode, isLoaded, saveDraft, name, brand, servingSizeG, servingDescription,
    caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g,
    saturatedFatPer100g, sugarPer100g, fiberPer100g, sodiumPer100g, saltPer100g,
  ]);

  const compressImage = async (uri: string): Promise<string> => {
    const compressed = await ImageCompressor.compress(uri, {
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.7,
      output: "jpg",
    });

    const info = await FileSystem.getInfoAsync(compressed);
    const sizeMB = info.exists && "size" in info ? (info.size ?? 0) / (1024 * 1024) : 0;

    if (sizeMB > MAX_IMAGE_SIZE_MB) {
      Toast.show({
        type: "error",
        text1: tCommon("common.media.imageTooLarge", { max: MAX_IMAGE_SIZE_MB }),
      });
      return uri;
    }

    return compressed;
  };

  const pickImage = (setter: (uri: string | null) => void) => {
    const pickFromLibrary = async () => {
      const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Toast.show({ type: "error", text1: tNotes("notes.images.permissionRequired") });
        return;
      }
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets[0]) {
        const compressed = await compressImage(result.assets[0].uri);
        setter(compressed);
      }
    };

    const takePhoto = async () => {
      const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Toast.show({ type: "error", text1: tNotes("notes.images.permissionRequired") });
        return;
      }
      const result = await ExpoImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets[0]) {
        const compressed = await compressImage(result.assets[0].uri);
        setter(compressed);
      }
    };

    Alert.alert(
      tNotes("notes.images.addImage"),
      tCommon("common.media.imageLimitInfo", { size: MAX_IMAGE_SIZE_MB }),
      [
        { text: tNotes("notes.images.takePhoto"), onPress: takePhoto },
        { text: tNotes("notes.images.chooseFromLibrary"), onPress: pickFromLibrary },
        { text: tCommon("common.cancel"), style: "cancel" },
      ],
    );
  };

  const toNum = (val: string): number => parseFloat(val.replace(",", "."));
  const toNumOrNull = (val: string): number | null => {
    if (!val.trim()) return null;
    const n = parseFloat(val.replace(",", "."));
    return isNaN(n) ? null : n;
  };
  // Sodium input is in mg, database stores g
  const sodiumMgToG = (): number | null => {
    const mg = toNumOrNull(sodiumPer100g);
    return mg != null ? mg / 1000 : null;
  };

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

    // Extra validation for shared foods (barcode)
    if (barcode) {
      if (!proteinPer100g.trim() || !carbsPer100g.trim() || !fatPer100g.trim()) {
        Toast.show({
          type: "error",
          text1: tCommon("common.error"),
          text2: t("custom.missingMacros"),
        });
        return;
      }

      if (!imageUri) {
        Toast.show({
          type: "error",
          text1: tCommon("common.error"),
          text2: t("custom.missingImage"),
        });
        return;
      }

      const cal = toNum(caloriesPer100g);
      const pro = toNum(proteinPer100g);
      const carb = toNum(carbsPer100g);
      const f = toNum(fatPer100g);

      if (cal < 0 || cal > 900) {
        Toast.show({
          type: "error",
          text1: tCommon("common.error"),
          text2: t("custom.invalidCalories"),
        });
        return;
      }

      if (pro < 0 || pro > 100 || carb < 0 || carb > 100 || f < 0 || f > 100) {
        Toast.show({
          type: "error",
          text1: tCommon("common.error"),
          text2: t("custom.invalidMacros"),
        });
        return;
      }

      // Check if someone else added this product while user was filling the form
      setIsSubmitting(true);
      try {
        const existing = await lookupBarcode(barcode);
        if (existing) {
          setAlreadyExists(existing);
          clearDraft();
          setIsSubmitting(false);
          return;
        }
      } catch {
        // Lookup failed — proceed with save anyway
      }
    }

    if (barcode) {
      // Barcode not found in API — save to shared foods table
      setIsSubmitting(true);
      try {
        await saveSharedFood({
          barcode,
          name: name.trim(),
          brand: brand.trim() || null,
          servingSizeG: toNum(servingSizeG) || 100,
          servingDescription: servingDescription.trim() || null,
          caloriesPer100g: toNum(caloriesPer100g) || 0,
          proteinPer100g: toNum(proteinPer100g) || 0,
          carbsPer100g: toNum(carbsPer100g) || 0,
          fatPer100g: toNum(fatPer100g) || 0,
          fiberPer100g: toNumOrNull(fiberPer100g),
          sugarPer100g: toNumOrNull(sugarPer100g),
          sodiumPer100g: sodiumMgToG(),
          saturatedFatPer100g: toNumOrNull(saturatedFatPer100g),
          imageUrl: imageUri,
          nutritionLabelUrl: nutritionLabelUri,
          source: "manual",
        });
        clearDraft();
        Toast.show({
          type: "success",
          text1: tCommon("common.success"),
          text2: t("custom.saved"),
        });
        onSaved();
      } catch {
        Toast.show({
          type: "error",
          text1: tCommon("common.error"),
          text2: t("toast.error"),
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // No barcode — save to private custom_foods
      const success = await handleSave({
        name: name.trim(),
        brand: brand.trim() || null,
        servingSizeG: toNum(servingSizeG) || 100,
        servingDescription: servingDescription.trim() || null,
        caloriesPer100g: toNum(caloriesPer100g) || 0,
        proteinPer100g: toNumOrNull(proteinPer100g),
        carbsPer100g: toNumOrNull(carbsPer100g),
        fatPer100g: toNumOrNull(fatPer100g),
        fiberPer100g: toNumOrNull(fiberPer100g),
        sugarPer100g: toNumOrNull(sugarPer100g),
        sodiumPer100g: sodiumMgToG(),
        saturatedFatPer100g: toNumOrNull(saturatedFatPer100g),
        imageUri,
      });
      if (success) onSaved();
    }
  };

  const busy = isSaving || isSubmitting;

  return (
    <View className="gap-4">
      {/* Already exists banner */}
      {alreadyExists && (
        <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <AppText className="text-sm">{t("custom.alreadyAddedTitle")}</AppText>
          <BodyText className="text-xs mt-1">{t("custom.alreadyAddedDesc")}</BodyText>

          <View className="flex-row items-center gap-3 mt-3 bg-slate-800/50 rounded-lg p-3">
            {alreadyExists.image_url && (
              <Image
                source={{ uri: alreadyExists.image_url }}
                className="w-12 h-12 rounded-lg"
                contentFit="cover"
              />
            )}
            <View className="flex-1">
              <AppText className="text-sm" numberOfLines={1}>{alreadyExists.name}</AppText>
              {alreadyExists.brand && (
                <BodyTextNC className="text-xs text-slate-400" numberOfLines={1}>
                  {alreadyExists.brand}
                </BodyTextNC>
              )}
              <BodyTextNC className="text-xs text-slate-500 mt-0.5">
                {alreadyExists.calories_per_100g} kcal / 100g
              </BodyTextNC>
            </View>
          </View>

          <AnimatedButton
            onPress={() => onExistingFound?.(mapFoodItem(alreadyExists))}
            className="btn-save py-2.5 mt-3"
          >
            <View className="flex-row items-center justify-center gap-2">
              <Check size={16} color="#fff" />
              <AppText className="text-sm" numberOfLines={1}>{t("custom.useExisting")}</AppText>
            </View>
          </AnimatedButton>
        </View>
      )}

      {/* Barcode info when creating from failed scan */}
      {barcode && !alreadyExists && (
        <View className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg p-3">
          <AppText className="text-sm">{t("log.notFoundBannerTitle")}</AppText>
          <BodyTextNC className="text-xs text-slate-400 mt-2">{t("log.notFoundBannerSteps")}</BodyTextNC>
          <BodyTextNC className="text-xs text-slate-500 mt-2">{t("custom.barcodeInfo")}: {barcode}</BodyTextNC>
        </View>
      )}

      {/* Image pickers */}
      {barcode ? (
        <>
        <AppText className="text-sm mb-1">{t("custom.addImages")} *</AppText>
        <View className="flex-row gap-4">
          {/* Front image */}
          <View className="flex-1 items-center">
            {imageUri ? (
              <View>
                <Image
                  source={{ uri: imageUri }}
                  className="w-24 h-24 rounded-lg"
                  contentFit="cover"
                />
                <AnimatedButton
                  onPress={() => setImageUri(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 items-center justify-center"
                >
                  <X size={12} color="#ef4444" />
                </AnimatedButton>
              </View>
            ) : (
              <AnimatedButton
                onPress={() => pickImage(setImageUri)}
                className="h-24 rounded-lg bg-slate-800/50 border border-slate-700/50 border-dashed items-center justify-center w-full"
              >
                <Camera size={20} color="#64748b" />
                <BodyTextNC className="text-sm text-slate-500 mt-1 text-center">
                  {t("custom.frontImage")}
                </BodyTextNC>
              </AnimatedButton>
            )}
          </View>

          {/* Nutrition label image */}
          <View className="flex-1 items-center">
            {nutritionLabelUri ? (
              <View>
                <Image
                  source={{ uri: nutritionLabelUri }}
                  className="w-24 h-24 rounded-lg"
                  contentFit="cover"
                />
                <AnimatedButton
                  onPress={() => setNutritionLabelUri(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 items-center justify-center"
                >
                  <X size={12} color="#ef4444" />
                </AnimatedButton>
              </View>
            ) : (
              <AnimatedButton
                onPress={() => pickImage(setNutritionLabelUri)}
                className="h-24 rounded-lg bg-slate-800/50 border border-slate-700/50 border-dashed items-center justify-center w-full"
              >
                <Camera size={20} color="#64748b" />
                <BodyTextNC className="text-sm text-slate-500 mt-1 text-center">
                  {t("custom.nutritionLabel")}
                </BodyTextNC>
              </AnimatedButton>
            )}
          </View>
        </View>
        </>
      ) : (
        <View className="items-center">
          {imageUri ? (
            <View>
              <Image
                source={{ uri: imageUri }}
                className="w-24 h-24 rounded-lg"
                contentFit="cover"
              />
              <AnimatedButton
                onPress={() => setImageUri(null)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 items-center justify-center"
              >
                <X size={12} color="#ef4444" />
              </AnimatedButton>
            </View>
          ) : (
            <AnimatedButton
              onPress={() => pickImage(setImageUri)}
              className="w-24 h-24 rounded-lg bg-slate-800/50 border border-slate-700/50 border-dashed items-center justify-center"
            >
              <Camera size={24} color="#64748b" />
              <BodyTextNC className="text-xs text-slate-500 mt-1">
                {t("custom.addImage")}
              </BodyTextNC>
            </AnimatedButton>
          )}
        </View>
      )}

      <AppInput
        value={name}
        setValue={setName}
        label={`${t("custom.name")} *`}
        placeholder={t("custom.name")}
      />

      <AppInput
        value={brand}
        setValue={setBrand}
        label={t("custom.brand")}
        placeholder={t("custom.brand")}
      />

      <AppInput
        value={servingDescription}
        setValue={setServingDescription}
        label={t("custom.servingDesc")}
        placeholder={t("custom.servingDescPlaceholder")}
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

      <View className="gap-1">
        <AppText className="text-sm">{t("custom.caloriesPer100g")} *</AppText>
        <TextInput
          value={caloriesPer100g}
          onChangeText={setCaloriesPer100g}
          keyboardType="decimal-pad"
          placeholderTextColor="#9ca3af"
          placeholder="0 kcal"
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
        />
      </View>

      <View className="gap-1">
        <AppText className="text-sm">{t("custom.proteinPer100g")}{barcode ? " *" : ""}</AppText>
        <TextInput
          value={proteinPer100g}
          onChangeText={setProteinPer100g}
          keyboardType="decimal-pad"
          placeholderTextColor="#9ca3af"
          placeholder="0 g"
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
        />
      </View>

      <View className="gap-1">
        <AppText className="text-sm">{t("custom.carbsPer100g")}{barcode ? " *" : ""}</AppText>
        <TextInput
          value={carbsPer100g}
          onChangeText={setCarbsPer100g}
          keyboardType="decimal-pad"
          placeholderTextColor="#9ca3af"
          placeholder="0 g"
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
        />
      </View>

      <View className="gap-1">
        <AppText className="text-sm">{t("custom.fatPer100g")}{barcode ? " *" : ""}</AppText>
        <TextInput
          value={fatPer100g}
          onChangeText={setFatPer100g}
          keyboardType="decimal-pad"
          placeholderTextColor="#9ca3af"
          placeholder="0 g"
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
        />
      </View>

      <View className="gap-1">
        <AppText className="text-sm">{t("custom.saturatedFatPer100g")}</AppText>
        <TextInput
          value={saturatedFatPer100g}
          onChangeText={setSaturatedFatPer100g}
          keyboardType="decimal-pad"
          placeholderTextColor="#9ca3af"
          placeholder="0 g"
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
        />
      </View>

      <View className="gap-1">
        <AppText className="text-sm">{t("custom.sugarPer100g")}</AppText>
        <TextInput
          value={sugarPer100g}
          onChangeText={setSugarPer100g}
          keyboardType="decimal-pad"
          placeholderTextColor="#9ca3af"
          placeholder="0 g"
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
        />
      </View>

      <View className="gap-1">
        <AppText className="text-sm">{t("custom.fiberPer100g")}</AppText>
        <TextInput
          value={fiberPer100g}
          onChangeText={setFiberPer100g}
          keyboardType="decimal-pad"
          placeholderTextColor="#9ca3af"
          placeholder="0 g"
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
        />
      </View>

      <View className="flex-row gap-3 items-end">
        <View className="flex-1 gap-1">
          <AppText className="text-sm">{t("custom.saltPer100g")}</AppText>
          <TextInput
            value={saltPer100g}
            onChangeText={handleSaltChange}
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
            value={sodiumPer100g}
            onChangeText={handleSodiumChange}
            keyboardType="decimal-pad"
            placeholderTextColor="#9ca3af"
            placeholder="0 mg"
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-100 font-lexend text-sm"
          />
        </View>
      </View>

      <AnimatedButton
        onPress={handleSubmit}
        className="btn-save py-3 mt-6"
        label={busy ? tCommon("common.saving") : tCommon("common.save")}
        disabled={busy}
      />
    </View>
  );
}
