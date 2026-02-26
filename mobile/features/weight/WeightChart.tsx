import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState, useEffect, useRef, useMemo } from "react";
import { weight } from "@/types/session";
import { View } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useUserStore } from "@/lib/stores/useUserStore";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import { SkiaRenderer, SkiaChart } from "@wuba/react-native-echarts";
import { useTranslation } from "react-i18next";

type WeightChartProps = {
  range: "week" | "month" | "year";
  data: weight[];
};

function addOffsetToDate(
  base: Date,
  range: string,
  offset: number,
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

function getOldestDate(data: weight[]) {
  return new Date(
    Math.min(...data.map((entry) => new Date(entry.created_at).getTime())),
  );
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDatelabel(
  dateString: string,
  range: "week" | "month" | "year",
  locale: string,
): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
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
    dateList.push(toLocalDateString(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dateList;
}

echarts.use([SkiaRenderer, LineChart, GridComponent]);

export default function WeightChart({
  range,
  data,
}: WeightChartProps) {
  const { t, i18n } = useTranslation("weight");
  const locale = i18n.language;
  const [offset, setOffset] = useState(0);
  const today = useMemo(() => new Date(), []);
  const oldestDate = getOldestDate(data);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const skiaRef = useRef<any>(null);

  const [calculatedStart, end] = addOffsetToDate(today, range, offset);

  // For year range, clamp start to oldest record if not enough data
  const start =
    range === "year" && calculatedStart < oldestDate
      ? oldestDate
      : calculatedStart;

  // Check if we can go back further (for disabling back button)
  const [nextStart] = addOffsetToDate(today, range, offset + 1);
  const canGoBack = nextStart >= oldestDate;

  const weightUnit = useUserStore(
    (state) => state.profile?.weight_unit || "kg",
  );

  const [prevRange, setPrevRange] = useState(range);
  if (range !== prevRange) {
    setPrevRange(range);
    setOffset(0);
  }

  const filteredData = data.filter((entry) => {
    const entryDate = new Date(entry.created_at);
    return entryDate >= start && entryDate <= end;
  });

  const fullDateRange = generateDateRange(start, end);

  const chartData = useMemo(() => {
    const weightMap = new Map(
      filteredData.map((entry) => [entry.created_at.split("T")[0], entry.weight]),
    );

    // Find the most recent measurement before the range to carry forward
    const rangeStart = fullDateRange[0];
    let priorWeight: number | null = null;
    let priorDate = "";
    for (const entry of data) {
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
        value: carry,
        label: formatDatelabel(date, range, locale),
      };
    });
  }, [fullDateRange, filteredData, data, range, locale]);

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

  const firstValue = chartData[0]?.value;
  const lastValue = chartData[chartData.length - 1]?.value;

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

  const values = chartData.map((item) => item.value).filter((v): v is number => v !== null);
  const minWeight = values.length > 0 ? Math.min(...values) : 0;
  const maxWeight = values.length > 0 ? Math.max(...values) : 100;

  const option = useMemo(
    () => ({
      xAxis: {
        type: "category",
        data: chartData.map((item) => item.label),
        axisLabel: {
          color: "#f3f4f6",
          fontSize: 12,
        },
      },
      yAxis: {
        type: "value",
        min: Math.floor(minWeight) - 1,
        max: Math.round(maxWeight) + 1,
        splitLine: {
          show: true,
          lineStyle: {
            color: "#9ca3af", // darker gray
            width: 0.5,
            type: "dashed", // or 'solid'
          },
        },
        axisLabel: {
          color: "#f3f4f6",
          fontSize: 12,
        },
      },
      series: [
        {
          data: chartData.map((item) => item.value),
          type: "line",
          smooth: true,
          showSymbol: false,
          itemStyle: {
            color: "#3b82f6", // dot color (Tailwind blue-500)
            borderColor: "#60a5fa", // outline
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
                { offset: 0, color: "rgba(56, 189, 248, 0.4)" }, // top
                { offset: 1, color: "rgba(56, 189, 248, 0.05)" }, // fade bottom
              ],
            },
          },
        },
      ],
      grid: { top: 20, right: 20, bottom: 40, left: 20 },
    }),
    [chartData, minWeight, maxWeight],
  );

  useEffect(() => {
    if (!skiaRef.current) return;

    const chart = echarts.init(skiaRef.current, "light", {
      renderer: "skia",
      width: size.width,
      height: size.height,
    } as any);

    chart.setOption(option);

    return () => chart.dispose();
  }, [option, size]);

  return (
    <View
      className="bg-slate-900 shadow-md w-full"
    >
      <View className="flex-row justify-center items-center my-4 text-gray-400">
        <AnimatedButton
          onPress={() => setOffset((prev) => prev + 1)}
          className="mr-4 bg-slate-800 p-1 rounded"
          disabled={!canGoBack}
          style={{ opacity: canGoBack ? 1 : 0.5 }}
          hitSlop={20}
        >
          <ChevronLeft color={canGoBack ? "#22d3ee" : "#f3f4f6"} />
        </AnimatedButton>
        <AppText className="min-w-[200px] text-center">
          {formatDateRange(start, end)}
        </AppText>
        <AnimatedButton
          onPress={() => setOffset((prev) => Math.max(0, prev - 1))}
          className="ml-4 bg-slate-800 p-1 rounded"
          disabled={offset === 0}
          style={{ opacity: offset === 0 ? 0.5 : 1 }}
          hitSlop={20}
        >
          <ChevronRight color={offset === 0 ? "#f3f4f6" : "#22d3ee"} />
        </AnimatedButton>
      </View>
      <AppText className="text-center mb-4 px-10">
        {t(`weight.analyticsScreen.${range}`)}: {weightDifference} {weightUnit}
      </AppText>
      <View
        className="bg-slate-900 shadow-md"
        style={{
          flex: 1,
          width: "100%",
          minHeight: 300,
        }}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setSize({ width, height });
        }}
      >
        <SkiaChart ref={skiaRef} />
      </View>
    </View>
  );
}
