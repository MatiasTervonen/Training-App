"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useTranslation } from "react-i18next";
import type { DailyTotal } from "@/database/nutrition/get-analytics";

type RangeType = "week" | "month" | "3months";

type CalorieTrendChartProps = {
  range: RangeType;
  dailyTotals: DailyTotal[];
  startDate: string;
  endDate: string;
};

function formatDateLabel(
  dateString: string,
  range: RangeType,
  locale: string,
): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  switch (range) {
    case "week":
      return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
    case "month":
      return new Intl.DateTimeFormat(locale, { day: "numeric" }).format(date);
    case "3months":
      return new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
      }).format(date);
  }
}

function generateDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  const endDate = new Date(end);
  while (current <= endDate) {
    dates.push(current.toLocaleDateString("en-CA"));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export default function CalorieTrendChart({
  range,
  dailyTotals,
  startDate,
  endDate,
}: CalorieTrendChartProps) {
  const { t, i18n } = useTranslation("nutrition");

  const calorieGoal = dailyTotals[0]?.calorie_goal ?? 2000;

  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    dailyTotals.forEach((d) => map.set(d.date, d.calories));
    return map;
  }, [dailyTotals]);

  const fullRange = useMemo(
    () => generateDateRange(startDate, endDate),
    [startDate, endDate],
  );

  const chartData = useMemo(() => {
    return fullRange.map((date) => ({
      label: formatDateLabel(date, range, i18n.language),
      value: dataMap.get(date) ?? 0,
      date,
      hasData: dataMap.has(date),
    }));
  }, [fullRange, dataMap, range, i18n.language]);

  const maxCal = useMemo(() => {
    const vals = chartData.map((d) => d.value);
    return Math.max(...vals, calorieGoal, 500);
  }, [chartData, calorieGoal]);

  const xAxisInterval = range === "month" ? 4 : range === "3months" ? 6 : 0;

  return (
    <div className="bg-slate-900 rounded-2xl p-4">
      <h3 className="text-lg text-center mb-3 text-gray-100">
        {t("analytics.charts.calories")}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#374151"
            strokeWidth={0.5}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "#f3f4f6", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={xAxisInterval}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={[0, Math.ceil(maxCal / 500) * 500 + 500]}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
          />
          <Tooltip
            cursor={false}
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "#22c55e",
              color: "#f3f4f6",
              borderRadius: "8px",
            }}
            labelFormatter={(_, payload) => {
              if (payload?.[0]) {
                const [y, m, d] = payload[0].payload.date.split("-").map(Number);
                return new Date(y, m - 1, d).toLocaleDateString(i18n.language, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
              }
              return "";
            }}
            formatter={(value: number) => [`${value} kcal`]}
          />
          <ReferenceLine
            y={calorieGoal}
            stroke="#ff00ff"
            strokeDasharray="6 4"
            strokeWidth={1.5}
          />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            fill="#22c55e"
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-2 mt-2">
        <svg width="24" height="2">
          <line x1="0" y1="1" x2="24" y2="1" stroke="#ff00ff" strokeWidth="2" strokeDasharray="4 3" />
        </svg>
        <span className="font-body text-xs text-fuchsia-400">
          {t("analytics.charts.goal")} ({calorieGoal} kcal)
        </span>
      </div>
    </div>
  );
}
