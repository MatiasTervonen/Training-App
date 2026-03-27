"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useTranslation } from "react-i18next";
import type { DailyTotal } from "@/database/nutrition/get-analytics";

type MacroDistributionChartProps = {
  dailyTotals: DailyTotal[];
};

const PROTEIN_COLOR = "#38bdf8";
const CARBS_COLOR = "#f59e0b";
const FAT_COLOR = "#f43f5e";

export default function MacroDistributionChart({
  dailyTotals,
}: MacroDistributionChartProps) {
  const { t } = useTranslation("nutrition");

  const totals = useMemo(() => {
    const protein = dailyTotals.reduce((s, d) => s + d.protein, 0);
    const carbs = dailyTotals.reduce((s, d) => s + d.carbs, 0);
    const fat = dailyTotals.reduce((s, d) => s + d.fat, 0);
    return { protein, carbs, fat };
  }, [dailyTotals]);

  const totalGrams = totals.protein + totals.carbs + totals.fat;

  const chartData = useMemo(() => {
    if (totalGrams === 0) return [];
    return [
      { name: t("daily.protein"), value: Math.round(totals.protein), color: PROTEIN_COLOR },
      { name: t("daily.carbs"), value: Math.round(totals.carbs), color: CARBS_COLOR },
      { name: t("daily.fat"), value: Math.round(totals.fat), color: FAT_COLOR },
    ];
  }, [totals, totalGrams, t]);

  if (totalGrams === 0) return null;

  return (
    <div className="bg-slate-900 rounded-2xl p-4">
      <h3 className="text-lg text-center mb-3 text-gray-100">
        {t("analytics.charts.distribution")}
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            stroke="#0f172a"
            strokeWidth={2}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={{ outline: "none" }}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "#ff00ff",
              color: "#f3f4f6",
              borderRadius: "8px",
            }}
            itemStyle={{ color: "#f3f4f6" }}
            labelStyle={{ color: "#f3f4f6" }}
            formatter={(value: number, name: string) => {
              const pct = totalGrams > 0 ? Math.round((value / totalGrams) * 100) : 0;
              return [`${value}g (${pct}%)`, name];
            }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => {
              const item = chartData.find((d) => d.name === value);
              const pct = item && totalGrams > 0
                ? Math.round((item.value / totalGrams) * 100)
                : 0;
              return (
                <span style={{ color: "#f3f4f6", fontSize: "12px" }}>
                  {value} {pct}%
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
