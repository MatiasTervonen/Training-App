"use client";

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
    <div
      className={`rounded-lg border overflow-hidden ${per100g ? "border-slate-700/50" : "border-slate-600/50"}`}
      style={{
        background: per100g
          ? "linear-gradient(135deg, #0f172a, #1a2332)"
          : "linear-gradient(135deg, #0c1322, #162032)",
      }}
    >
      <div className="p-3 flex flex-col gap-2">
        {per100g && (
          <span className="font-body text-xs text-slate-500 mb-1">
            {t("detail.per100g")}
          </span>
        )}
        {mainRows.map((row) => (
          <div key={row.label} className="flex justify-between">
            <span className="font-body text-sm">{row.label}</span>
            <span className="font-body text-sm text-slate-300">
              {row.value} {row.unit}
            </span>
          </div>
        ))}
        {extraRows.length > 0 && (
          <>
            <div className="border-t border-slate-700/50 mt-1 pt-2" />
            {extraRows.map((row) => (
              <div key={row.label} className="flex justify-between">
                <span className="font-body text-sm text-slate-400">{row.label}</span>
                <span className="font-body text-sm text-slate-400">
                  {row.value} {row.unit}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
