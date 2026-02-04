"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import { weight } from "@/app/(app)/types/models";
import { useTranslation } from "react-i18next";

type WeightChartProps = {
  range: "week" | "month" | "year";
  data: weight[];
};

function addOffsetToDate(
  base: Date,
  range: string,
  offset: number
): [Date, Date] {
  const end = new Date(base);
  const start = new Date(base);

  switch (range) {
    case "week":
      start.setDate(end.getDate() - 6);
      break;
    case "month":
      start.setMonth(end.getMonth() - 1);
      break;
    case "year":
      start.setFullYear(end.getFullYear() - 1);
      break;
  }

  // Shift start and end based on offset
  const diff = end.getTime() - start.getTime() + 1;
  end.setTime(end.getTime() - diff * offset);
  start.setTime(start.getTime() - diff * offset);

  return [start, end];
}

function getLatestDate(data: weight[]) {
  return new Date(
    Math.max(...data.map((entry) => new Date(entry.created_at).getTime()))
  );
}

function getOldestDate(data: weight[]) {
  return new Date(
    Math.min(...data.map((entry) => new Date(entry.created_at).getTime()))
  );
}

function formatDatelabel(
  dateString: string,
  range: "week" | "month" | "year",
  locale: string
): string {
  const date = new Date(dateString);
  switch (range) {
    case "week":
      return new Intl.DateTimeFormat(locale, {
        weekday: "short",
      }).format(date);
    case "month":
      return new Intl.DateTimeFormat(locale, {
        day: "numeric",
      }).format(date);
    case "year":
      return new Intl.DateTimeFormat(locale, {
        month: "short",
      }).format(date);
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

function fillMissingDatesWithCarry(
  fullDates: string[],
  entries: weight[]
): { date: string; weight: number | null }[] {
  const weightMap = new Map(
    entries.map((entry) => [entry.created_at.split("T")[0], entry.weight])
  );

  let lastKnownWeight: number | null = null;

  return fullDates.map((date) => {
    if (weightMap.has(date)) {
      lastKnownWeight = weightMap.get(date)!;
    }
    return {
      date,
      weight: lastKnownWeight,
    };
  });
}

function generateXTicks(range: string, dateList: string[]): string[] {
  const result: string[] = [];

  for (let i = 0; i < dateList.length; i++) {
    const date = new Date(dateList[i]);

    switch (range) {
      case "week":
        result.push(dateList[i]);
        break;
      case "month":
        if (date.getDate() % 5 === 0) result.push(dateList[i]);
        break;
      case "year":
        if (date.getDate() === 1) result.push(dateList[i]);
        break;
    }
  }

  return result;
}

export default function WeightChart({ range, data }: WeightChartProps) {
  const { t, i18n } = useTranslation("weight");
  const locale = i18n.language;
  const [offset, setOffset] = useState(0);
  const [prevRange, setPrevRange] = useState(range);

  // Reset offset when range changes (during render, not in effect)
  if (range !== prevRange) {
    setPrevRange(range);
    setOffset(0);
  }

  const latestDate = getLatestDate(data);
  const oldestDate = getOldestDate(data);

  const [calculatedStart, end] = addOffsetToDate(latestDate, range, offset);

  // For year range, clamp start to oldest record if not enough data
  const start =
    range === "year" && calculatedStart < oldestDate
      ? oldestDate
      : calculatedStart;

  // Check if we can go back further (for disabling back button)
  const [nextStart] = addOffsetToDate(latestDate, range, offset + 1);
  const canGoBack = nextStart >= oldestDate;

  const weightUnit = useUserStore(
    (state) => state.preferences?.weight_unit || "kg"
  );

  const filteredData = data.filter((entry) => {
    const entryDate = new Date(entry.created_at);
    return entryDate >= start && entryDate <= end;
  });

  const firstEntry = filteredData.find((entry) => entry.weight !== null);
  const lastEntry = [...filteredData]
    .reverse()
    .find((entry) => entry.weight !== null);

  let weightDifference: string | number = "N/A";

  if (firstEntry && lastEntry) {
    const diff = lastEntry.weight - firstEntry.weight;
    const rounded = Math.round(diff * 10) / 10;

    weightDifference =
      rounded > 0
        ? `+ ${rounded}`
        : rounded < 0
          ? `- ${Math.abs(rounded)}`
          : `${rounded}`;
  }

  const fullDateRange = generateDateRange(start, end);
  const chartData = fillMissingDatesWithCarry(fullDateRange, filteredData)
    .filter((item) => item.weight !== null)
    .map((item) => ({
      date: item.date,
      weight: item.weight,
      label: formatDatelabel(item.date, range, locale),
    }));

  function formatDateRange(start: Date | null, end: Date | null) {
    if (!start || !end) return t("weight.analyticsScreen.noData");
    const startFormatted = start.toLocaleDateString(locale, {
      year: "numeric",
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

  const xTicks = generateXTicks(range, fullDateRange);

  const weights = chartData
    .map((d) => d.weight)
    .filter((w): w is number => w !== null);
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 100;
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0;

  const yAxisDomain = [Math.floor(minWeight) - 1, Math.round(maxWeight) + 1];

  const rangeLabels: Record<string, string> = {
    week: t("weight.analyticsScreen.week"),
    month: t("weight.analyticsScreen.month"),
    year: t("weight.analyticsScreen.year"),
  };

  return (
    <div className="bg-slate-900 shadow-md pt-4">
      <div className="flex justify-center items-center my-4 text-gray-400">
        <button
          onClick={() => setOffset((prev) => prev + 1)}
          disabled={!canGoBack}
          className={`mr-4 bg-slate-800 p-1 rounded transition-opacity ${
            !canGoBack ? "opacity-50" : ""
          }`}
        >
          <ChevronLeft color={canGoBack ? "#22d3ee" : "#f3f4f6"} />
        </button>
        <span className="min-w-[200px] text-center text-gray-100">
          {formatDateRange(start, end)}
        </span>
        <button
          onClick={() => setOffset((prev) => Math.max(0, prev - 1))}
          disabled={offset === 0}
          className={`ml-4 bg-slate-800 p-1 rounded transition-opacity ${
            offset === 0 ? "opacity-50" : ""
          }`}
        >
          <ChevronRight color={offset === 0 ? "#f3f4f6" : "#22d3ee"} />
        </button>
      </div>
      <div className="flex justify-center items-center mb-4 px-10">
        <span className="text-gray-100">
          {rangeLabels[range]}: {weightDifference} {weightUnit}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 20, left: -20, bottom: 40 }}
        >
          <defs>
            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.4)" />
              <stop offset="100%" stopColor="rgba(56, 189, 248, 0.05)" />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#9ca3af"
            strokeWidth={0.5}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            ticks={xTicks}
            tickFormatter={(value) => formatDatelabel(value, range, locale)}
            tick={{ fill: "#f3f4f6", fontSize: 12 }}
            axisLine={{ stroke: "#9ca3af" }}
            tickLine={{ stroke: "#9ca3af" }}
          />
          <YAxis
            tick={{ fill: "#f3f4f6", fontSize: 12 }}
            domain={yAxisDomain}
            axisLine={{ stroke: "#9ca3af" }}
            tickLine={{ stroke: "#9ca3af" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "#3b82f6",
              color: "#f3f4f6",
              borderRadius: "8px",
            }}
            labelFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString(locale, {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
            }}
            formatter={(value: number) => [`${value} ${weightUnit}`]}
          />
          <Area
            type="monotone"
            dataKey="weight"
            stroke="#93c5fd"
            strokeWidth={3}
            fill="url(#weightGradient)"
            connectNulls={true}
            dot={false}
            activeDot={{
              r: 6,
              fill: "#3b82f6",
              stroke: "#60a5fa",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
