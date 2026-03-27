import { View } from "react-native";
import AppTextNC from "@/components/AppTextNC";
import BodyText from "@/components/BodyText";
import { useTranslation } from "react-i18next";
import type { DailyTotal } from "@/database/nutrition/get-analytics";

type SummaryCardsProps = {
  dailyTotals: DailyTotal[];
};

export default function SummaryCards({ dailyTotals }: SummaryCardsProps) {
  const { t } = useTranslation("nutrition");

  const daysWithData = dailyTotals.length;

  const avg = (fn: (d: DailyTotal) => number) =>
    daysWithData > 0
      ? Math.round(dailyTotals.reduce((sum, d) => sum + fn(d), 0) / daysWithData)
      : 0;

  const cards = [
    { value: avg((d) => d.calories), label: t("analytics.summary.avgCalories") },
    { value: `${avg((d) => d.protein)}g`, label: t("analytics.summary.avgProtein") },
    { value: `${avg((d) => d.carbs)}g`, label: t("analytics.summary.avgCarbs") },
    { value: `${avg((d) => d.fat)}g`, label: t("analytics.summary.avgFat") },
  ];

  return (
    <View className="flex-row flex-wrap gap-3">
      {cards.map((card) => (
        <View
          key={card.label}
          className="flex-1 min-w-[45%] bg-slate-900 rounded-xl p-3 items-center"
        >
          <AppTextNC className="text-xl text-green-400">
            {card.value}
          </AppTextNC>
          <BodyText className="text-xs text-center mt-1">
            {card.label}
          </BodyText>
        </View>
      ))}
    </View>
  );
}
