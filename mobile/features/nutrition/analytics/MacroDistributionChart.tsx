import { useState, useEffect, useRef, useMemo } from "react";
import { View } from "react-native";
import AppText from "@/components/AppText";
import * as echarts from "echarts/core";
import { PieChart } from "echarts/charts";
import { LegendComponent } from "echarts/components";
import { SkiaRenderer, SkiaChart } from "@wuba/react-native-echarts";
import { useTranslation } from "react-i18next";
import type { DailyTotal } from "@/database/nutrition/get-analytics";

type MacroDistributionChartProps = {
  dailyTotals: DailyTotal[];
};

const PROTEIN_COLOR = "#38bdf8";
const CARBS_COLOR = "#f59e0b";
const FAT_COLOR = "#f43f5e";

echarts.use([SkiaRenderer, PieChart, LegendComponent]);

export default function MacroDistributionChart({
  dailyTotals,
}: MacroDistributionChartProps) {
  const { t } = useTranslation("nutrition");
  const [size, setSize] = useState({ width: 0, height: 0 });
  const skiaRef = useRef<any>(null);

  const totals = useMemo(() => {
    const protein = dailyTotals.reduce((s, d) => s + d.protein, 0);
    const carbs = dailyTotals.reduce((s, d) => s + d.carbs, 0);
    const fat = dailyTotals.reduce((s, d) => s + d.fat, 0);
    return { protein, carbs, fat };
  }, [dailyTotals]);

  const totalGrams = totals.protein + totals.carbs + totals.fat;

  const chartData = useMemo(() => {
    if (totalGrams === 0) return [];
    return [
      {
        name: t("daily.protein"),
        value: Math.round(totals.protein),
        itemStyle: { color: PROTEIN_COLOR },
      },
      {
        name: t("daily.carbs"),
        value: Math.round(totals.carbs),
        itemStyle: { color: CARBS_COLOR },
      },
      {
        name: t("daily.fat"),
        value: Math.round(totals.fat),
        itemStyle: { color: FAT_COLOR },
      },
    ];
  }, [totals, totalGrams, t]);

  const avgCalories =
    dailyTotals.length > 0
      ? Math.round(
          dailyTotals.reduce((s, d) => s + d.calories, 0) /
            dailyTotals.length,
        )
      : 0;

  const option = useMemo(
    () => ({
      animation: false,
      legend: {
        bottom: 0,
        textStyle: { color: "#f3f4f6", fontSize: 11 },
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 16,
        formatter: (name: string) => {
          const item = chartData.find((d) => d.name === name);
          if (!item || totalGrams === 0) return name;
          const pct = Math.round((item.value / totalGrams) * 100);
          return `${name} ${pct}%`;
        },
      },
      series: [
        {
          type: "pie" as const,
          radius: ["40%", "65%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: "#0f172a",
            borderWidth: 2,
          },
          label: {
            show: false,
            position: "center" as const,
          },
          emphasis: {
            label: {
              show: true,
              position: "center" as const,
              fontSize: 14,
              fontWeight: "bold" as const,
              color: "#f3f4f6",
              backgroundColor: "#0f172a",
              borderColor: "#ff00ff",
              borderWidth: 1,
              borderRadius: 8,
              padding: [8, 12],
              lineHeight: 18,
              formatter: `{b}\n{c}g ({d}%)`,
            },
          },
          labelLine: { show: false },
          data: chartData,
        },
      ],
    }),
    [chartData, avgCalories, totalGrams, t],
  );

  useEffect(() => {
    if (!skiaRef.current || size.width === 0 || chartData.length === 0) return;

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
  }, [option, size, chartData.length]);

  if (totalGrams === 0) return null;

  return (
    <View className="bg-slate-900 rounded-2xl p-4">
      <AppText className="text-lg text-center mb-3">
        {t("analytics.charts.distribution")}
      </AppText>
      <View
        style={{ width: "100%", height: 260 }}
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
