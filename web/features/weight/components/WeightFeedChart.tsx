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
import { useUserStore } from "@/lib/stores/useUserStore";
import { weight } from "@/types/models";
import { useTranslation } from "react-i18next";

type WeightFeedChartProps = {
  data: weight[];
};

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDatelabel(dateString: string, locale: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
  }).format(date);
}

function generateDateRange(start: Date, end: Date): string[] {
  const dateList: string[] = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dateList.push(toLocalDateString(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dateList;
}

function buildChartData(
  fullDateRange: string[],
  filteredData: weight[],
  allData: weight[],
  locale: string
) {
  const weightMap = new Map(
    filteredData.map((entry) => [entry.created_at.split("T")[0], entry.weight])
  );

  const rangeStart = fullDateRange[0];
  let priorWeight: number | null = null;
  let priorDate = "";
  for (const entry of allData) {
    const entryDate = entry.created_at.split("T")[0];
    if (entryDate < rangeStart && entry.weight !== null && entryDate > priorDate) {
      priorWeight = entry.weight;
      priorDate = entryDate;
    }
  }

  let carry: number | null = priorWeight;
  return fullDateRange.map((date) => {
    if (weightMap.has(date)) {
      carry = weightMap.get(date)!;
    }
    return {
      date,
      weight: carry,
      label: formatDatelabel(date, locale),
    };
  });
}

export default function WeightFeedChart({ data }: WeightFeedChartProps) {
  const { t, i18n } = useTranslation("weight");
  const locale = i18n.language;

  const weightUnit = useUserStore(
    (state) => state.preferences?.weight_unit || "kg"
  );

  // Calculate last 7 days from today
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);

  const filteredData = data.filter((entry) => {
    const entryDate = new Date(entry.created_at);
    return entryDate >= start && entryDate <= end;
  });

  const fullDateRange = generateDateRange(start, end);

  const chartData = buildChartData(fullDateRange, filteredData, data, locale);

  const firstValue = chartData[0]?.weight;
  const lastValue = chartData[chartData.length - 1]?.weight;

  let weightDifference: string | number = "N/A";
  if (firstValue != null && lastValue != null) {
    const diff = lastValue - firstValue;
    const rounded = Math.round(diff * 10) / 10;
    weightDifference =
      rounded > 0
        ? `+ ${rounded}`
        : rounded < 0
          ? `- ${Math.abs(rounded)}`
          : `${rounded}`;
  }

  const weights = chartData
    .map((d) => d.weight)
    .filter((w): w is number => w !== null);
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 100;
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0;

  const yAxisDomain = [Math.floor(minWeight) - 1, Math.round(maxWeight) + 1];

  return (
    <div className="bg-slate-900 shadow-md w-full rounded-md p-4">
      <div className="text-center text-lg mb-2">
        {t("weight.analyticsScreen.range7d")}
      </div>
      <div className="text-center mb-4 text-gray-400">
        {weightDifference} {weightUnit}
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 20, left: -20, bottom: 10 }}
        >
          <defs>
            <linearGradient id="weightGradientFeed" x1="0" y1="0" x2="0" y2="1">
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
            tickFormatter={(value) => formatDatelabel(value, locale)}
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
            fill="url(#weightGradientFeed)"
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
