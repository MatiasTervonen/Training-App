"use client";

import { useState, useMemo } from "react";
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
import { ModalSwipeBlocker } from "@/app/(app)/components/modal";
import { HistoryResult } from "@/app/(app)/types/session";
import { useTranslation } from "react-i18next";

type RangeType = "1m" | "3m" | "6m" | "1y";

type ExerciseHistoryChartProps = {
  history: HistoryResult;
  isCardio: boolean;
  valueUnit: string;
};

function getRangeStartDate(end: Date, range: RangeType): Date {
  const start = new Date(end);
  switch (range) {
    case "1m":
      start.setMonth(start.getMonth() - 1);
      break;
    case "3m":
      start.setMonth(start.getMonth() - 3);
      break;
    case "6m":
      start.setMonth(start.getMonth() - 6);
      break;
    case "1y":
      start.setFullYear(start.getFullYear() - 1);
      break;
  }
  return start;
}

function getRangeDurationMs(range: RangeType): number {
  switch (range) {
    case "1m":
      return 30 * 24 * 60 * 60 * 1000;
    case "3m":
      return 90 * 24 * 60 * 60 * 1000;
    case "6m":
      return 180 * 24 * 60 * 60 * 1000;
    case "1y":
      return 365 * 24 * 60 * 60 * 1000;
  }
}

