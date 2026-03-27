"use client";

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
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-slate-900 rounded-xl p-3 text-center"
        >
          <p className="text-xl text-green-400">{card.value}</p>
          <p className="font-body text-xs text-gray-400 mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
