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

function getLatestDate(data: weight[]) {
  return new Date(
    Math.max(...data.map((entry) => new Date(entry.created_at).getTime())),
  );
}

function formatDatelabel(dateString: string, locale: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
  }).format(date);
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

echarts.use([SkiaRenderer, LineChart, GridComponent]);

export default function WeightFeedChart({ data }: WeightFeedChartProps) {
  const { t, i18n } = useTranslation("weight");
  const locale = i18n.language;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const skiaRef = useRef<any>(null);

  const weightUnit = useUserStore(
    (state) => state.profile?.weight_unit || "kg",
  );

  // Calculate last 7 days
  const end = getLatestDate(data);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);

  const filteredData = data.filter((entry) => {
    const entryDate = new Date(entry.created_at);
    return entryDate >= start && entryDate <= end;
  });

  const firstEntry = filteredData.find((entry) => entry.weight !== null);
  const lastEntry = filteredData.findLast((entry) => entry.weight !== null);

  let weightDifference: string | number = "N/A";

  if (firstEntry && lastEntry) {
    const diff = lastEntry.weight - firstEntry.weight;
    const rounded = Math.round(diff * 10) / 10;

    weightDifference =
      rounded > 0
        ? `- ${rounded}`
        : rounded < 0
          ? `+ ${Math.abs(rounded)}`
          : `${rounded}`;
  }

  const fullDateRange = generateDateRange(start, end);

  function fillMissingDatesWithCarry(
    fullDates: string[],
    entries: weight[],
  ): { date: string; weight: number | null }[] {
    const weightMap = new Map(
      entries.map((entry) => [entry.created_at.split("T")[0], entry.weight]),
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

  const chartData = fillMissingDatesWithCarry(fullDateRange, filteredData)
    .filter((item) => item.weight !== null)
    .map((item) => ({
      value: item.weight!,
      label: formatDatelabel(item.date, locale),
    }));

  const values = chartData.map((item) => item.value);
  const minWeight = Math.min(...values);
  const maxWeight = Math.max(...values);

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
