"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  Cell,
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
        value: d?.calories ?? 0,
        tdee: d?.tdee ?? null,
        date,
        hasData: dataMap.has(date),
      };
    });
  }, [fullRange, dataMap, range, i18n.language]);

  const maxCal = useMemo(() => {
    const vals = chartData.map((d) => d.value);
    const tdeeVals = chartData.map((d) => d.tdee ?? 0);
    return Math.max(...vals, ...tdeeVals, calorieGoal, 500);
  }, [chartData, calorieGoal]);

  const balanceStats = useMemo(() => {
    const daysWithTdee = chartData.filter((d) => d.hasData && d.tdee !== null);
    if (daysWithTdee.length === 0) return null;
    let overDays = 0;
    let underDays = 0;
    let totalBalance = 0;
    for (const d of daysWithTdee) {
      const balance = d.value - d.tdee!;
      totalBalance += balance;
      if (balance > 0) overDays++;
      else underDays++;
    }
    return {
      overDays,
      underDays,
      avgBalance: Math.round(totalBalance / daysWithTdee.length),
    };
  }, [chartData]);

  const xAxisInterval = range === "month" ? 4 : range === "3months" ? 6 : 0;

  return (
    <div className="bg-slate-900 rounded-2xl p-4">
      <h3 className="text-lg text-center mb-3 text-gray-100">
        {t("analytics.charts.calories")}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
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
            formatter={(value: number, name: string, _: unknown, index: number, payload: Array<{ payload?: { hasData: boolean; value: number } }>) => {
              if (name === "tdee") return [<span key="tdee-val" style={{ color: "#38bdf8" }}>{value} kcal</span>, "TDEE"];
              const entry = payload?.[index]?.payload;
              const isOver = entry?.hasData && entry.value > calorieGoal * 1.05;
              return [<span key="cal-val" style={{ color: isOver ? "#f59e0b" : "#22c55e" }}>{value} kcal</span>];
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((d, i) => (
              <Cell
                key={i}
                fill={
                  !d.hasData
                    ? "transparent"
                    : d.value <= calorieGoal * 1.05
                      ? "#22c55e"
                      : "#f59e0b"
                }
              />
            ))}
          </Bar>
          <ReferenceLine
            y={calorieGoal}
            stroke="#ff00ff"
            strokeDasharray="6 4"
            strokeWidth={1.5}
          />
          <Line
            dataKey="tdee"
            type="monotone"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={{ fill: "#38bdf8", r: 3 }}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <svg width="24" height="2">
            <line x1="0" y1="1" x2="24" y2="1" stroke="#ff00ff" strokeWidth="2" strokeDasharray="4 3" />
          </svg>
          <span className="font-body text-xs text-fuchsia-400">
            {t("analytics.charts.goal")} ({calorieGoal} kcal)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="24" height="10">
            <line x1="0" y1="5" x2="24" y2="5" stroke="#38bdf8" strokeWidth="2" />
          </svg>
          <span className="font-body text-xs text-sky-400">
            {t("analytics.charts.tdee")}
          </span>
        </div>
      </div>
      {/* Balance stats */}
      {balanceStats && (
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className="font-body text-xs text-gray-400">
            {t("analytics.charts.overDays", { count: balanceStats.overDays })}
            {" / "}
            {t("analytics.charts.underDays", { count: balanceStats.underDays })}
          </span>
          <span className={`font-body text-xs ${balanceStats.avgBalance > 0 ? "text-amber-400" : "text-green-400"}`}>
            {t("analytics.charts.avgBalance", {
              value: `${balanceStats.avgBalance > 0 ? "+" : ""}${balanceStats.avgBalance}`,
            })}
          </span>
        </div>
      )}
    </div>
  );
}
