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
  Legend,
} from "recharts";
import { useTranslation } from "react-i18next";
import type { DailyTotal } from "@/database/nutrition/get-analytics";

type RangeType = "week" | "month" | "3months";

type MacroTrendChartProps = {
  range: RangeType;
  dailyTotals: DailyTotal[];
  startDate: string;
  endDate: string;
};

const PROTEIN_COLOR = "#38bdf8";
const CARBS_COLOR = "#f59e0b";
const FAT_COLOR = "#f43f5e";

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

export default function MacroTrendChart({
  range,
  dailyTotals,
  startDate,
  endDate,
}: MacroTrendChartProps) {
  const { t, i18n } = useTranslation("nutrition");

  const dataMap = useMemo(() => {
    const map = new Map<string, DailyTotal>();
    dailyTotals.forEach((d) => map.set(d.date, d));
    return map;
  }, [dailyTotals]);

  const fullRange = useMemo(
    () => generateDateRange(startDate, endDate),
    [startDate, endDate],
  );

  const chartData = useMemo(() => {
    return fullRange.map((date) => {
      const d = dataMap.get(date);
      return {
        label: formatDateLabel(date, range, i18n.language),
        protein: d?.protein ?? 0,
        carbs: d?.carbs ?? 0,
        fat: d?.fat ?? 0,
        date,
      };
    });
  }, [fullRange, dataMap, range, i18n.language]);

  const xAxisInterval = range === "month" ? 4 : range === "3months" ? 6 : 0;

  return (
    <div className="bg-slate-900 rounded-2xl p-4">
      <h3 className="text-lg text-center mb-3 text-gray-100">
        {t("analytics.charts.macros")}
      </h3>
      <ResponsiveContainer width="100%" height={250}>
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
            tickFormatter={(v) => `${Math.round(v)}g`}
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
            formatter={(value: number, name: string) => [`${Math.round(value)}g`, name]}
          />
          <Legend
            wrapperStyle={{ paddingTop: "10px" }}
            formatter={(value) => (
              <span style={{ color: "#f3f4f6", fontSize: "12px" }}>{value}</span>
            )}
          />
          <Bar
            name={t("daily.protein")}
            dataKey="protein"
            stackId="macros"
            fill={PROTEIN_COLOR}
          />
          <Bar
            name={t("daily.carbs")}
            dataKey="carbs"
            stackId="macros"
            fill={CARBS_COLOR}
          />
          <Bar
            name={t("daily.fat")}
            dataKey="fat"
            stackId="macros"
            fill={FAT_COLOR}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
