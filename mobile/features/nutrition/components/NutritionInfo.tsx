import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";
import { useTranslation } from "react-i18next";

type NutritionInfoProps = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat?: number | null;
  sugar?: number | null;
  fiber?: number | null;
  sodium?: number | null;
  per100g?: boolean;
};

export default function NutritionInfo({
  calories,
  protein,
  carbs,
  fat,
  saturatedFat,
  sugar,
  fiber,
  sodium,
  per100g = true,
}: NutritionInfoProps) {
  const { t } = useTranslation("nutrition");

  const round = (v: number) => Math.round(v * 10) / 10;

  const mainRows = [
    { label: t("daily.calories"), value: Math.round(calories), unit: "kcal" },
    { label: t("daily.protein"), value: round(protein), unit: "g" },
    { label: t("daily.carbs"), value: round(carbs), unit: "g" },
    { label: t("daily.fat"), value: round(fat), unit: "g" },
  ];

  const extraRows = [
    saturatedFat != null ? { label: t("daily.saturatedFat"), value: round(saturatedFat), unit: "g" } : null,
    sugar != null ? { label: t("daily.sugar"), value: round(sugar), unit: "g" } : null,
    fiber != null ? { label: t("daily.fiber"), value: round(fiber), unit: "g" } : null,
    sodium != null ? { label: t("daily.sodium"), value: round(sodium * 1000), unit: "mg" } : null,
  ].filter(Boolean) as { label: string; value: number; unit: string }[];

  return (
    <View className={`rounded-lg border overflow-hidden ${per100g ? "border-slate-700/50" : "border-slate-600/50"}`}>
      <LinearGradient
        colors={per100g ? ["#0f172a", "#1a2332"] : ["#0c1322", "#162032"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      <View className="p-3 gap-2">
      {per100g && (
        <BodyTextNC className="text-xs text-slate-500 mb-1">
          {t("detail.per100g")}
        </BodyTextNC>
      )}
      {mainRows.map((row) => (
        <View key={row.label} className="flex-row justify-between">
          <BodyText className="text-sm">{row.label}</BodyText>
          <BodyTextNC className="text-sm text-slate-300">
            {row.value} {row.unit}
          </BodyTextNC>
        </View>
      ))}
      {extraRows.length > 0 && (
        <>
          <View className="border-t border-slate-700/50 mt-1 pt-2" />
          {extraRows.map((row) => (
            <View key={row.label} className="flex-row justify-between">
              <BodyTextNC className="text-sm text-slate-400">{row.label}</BodyTextNC>
              <BodyTextNC className="text-sm text-slate-400">
                {row.value} {row.unit}
              </BodyTextNC>
            </View>
          ))}
        </>
      )}
      </View>
    </View>
  );
}
