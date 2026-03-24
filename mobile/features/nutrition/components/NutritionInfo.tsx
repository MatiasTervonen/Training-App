import { View } from "react-native";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";
import { useTranslation } from "react-i18next";

type NutritionInfoProps = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  per100g?: boolean;
};

export default function NutritionInfo({
  calories,
  protein,
  carbs,
  fat,
  per100g = true,
}: NutritionInfoProps) {
  const { t } = useTranslation("nutrition");

  const rows = [
    { label: t("daily.calories"), value: Math.round(calories), unit: "kcal" },
    {
      label: t("daily.protein"),
      value: Math.round(protein * 10) / 10,
      unit: "g",
    },
    {
      label: t("daily.carbs"),
      value: Math.round(carbs * 10) / 10,
      unit: "g",
    },
    { label: t("daily.fat"), value: Math.round(fat * 10) / 10, unit: "g" },
  ];

  return (
    <View className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3 gap-2">
      {per100g && (
        <BodyTextNC className="text-xs text-slate-500 mb-1">
          {t("detail.per100g")}
        </BodyTextNC>
      )}
      {rows.map((row) => (
        <View key={row.label} className="flex-row justify-between">
          <BodyText className="text-sm">{row.label}</BodyText>
          <BodyTextNC className="text-sm text-slate-300">
            {row.value} {row.unit}
          </BodyTextNC>
        </View>
      ))}
    </View>
  );
}
