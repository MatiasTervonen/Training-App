import { useState, useEffect, useRef, useMemo } from "react";
import { View } from "react-native";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import { SkiaRenderer, SkiaChart } from "@wuba/react-native-echarts";
import { HistoryResult } from "@/types/session";
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

echarts.use([SkiaRenderer, LineChart, GridComponent]);

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
  const [size, setSize] = useState({ width: 0, height: 0 });
  const skiaRef = useRef<any>(null);

  if (range !== prevRange) {
    setPrevRange(range);
    setOffset(0);
  }

  // Chart data - best set per session, sorted chronologically
  const allChartData = useMemo(() => {
    if (!history || history.length === 0) return [];

    const sorted = [...history]
      .filter(Boolean)
      .sort(
        (a, b) => new Date(a!.date).getTime() - new Date(b!.date).getTime(),
      );

    return sorted
      .map((session) => {
        if (!session) return null;
        if (isCardio) {
          const bestSet = session.sets.reduce(
            (best, s) =>
              (s.distance_meters || 0) > (best.distance_meters || 0) ? s : best,
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
            (best, s) => ((s.weight || 0) > (best.weight || 0) ? s : best),
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

  // X-axis tick formatter
  const xTickFormatter = useMemo(() => {
    return (dateStr: string) => {
      const date = new Date(dateStr);
      if (range === "1m" || range === "3m" || range === "6m") {
        return new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "short",
        }).format(date);
      }
      return new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
    };
  }, [range, locale]);

  // Echarts option
  const option = useMemo(() => {
    if (filteredChartData.length < 2) return null;

    const values = filteredChartData.map((d) => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);

    return {
      xAxis: {
        type: "category",
        data: filteredChartData.map((d) => xTickFormatter(d.date)),
        axisLabel: {
          color: "#f3f4f6",
          fontSize: 12,
        },
        axisLine: { lineStyle: { color: "#9ca3af" } },
        axisTick: { lineStyle: { color: "#9ca3af" } },
      },
      yAxis: {
        type: "value",
        min: Math.floor(min) - 1,
        max: Math.round(max) + 1,
        splitLine: {
          show: true,
          lineStyle: {
            color: "#9ca3af",
            width: 0.5,
            type: "dashed",
          },
        },
        axisLabel: {
          color: "#f3f4f6",
          fontSize: 12,
        },
      },
      series: [
        {
          data: filteredChartData.map((d) => d.value),
          type: "line",
          smooth: true,
          showSymbol: false,
          itemStyle: {
            color: "#3b82f6",
            borderColor: "#60a5fa",
            borderWidth: 2,
          },
          lineStyle: {
            color: "#93c5fd",
            width: 3,
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(56, 189, 248, 0.4)" },
                { offset: 1, color: "rgba(56, 189, 248, 0.05)" },
              ],
            },
          },
        },
      ],
      grid: { top: 20, right: 20, bottom: 40, left: 20 },
    };
  }, [filteredChartData, xTickFormatter]);

  // Render echarts
  useEffect(() => {
    if (!skiaRef.current || !option || size.width === 0) return;

    const chart = echarts.init(skiaRef.current, "light", {
      renderer: "skia",
      width: size.width,
      height: size.height,
    } as any);

    chart.setOption(option);

    return () => chart.dispose();
  }, [option, size]);

  function formatDateRange(start: Date, end: Date) {
    const fmt = (d: Date) =>
      d.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    return `${fmt(start)} - ${fmt(end)}`;
  }

  const ranges: { key: RangeType; label: string }[] = [
    { key: "1m", label: t("gym.exerciseHistory.range1m") },
    { key: "3m", label: t("gym.exerciseHistory.range3m") },
    { key: "6m", label: t("gym.exerciseHistory.range6m") },
    { key: "1y", label: t("gym.exerciseHistory.range1y") },
  ];

  if (allChartData.length < 2) return null;

  return (
    <View className="mt-6">
      {/* Range Selector */}
      <View className="flex-row mb-4">
        <View className="flex-row flex-1 bg-slate-800 rounded-lg p-1">
          {ranges.map((opt) => (
            <AnimatedButton
              key={opt.key}
              onPress={() => setRange(opt.key)}
              tabClassName="flex-1"
              className={`px-5 py-2 rounded-md ${
                range === opt.key ? "bg-slate-700" : ""
              }`}
              hitSlop={20}
            >
              <AppTextNC
                className={`text-center font-medium ${
                  range === opt.key ? "text-cyan-400" : "text-gray-200"
                }`}
              >
                {opt.label}
              </AppTextNC>
            </AnimatedButton>
          ))}
        </View>
      </View>

      {/* Date Range + Navigation */}
      <View className="bg-slate-900 shadow-md pt-4 rounded-md">
        <View className="flex-row justify-center items-center">
          <AnimatedButton
            onPress={() => setOffset((prev) => prev + 1)}
            className="mr-3 bg-slate-800 p-1 rounded"
            disabled={!canGoBack}
            style={{ opacity: canGoBack ? 1 : 0.5 }}
            hitSlop={20}
          >
            <ChevronLeft size={20} color={canGoBack ? "#22d3ee" : "#f3f4f6"} />
          </AnimatedButton>
          <AppText className="text-center text-sm min-w-[200px]">
            {formatDateRange(rangeStart, rangeEnd)}
          </AppText>
          <AnimatedButton
            onPress={() => setOffset((prev) => Math.max(0, prev - 1))}
            className="ml-3 bg-slate-800 p-1 rounded"
            disabled={offset === 0}
            style={{ opacity: offset === 0 ? 0.5 : 1 }}
            hitSlop={20}
          >
            <ChevronRight
              size={20}
              color={offset === 0 ? "#f3f4f6" : "#22d3ee"}
            />
          </AnimatedButton>
        </View>

        {/* Chart */}
        {filteredChartData.length >= 2 ? (
          <View
            style={{ width: "100%", minHeight: 250 }}
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setSize({ width, height });
            }}
          >
            <SkiaChart ref={skiaRef} />
          </View>
        ) : (
          <AppText className="text-center text-gray-400 text-sm py-4">
            {t("gym.exerciseHistory.noChartData")}
          </AppText>
        )}
      </View>
    </View>
  );
}
