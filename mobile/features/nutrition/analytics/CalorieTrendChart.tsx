import { useState, useEffect, useRef, useMemo } from "react";
import { View } from "react-native";
import Svg, { Line } from "react-native-svg";
import AppText from "@/components/AppText";
import BodyTextNC from "@/components/BodyTextNC";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import { GridComponent, MarkLineComponent } from "echarts/components";
import { SkiaRenderer, SkiaChart } from "@wuba/react-native-echarts";
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

echarts.use([SkiaRenderer, BarChart, GridComponent, MarkLineComponent]);

export default function CalorieTrendChart({
  range,
  dailyTotals,
  startDate,
  endDate,
}: CalorieTrendChartProps) {
  const { t, i18n } = useTranslation("nutrition");
  const [size, setSize] = useState({ width: 0, height: 0 });
  const skiaRef = useRef<any>(null);

  const calorieGoal = dailyTotals[0]?.calorie_goal ?? 2000;

  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    dailyTotals.forEach((d) => map.set(d.date, d.calories));
    return map;
  }, [dailyTotals]);

  const fullRange = useMemo(
    () => generateDateRange(startDate, endDate),
    [startDate, endDate],
  );

  const chartData = useMemo(() => {
    return fullRange.map((date) => ({
      label: formatDateLabel(date, range, i18n.language),
      value: dataMap.get(date) ?? 0,
      hasData: dataMap.has(date),
    }));
  }, [fullRange, dataMap, range, i18n.language]);

  const maxCal = useMemo(() => {
    const vals = chartData.map((d) => d.value);
    return Math.max(...vals, calorieGoal, 500);
  }, [chartData, calorieGoal]);

  const option = useMemo(
    () => ({
      animation: false,
      xAxis: {
        type: "category" as const,
        data: chartData.map((d) => d.label),
        axisLabel: {
          color: "#f3f4f6",
          fontSize: 10,
          interval: range === "month" ? 4 : range === "3months" ? 6 : 0,
        },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      yAxis: {
        type: "value" as const,
        min: 0,
        max: Math.ceil(maxCal / 500) * 500 + 500,
        splitLine: {
          show: true,
          lineStyle: { color: "#374151", width: 0.5, type: "dashed" as const },
        },
        axisLabel: {
          color: "#9ca3af",
          fontSize: 10,
          formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`),
        },
      },
      series: [
        {
          type: "bar" as const,
          data: chartData.map((d) => ({
            value: d.value,
            itemStyle: {
              color:
                !d.hasData
                  ? "transparent"
                  : d.value <= calorieGoal * 1.05
                    ? "#22c55e"
                    : "#f59e0b",
              borderRadius: [4, 4, 0, 0],
            },
          })),
          barWidth: range === "week" ? "60%" : range === "month" ? "70%" : "50%",
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: {
              color: "#ff00ff",
              type: "dashed" as const,
              width: 1.5,
            },
            label: { show: false },
            data: [{ yAxis: calorieGoal }],
          },
        },
      ],
      grid: { top: 20, right: 10, bottom: 30, left: 40 },
    }),
    [chartData, maxCal, calorieGoal, range, t],
  );

  useEffect(() => {
    if (!skiaRef.current || size.width === 0) return;

    let disposed = false;
    let chart: ReturnType<typeof echarts.init> | null = null;

    const rafId = requestAnimationFrame(() => {
      if (disposed || !skiaRef.current) return;
      chart = echarts.init(skiaRef.current, "light", {
        renderer: "skia",
        width: size.width,
        height: size.height,
      } as any);
      chart.setOption(option);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      chart?.dispose();
    };
  }, [option, size]);

  return (
    <View className="bg-slate-900 rounded-2xl p-4">
      <AppText className="text-lg text-center mb-3">
        {t("analytics.charts.calories")}
      </AppText>
      <View
        style={{ width: "100%", minHeight: 220 }}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setSize({ width, height });
        }}
      >
        <SkiaChart ref={skiaRef} />
      </View>
      <View className="flex-row items-center justify-center gap-2 mt-2">
        <Svg width={24} height={2}>
          <Line x1={0} y1={1} x2={24} y2={1} stroke="#ff00ff" strokeWidth={2} strokeDasharray="4 3" />
        </Svg>
        <BodyTextNC className="text-xs text-fuchsia-400">
          {t("analytics.charts.goal")} ({calorieGoal} kcal)
        </BodyTextNC>
      </View>
    </View>
  );
}
