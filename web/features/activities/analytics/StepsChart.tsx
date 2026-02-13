"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StepRecord } from "@/database/activities/get-steps";
import { useTranslation } from "react-i18next";

type StepsChartProps = {
  range: "week" | "month" | "3months";
  data: StepRecord[];
};

function getRangeDays(range: "week" | "month" | "3months"): number {
  switch (range) {
    case "week":
      return 7;
    case "month":
      return 30;
    case "3months":
      return 90;
  }
}

function addOffsetToDate(
  base: Date,
  range: "week" | "month" | "3months",
  offset: number
): [Date, Date] {
  const end = new Date(base);
  const start = new Date(base);

  const days = getRangeDays(range);
  start.setDate(end.getDate() - (days - 1));

  const diff = end.getTime() - start.getTime() + 1;
  end.setTime(end.getTime() - diff * offset);
  start.setTime(start.getTime() - diff * offset);

  return [start, end];
}

function formatDateLabel(
  dateString: string,
  range: "week" | "month" | "3months",
  locale: string
): string {
  const date = new Date(dateString);
  switch (range) {
    case "week":
      return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
    case "month":
      return new Intl.DateTimeFormat(locale, { day: "numeric" }).format(date);
    case "3months":
      return new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
  }
}

function generateDateRange(start: Date, end: Date): string[] {
  const dateList: string[] = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dateList.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dateList;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return num.toString();
}

export default function StepsChart({ range, data }: StepsChartProps) {
  const { t, i18n } = useTranslation("activities");
  const locale = i18n.language;
  const [offset, setOffset] = useState(0);
  const [prevRange, setPrevRange] = useState(range);

  // Reset offset when range changes
  if (range !== prevRange) {
    setPrevRange(range);
    setOffset(0);
  }

  const today = useMemo(() => new Date(), []);
  const [start, end] = addOffsetToDate(today, range, offset);

  const fullDateRange = generateDateRange(start, end);

  const stepsMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((record) => {
      map.set(record.day, record.steps);
    });
    return map;
  }, [data]);

  const chartData = useMemo(() => {
    if (range === "3months") {
      const weeklyData: { label: string; value: number; count: number; date: string }[] = [];
      let weekSum = 0;
      let weekCount = 0;
      let currentWeekLabel = "";
      let weekStartDate = "";

      fullDateRange.forEach((date, index) => {
        const steps = stepsMap.get(date) || 0;
        weekSum += steps;
        if (steps > 0) weekCount++;

        if (index % 7 === 0) {
          currentWeekLabel = formatDateLabel(date, range, locale);
          weekStartDate = date;
        }

        if ((index + 1) % 7 === 0 || index === fullDateRange.length - 1) {
          weeklyData.push({
            label: currentWeekLabel,
            value: weekCount > 0 ? Math.round(weekSum / weekCount) : 0,
            count: weekCount,
            date: weekStartDate,
          });
          weekSum = 0;
          weekCount = 0;
        }
      });

      return weeklyData;
    }

    return fullDateRange.map((date) => ({
      label: formatDateLabel(date, range, locale),
      value: stepsMap.get(date) || 0,
      date,
    }));
  }, [fullDateRange, stepsMap, range, locale]);

  const totalSteps = useMemo(() => {
    return fullDateRange.reduce((sum, date) => {
      return sum + (stepsMap.get(date) || 0);
    }, 0);
  }, [fullDateRange, stepsMap]);

  const avgSteps = useMemo(() => {
    const daysWithData = fullDateRange.filter(
      (date) => (stepsMap.get(date) || 0) > 0
    ).length;
    return daysWithData > 0 ? Math.round(totalSteps / daysWithData) : 0;
  }, [fullDateRange, stepsMap, totalSteps]);

  const values = chartData.map((item) => item.value);
  const maxSteps = Math.max(...values, 1000);

  function formatDateRange(start: Date, end: Date) {
    const startFormatted = start.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
    });
    const endFormatted = end.toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    return `${startFormatted} - ${endFormatted}`;
  }

  const rangeLabels = {
    week: t("activities.analyticsScreen.weeklyTotal"),
    month: t("activities.analyticsScreen.monthlyTotal"),
    "3months": t("activities.analyticsScreen.threeMonthsTotal"),
  };

  const xAxisInterval = range === "month" ? 4 : range === "3months" ? 2 : 0;

  return (
    <div className="bg-slate-900 shadow-md w-full rounded-2xl p-4">
      <h3 className="text-lg font-medium text-center mb-2 text-gray-100">
        {t("activities.analyticsScreen.dailySteps")}
      </h3>
      <div className="flex justify-center items-center mb-4">
        <button
          onClick={() => setOffset((prev) => prev + 1)}
          className="mr-4 bg-slate-800 p-1 rounded hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft color="#4ade80" size={20} />
        </button>
        <span className="min-w-[200px] text-center text-sm text-gray-200">
          {formatDateRange(start, end)}
        </span>
        <button
          onClick={() => setOffset((prev) => Math.max(0, prev - 1))}
          disabled={offset === 0}
          className={`ml-4 bg-slate-800 p-1 rounded transition-all ${
            offset === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-700"
          }`}
        >
          <ChevronRight color={offset === 0 ? "#f3f4f6" : "#4ade80"} size={20} />
        </button>
      </div>

      <div className="flex justify-around px-4 mb-4">
        <div className="text-center">
          <span className="text-gray-400 text-xs block">{rangeLabels[range]}</span>
          <span className="text-xl text-green-400">
            {formatNumber(totalSteps)}
          </span>
        </div>
        <div className="text-center">
          <span className="text-gray-400 text-xs block">
            {t("activities.analyticsScreen.dailyAvg")}
          </span>
          <span className="text-xl text-green-400">
            {formatNumber(avgSteps)}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 20, right: 15, bottom: 20, left: 0 }}>
          <defs>
            <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#374151"
            strokeWidth={0.5}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "#f3f4f6", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            interval={xAxisInterval}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatNumber}
            domain={[0, Math.ceil(maxSteps / 1000) * 1000]}
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
              if (payload && payload[0]) {
                const date = new Date(payload[0].payload.date);
                return date.toLocaleDateString(locale, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
              }
              return "";
            }}
            formatter={(value: number) => [
              `${value.toLocaleString()} ${t("activities.analyticsScreen.steps")}`,
            ]}
          />
          <Bar
            dataKey="value"
            fill="url(#stepsGradient)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
