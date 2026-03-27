import { useState, useEffect, useRef, useMemo } from "react";
import { View } from "react-native";
import AppText from "@/components/AppText";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import { GridComponent, LegendComponent } from "echarts/components";
import { SkiaRenderer, SkiaChart } from "@wuba/react-native-echarts";
import { useTranslation } from "react-i18next";
import type { DailyTotal } from "@/database/nutrition/get-analytics";

type RangeType = "week" | "month" | "3months";

type MacroTrendChartProps = {
  range: RangeType;
  dailyTotals: DailyTotal[];
  startDate: string;
  endDate: string;
};

const PROTEIN_COLOR = "#38bdf8";
const CARBS_COLOR = "#f59e0b";
const FAT_COLOR = "#f43f5e";

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

echarts.use([SkiaRenderer, BarChart, GridComponent, LegendComponent]);

export default function MacroTrendChart({
  range,
  dailyTotals,
  startDate,
  endDate,
}: MacroTrendChartProps) {
  const { t, i18n } = useTranslation("nutrition");
  const [size, setSize] = useState({ width: 0, height: 0 });
  const skiaRef = useRef<any>(null);

  const dataMap = useMemo(() => {
    const map = new Map<string, DailyTotal>();
    dailyTotals.forEach((d) => map.set(d.date, d));
    return map;
  }, [dailyTotals]);

  const fullRange = useMemo(
    () => generateDateRange(startDate, endDate),
    [startDate, endDate],
  );

  const labels = useMemo(
    () => fullRange.map((d) => formatDateLabel(d, range, i18n.language)),
    [fullRange, range, i18n.language],
  );

  const proteinData = useMemo(
    () => fullRange.map((d) => dataMap.get(d)?.protein ?? 0),
    [fullRange, dataMap],
  );
  const carbsData = useMemo(
    () => fullRange.map((d) => dataMap.get(d)?.carbs ?? 0),
    [fullRange, dataMap],
  );
  const fatData = useMemo(
    () => fullRange.map((d) => dataMap.get(d)?.fat ?? 0),
    [fullRange, dataMap],
  );

  const option = useMemo(
    () => ({
      animation: false,
      legend: {
        bottom: 0,
        textStyle: { color: "#f3f4f6", fontSize: 11 },
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 16,
      },
      xAxis: {
        type: "category" as const,
        data: labels,
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
        splitLine: {
          show: true,
          lineStyle: { color: "#374151", width: 0.5, type: "dashed" as const },
        },
        axisLabel: {
          color: "#9ca3af",
          fontSize: 10,
          formatter: (v: number) => `${Math.round(v)}g`,
        },
      },
      series: [
        {
          name: t("daily.protein"),
          type: "bar" as const,
          stack: "macros",
          data: proteinData,
          itemStyle: { color: PROTEIN_COLOR, borderRadius: [0, 0, 0, 0] },
          barWidth: range === "week" ? "60%" : range === "month" ? "70%" : "50%",
        },
        {
          name: t("daily.carbs"),
          type: "bar" as const,
          stack: "macros",
          data: carbsData,
          itemStyle: { color: CARBS_COLOR },
        },
        {
          name: t("daily.fat"),
          type: "bar" as const,
          stack: "macros",
          data: fatData,
          itemStyle: { color: FAT_COLOR, borderRadius: [4, 4, 0, 0] },
        },
      ],
      grid: { top: 20, right: 10, bottom: 50, left: 45 },
    }),
    [labels, proteinData, carbsData, fatData, range, t],
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
        {t("analytics.charts.macros")}
      </AppText>
      <View
        style={{ width: "100%", minHeight: 250 }}
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
