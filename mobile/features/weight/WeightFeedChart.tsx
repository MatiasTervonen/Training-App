import { useEffect, useRef, useMemo, useState } from "react";
import { weight } from "@/types/session";
import { View } from "react-native";
import AppText from "@/components/AppText";
import { useUserStore } from "@/lib/stores/useUserStore";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import { SkiaRenderer, SkiaChart } from "@wuba/react-native-echarts";
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

echarts.use([SkiaRenderer, LineChart, GridComponent]);

export default function WeightFeedChart({ data }: WeightFeedChartProps) {
  const { t, i18n } = useTranslation("weight");
  const locale = i18n.language;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const skiaRef = useRef<any>(null);

  const weightUnit = useUserStore(
    (state) => state.profile?.weight_unit || "kg",
  );

  // Calculate last 7 days from today
  const end = useMemo(() => new Date(), []);
  const start = useMemo(() => {
    const s = new Date();
    s.setDate(s.getDate() - 6);
    return s;
  }, []);

  const filteredData = data.filter((entry) => {
    const entryDate = new Date(entry.created_at);
    return entryDate >= start && entryDate <= end;
  });

  const fullDateRange = generateDateRange(start, end);

  const chartData = useMemo(() => {
    const weightMap = new Map(
      filteredData.map((entry) => [entry.created_at.split("T")[0], entry.weight]),
    );

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
        label: formatDatelabel(date, locale),
      };
    });
  }, [fullDateRange, filteredData, data, locale]);

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
          data: chartData.map((item) => item.value),
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
    <View className="bg-slate-900 shadow-md w-full rounded-md p-4">
      <AppText className="text-center text-lg mb-2">
        {t("weight.analyticsScreen.range7d")}
      </AppText>
      <AppText className="text-center mb-4 text-gray-400">
        {weightDifference} {weightUnit}
      </AppText>
      <View
        style={{
          width: "100%",
          height: 250,
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
