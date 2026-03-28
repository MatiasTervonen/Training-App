import { useState } from "react";
import { View, Alert } from "react-native";
import FullScreenModal from "@/components/FullScreenModal";
import PageContainer from "@/components/PageContainer";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import SubNotesInput from "@/components/SubNotesInput";
import { Image } from "expo-image";
import * as ExpoImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Image as ImageCompressor } from "react-native-compressor";
import { Camera, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

const MAX_IMAGE_SIZE_MB = 5;

type NutrientValues = {
  servingSize: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat: number | null;
  sugar: number | null;
  fiber: number | null;
  sodium: number | null;
};

type FoodReportModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    imageUri: string | null;
    nutritionLabelUri: string | null;
    explanation: string;
  }) => void;
  isSubmitting: boolean;
  food: {
    name: string;
    brand: string | null;
  };
  editedValues: NutrientValues;
  originalValues: NutrientValues;
};

const NUTRIENTS = [
  { key: "servingSize", unit: "g", labelKey: "custom.servingSize" },
  { key: "calories", unit: "kcal" },
  { key: "protein", unit: "g" },
  { key: "carbs", unit: "g" },
  { key: "fat", unit: "g" },
  { key: "saturatedFat", unit: "g" },
  { key: "sugar", unit: "g" },
  { key: "fiber", unit: "g" },
  { key: "sodium", unit: "g" },
] as const;

export default function FoodReportModal({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
  food,
  editedValues,
  originalValues,
}: FoodReportModalProps) {
  const { t } = useTranslation("nutrition");
  const { t: tCommon } = useTranslation();
  const { t: tNotes } = useTranslation("notes");

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [nutritionLabelUri, setNutritionLabelUri] = useState<string | null>(null);
  const [explanation, setExplanation] = useState("");

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

  const handleSubmit = () => {
    onSubmit({
      imageUri,
      nutritionLabelUri,
      explanation,
    });
  };

  const handleClose = () => {
    setImageUri(null);
    setNutritionLabelUri(null);
    setExplanation("");
    onClose();
  };

  return (
    <FullScreenModal isOpen={visible} onClose={handleClose} scrollable>
      <PageContainer className="justify-between">
        <View>
        {/* Header */}
        <AppText className="text-lg text-center mb-1">{t("detail.reportTitle")}</AppText>
        <BodyTextNC className="text-sm text-slate-400 text-center mb-4">
          {food.name}{food.brand ? ` · ${food.brand}` : ""}
        </BodyTextNC>

        {/* Value comparison */}
        <View className="mb-4 bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
          {/* Header row */}
          <View className="flex-row mb-2">
            <View className="flex-1" />
            <BodyTextNC className="text-xs text-slate-500 w-16 text-right">
              {t("detail.currentValues")}
            </BodyTextNC>
            <BodyTextNC className="text-xs text-slate-500 w-4 text-center">→</BodyTextNC>
            <BodyTextNC className="text-xs text-slate-500 w-16 text-right">
              {t("detail.reportedValues")}
            </BodyTextNC>
          </View>

          {NUTRIENTS.map((nutrient) => {
            const { key, unit } = nutrient;
            const original = originalValues[key];
            const edited = editedValues[key];
            if (original == null && edited == null) return null;
            const changed = original !== edited;
            const label = "labelKey" in nutrient ? t(nutrient.labelKey) : t(`custom.${key}Per100g`);
            return (
              <View key={key} className="flex-row items-center py-0.5">
                <BodyTextNC className="flex-1 text-xs text-slate-400">
                  {label}
                </BodyTextNC>
                <BodyTextNC className="text-xs text-slate-500 w-16 text-right">
                  {original != null ? `${original} ${unit}` : "—"}
                </BodyTextNC>
                <BodyTextNC className="text-xs text-slate-600 w-4 text-center">→</BodyTextNC>
                <BodyTextNC className={`text-xs w-16 text-right ${changed ? "text-amber-400" : "text-slate-400"}`}>
                  {edited != null ? `${edited} ${unit}` : "—"}
                </BodyTextNC>
              </View>
            );
          })}
        </View>

        {/* Image pickers */}
        <AppText className="text-sm mb-2">{t("detail.reportImages")}</AppText>
        <View className="flex-row gap-4 mb-4">
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

        {/* Explanation */}
        <View className="mb-6">
          <SubNotesInput
            value={explanation}
            setValue={setExplanation}
            label={t("detail.reportExplanation")}
            placeholder={t("detail.reportExplanationPlaceholder")}
          />
        </View>

        </View>

        {/* Submit */}
        <AnimatedButton
          onPress={handleSubmit}
          disabled={isSubmitting}
          className="btn-save py-3 mt-6"
          label={isSubmitting ? tCommon("common.saving") : t("detail.submitReport")}
        />
      </PageContainer>
    </FullScreenModal>
  );
}