export default function ExerciseHistoryChart({
  history,
  isCardio,
  valueUnit,
}: ExerciseHistoryChartProps) {
  const { t, i18n } = useTranslation("gym");
  const locale = i18n.language;

  const [range, setRange] = useState<RangeType>("3m");
  const [offset, setOffset] = useState(0);
  const [prevRange, setPrevRange] = useState(range);

  if (range !== prevRange) {
    setPrevRange(range);
    setOffset(0);
  }

  // Chart data - sorted chronologically
  const allChartData = useMemo(() => {
    if (!history || history.length === 0) return [];

    const sorted = [...history].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return sorted
      .map((session) => {
        if (isCardio) {
          const bestSet = session.sets.reduce(
            (best, s) =>
              (s.distance_meters || 0) > (best.distance_meters || 0)
                ? s
                : best,
            session.sets[0],
          );
          if (!bestSet?.distance_meters) return null;
          return {
            date: session.date,
            value: bestSet.distance_meters,
            reps: bestSet.time_min || 0,
          };
        } else {
          const bestSet = session.sets.reduce(
            (best, s) =>
              (s.weight || 0) > (best.weight || 0) ? s : best,
            session.sets[0],
          );
          if (!bestSet?.weight) return null;
          return {
            date: session.date,
            value: bestSet.weight,
            reps: bestSet.reps || 0,
          };
        }
      })
      .filter(Boolean) as { date: string; value: number; reps: number }[];
  }, [history, isCardio]);

  // Date boundaries
  const latestDate = useMemo(() => {
    if (allChartData.length === 0) return new Date();
    return new Date(
      Math.max(...allChartData.map((d) => new Date(d.date).getTime())),
    );
  }, [allChartData]);

  const oldestDate = useMemo(() => {
    if (allChartData.length === 0) return new Date();
    return new Date(
      Math.min(...allChartData.map((d) => new Date(d.date).getTime())),
    );
  }, [allChartData]);

  // Filtered chart data based on range + offset
  const { filteredChartData, rangeStart, rangeEnd, canGoBack } = useMemo(() => {
    const durationMs = getRangeDurationMs(range);
    const end = new Date(latestDate.getTime() - durationMs * offset);
    const startFromRange = getRangeStartDate(end, range);

    const filtered = allChartData.filter((d) => {
      const date = new Date(d.date);
      return date >= startFromRange && date <= end;
    });

    const nextEnd = new Date(latestDate.getTime() - durationMs * (offset + 1));
    const nextStart = getRangeStartDate(nextEnd, range);

    return {
      filteredChartData: filtered,
      rangeStart: startFromRange,
      rangeEnd: end,
      canGoBack: nextStart >= oldestDate,
    };
  }, [allChartData, range, offset, latestDate, oldestDate]);

  // Chart axis config
  const { yAxisDomain, xTickFormatter } = useMemo(() => {
    const values = filteredChartData.map((d) => d.value);
    const max = values.length > 0 ? Math.max(...values) : 100;
    const min = values.length > 0 ? Math.min(...values) : 0;
    const domain: [number, number] = [Math.floor(min) - 1, Math.round(max) + 1];

    const formatter = (dateStr: string) => {
      const date = new Date(dateStr);
      if (range === "1m" || range === "3m" || range === "6m") {
        return new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "short",
        }).format(date);
      }
      return new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
    };

    return { yAxisDomain: domain, xTickFormatter: formatter };
  }, [filteredChartData, range, locale]);

  const chartDataFormatted = filteredChartData.map((d) => ({
    ...d,
    label: xTickFormatter(d.date),
  }));

  const ranges: { key: RangeType; label: string }[] = [
    { key: "1m", label: t("gym.exerciseHistory.range1m") },
    { key: "3m", label: t("gym.exerciseHistory.range3m") },
    { key: "6m", label: t("gym.exerciseHistory.range6m") },
    { key: "1y", label: t("gym.exerciseHistory.range1y") },
  ];

  function formatDateRange(start: Date, end: Date) {
    const fmt = (d: Date) =>
      d.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    return `${fmt(start)} - ${fmt(end)}`;
  }

  if (allChartData.length < 2) return null;

  return (
    <div className="mt-6">
      {/* Range Selector */}
      <div className="flex justify-center mb-4">
        <div className="flex bg-slate-800 rounded-lg p-1">
          {ranges.map((option) => (
            <button
              key={option.key}
              onClick={() => setRange(option.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                range === option.key
                  ? "bg-slate-700 text-cyan-400"
                  : "text-gray-200 hover:text-gray-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range + Navigation */}
      <div className="bg-slate-900 shadow-md pt-4 rounded-md">
        <div className="flex justify-center items-center  text-gray-400">
          <button
            onClick={() => setOffset((prev) => prev + 1)}
            disabled={!canGoBack}
            className={`mr-3 bg-slate-800 p-1 rounded transition-opacity ${
              !canGoBack ? "opacity-50" : ""
            }`}
          >
            <ChevronLeft size={20} color={canGoBack ? "#22d3ee" : "#f3f4f6"} />
          </button>
          <span className="text-center text-gray-100 text-sm">
            {formatDateRange(rangeStart, rangeEnd)}
          </span>
          <button
            onClick={() => setOffset((prev) => Math.max(0, prev - 1))}
            disabled={offset === 0}
            className={`ml-3 bg-slate-800 p-1 rounded transition-opacity ${
              offset === 0 ? "opacity-50" : ""
            }`}
          >
            <ChevronRight
              size={20}
              color={offset === 0 ? "#f3f4f6" : "#22d3ee"}
            />
          </button>
        </div>

        {/* Chart */}
        {filteredChartData.length >= 2 ? (
          <ModalSwipeBlocker>
            <div className="bg-slate-900 shadow-md pt-4 rounded-md">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart
                  data={chartDataFormatted}
                  margin={{ top: 20, right: 30, left: -20, bottom: 20 }}
                >
                  <defs>
                    <linearGradient
                      id="exerciseGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="rgba(56, 189, 248, 0.4)" />
                      <stop
                        offset="100%"
                        stopColor="rgba(56, 189, 248, 0.05)"
                      />
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
                    tickFormatter={xTickFormatter}
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
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      const date = new Date(data.date);
                      const dateLabel = date.toLocaleDateString(locale, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      });
                      return (
                        <div
                          style={{
                            backgroundColor: "#0f172a",
                            border: "1px solid #3b82f6",
                            borderRadius: "8px",
                            padding: "8px 12px",
                            color: "#f3f4f6",
                          }}
                        >
                          <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>
                            {dateLabel}
                          </p>
                          <p style={{ fontSize: 14 }}>
                            {isCardio
                              ? `${data.value} m · ${data.reps} ${t("gym.exerciseHistory.timeMin").toLowerCase()}`
                              : `${data.value} ${valueUnit} x ${data.reps} ${t("gym.exerciseCard.reps").toLowerCase()}`}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#93c5fd"
                    strokeWidth={3}
                    fill="url(#exerciseGradient)"
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
          </ModalSwipeBlocker>
        ) : (
          <p className="text-center text-gray-400 text-sm py-4">
            {t("gym.exerciseHistory.noChartData")}
          </p>
        )}
      </div>
    </div>
  );
}
