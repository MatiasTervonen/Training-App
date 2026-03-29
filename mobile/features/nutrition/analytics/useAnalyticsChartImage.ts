import { useMemo } from "react";
import type { DailyTotal } from "@/database/nutrition/get-analytics";
import { ShareCardTheme } from "@/lib/share/themes";

type RangeType = "week" | "month" | "3months";

type ChartType = "calorieTrend" | "macroTrend" | "macroDistribution";

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

export type CalorieChartOptions = {
  showGoalLine: boolean;
  showTdeeLine: boolean;
};

function buildCalorieTrendOption(
  dailyTotals: DailyTotal[],
  range: RangeType,
  startDate: string,
  endDate: string,
  locale: string,
  labelColor: string,
  gridColor: string,
  chartOptions: CalorieChartOptions = { showGoalLine: true, showTdeeLine: true },
) {
  const dataMap = new Map<string, number>();
  dailyTotals.forEach((d) => dataMap.set(d.date, d.calories));

  const tdeeMap = new Map<string, number>();
  dailyTotals.forEach((d) => tdeeMap.set(d.date, d.tdee));

  const fullRange = generateDateRange(startDate, endDate);
  const calorieGoal = dailyTotals[0]?.calorie_goal ?? 2000;

  const chartData = fullRange.map((date) => ({
    label: formatDateLabel(date, range, locale),
    value: dataMap.get(date) ?? 0,
    hasData: dataMap.has(date),
    tdee: tdeeMap.get(date) ?? null,
  }));

  const maxCal = Math.max(
    ...chartData.map((d) => d.value),
    ...chartData.map((d) => d.tdee ?? 0),
    calorieGoal,
    500,
  );

  return {
    backgroundColor: "transparent",
    animation: false,
    xAxis: {
      type: "category",
      data: chartData.map((d) => d.label),
      axisLabel: {
        color: labelColor,
        fontSize: 22,
        interval: range === "month" ? 4 : range === "3months" ? 13 : 0,
      },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: Math.ceil(maxCal / 500) * 500 + 500,
      splitLine: {
        show: true,
        lineStyle: { color: gridColor, width: 0.5, type: "dashed" },
      },
      axisLabel: {
        color: labelColor,
        fontSize: 22,
        formatter: "{value}",
      },
    },
    series: [
      {
        type: "bar",
        data: chartData.map((d) => ({
          value: d.value,
          itemStyle: {
            color:
              !d.hasData
                ? "transparent"
                : !chartOptions.showGoalLine || d.value <= calorieGoal * 1.05
                  ? "#22c55e"
                  : "#f59e0b",
            borderRadius: [4, 4, 0, 0],
          },
        })),
        barWidth: range === "week" ? "60%" : range === "month" ? "70%" : "50%",
        ...(chartOptions.showGoalLine
          ? {
              markLine: {
                silent: true,
                symbol: "none",
                lineStyle: { color: "#ff00ff", type: "dashed", width: 2 },
                label: { show: false },
                data: [{ yAxis: calorieGoal }],
              },
            }
          : {}),
      },
      ...(chartOptions.showTdeeLine
        ? [
            {
              type: "line",
              data: chartData.map((d) => (d.tdee !== null ? d.tdee : null)),
              connectNulls: false,
              symbol: "circle",
              symbolSize: 6,
              lineStyle: { color: "#38bdf8", width: 2.5 },
              itemStyle: { color: "#38bdf8" },
            },
          ]
        : []),
    ],
    grid: { top: 20, right: 20, bottom: 40, left: 60 },
  };
}

function buildMacroTrendOption(
  dailyTotals: DailyTotal[],
  range: RangeType,
  startDate: string,
  endDate: string,
  locale: string,
  labelColor: string,
  gridColor: string,
  proteinLabel: string,
  carbsLabel: string,
  fatLabel: string,
) {
  const dataMap = new Map<string, DailyTotal>();
  dailyTotals.forEach((d) => dataMap.set(d.date, d));

  const fullRange = generateDateRange(startDate, endDate);
  const labels = fullRange.map((d) => formatDateLabel(d, range, locale));
  const proteinData = fullRange.map((d) => dataMap.get(d)?.protein ?? 0);
  const carbsData = fullRange.map((d) => dataMap.get(d)?.carbs ?? 0);
  const fatData = fullRange.map((d) => dataMap.get(d)?.fat ?? 0);

  return {
    backgroundColor: "transparent",
    animation: false,
    legend: {
      bottom: 0,
      textStyle: { color: labelColor, fontSize: 22 },
      itemWidth: 20,
      itemHeight: 14,
      itemGap: 24,
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: {
        color: labelColor,
        fontSize: 22,
        interval: range === "month" ? 4 : range === "3months" ? 6 : 0,
      },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    yAxis: {
      type: "value",
      splitLine: {
        show: true,
        lineStyle: { color: gridColor, width: 0.5, type: "dashed" },
      },
      axisLabel: { color: labelColor, fontSize: 22 },
    },
    series: [
      {
        name: proteinLabel,
        type: "bar",
        stack: "macros",
        data: proteinData,
        itemStyle: { color: PROTEIN_COLOR },
        barWidth: range === "week" ? "60%" : range === "month" ? "70%" : "50%",
      },
      {
        name: carbsLabel,
        type: "bar",
        stack: "macros",
        data: carbsData,
        itemStyle: { color: CARBS_COLOR },
      },
      {
        name: fatLabel,
        type: "bar",
        stack: "macros",
        data: fatData,
        itemStyle: { color: FAT_COLOR, borderRadius: [4, 4, 0, 0] },
      },
    ],
    grid: { top: 20, right: 20, bottom: 75, left: 60 },
  };
}

function buildMacroDistributionOption(
  dailyTotals: DailyTotal[],
  labelColor: string,
  proteinLabel: string,
  carbsLabel: string,
  fatLabel: string,
) {
  const protein = dailyTotals.reduce((s, d) => s + d.protein, 0);
  const carbs = dailyTotals.reduce((s, d) => s + d.carbs, 0);
  const fat = dailyTotals.reduce((s, d) => s + d.fat, 0);
  const totalGrams = protein + carbs + fat;

  const proteinPct = totalGrams > 0 ? Math.round((protein / totalGrams) * 100) : 0;
  const carbsPct = totalGrams > 0 ? Math.round((carbs / totalGrams) * 100) : 0;
  const fatPct = totalGrams > 0 ? Math.round((fat / totalGrams) * 100) : 0;

  const chartData =
    totalGrams === 0
      ? []
      : [
          { name: `${proteinLabel} ${proteinPct}%`, value: Math.round(protein), itemStyle: { color: PROTEIN_COLOR } },
          { name: `${carbsLabel} ${carbsPct}%`, value: Math.round(carbs), itemStyle: { color: CARBS_COLOR } },
          { name: `${fatLabel} ${fatPct}%`, value: Math.round(fat), itemStyle: { color: FAT_COLOR } },
        ];

  return {
    backgroundColor: "transparent",
    animation: false,
    legend: {
      bottom: 65,
      textStyle: { color: labelColor, fontSize: 36 },
      itemWidth: 28,
      itemHeight: 20,
      itemGap: 32,
    },
    series: [
      {
        type: "pie",
        radius: ["35%", "60%"],
        center: ["50%", "42%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: "transparent",
          borderWidth: 3,
        },
        label: { show: false },
        labelLine: { show: false },
        data: chartData,
      },
    ],
  };
}

/**
 * Generates HTML for rendering a nutrition analytics chart in a WebView.
 * The WebView renders the chart, exports it as a PNG data URL, and posts it
 * back via window.ReactNativeWebView.postMessage().
 */
export default function useAnalyticsChartImage(
  chartType: ChartType,
  dailyTotals: DailyTotal[],
  range: RangeType,
  startDate: string,
  endDate: string,
  locale: string,
  theme: ShareCardTheme,
  macroLabels: { protein: string; carbs: string; fat: string },
  calorieChartOptions?: CalorieChartOptions,
) {
  const isLightTheme = theme.id === "clean";
  const labelColor = isLightTheme ? theme.colors.textPrimary : "#f3f4f6";
  const gridColor = theme.colors.textMuted ?? "#9ca3af";

  const html = useMemo(() => {
    let option: Record<string, unknown>;

    switch (chartType) {
      case "calorieTrend":
        option = buildCalorieTrendOption(
          dailyTotals, range, startDate, endDate, locale, labelColor, gridColor, calorieChartOptions,
        );
        break;
      case "macroTrend":
        option = buildMacroTrendOption(
          dailyTotals, range, startDate, endDate, locale, labelColor, gridColor,
          macroLabels.protein, macroLabels.carbs, macroLabels.fat,
        );
        break;
      case "macroDistribution":
        option = buildMacroDistributionOption(
          dailyTotals, labelColor,
          macroLabels.protein, macroLabels.carbs, macroLabels.fat,
        );
        break;
    }

    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=960,initial-scale=1,user-scalable=no">
<style>html,body{margin:0;padding:0;width:960px;height:620px;background:transparent;overflow:hidden;}#chart{width:960px;height:620px;}</style>
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"><\/script>
</head>
<body>
<div id="chart"></div>
<script>
var chart=echarts.init(document.getElementById('chart'),null,{renderer:'canvas',width:960,height:620});
chart.setOption(${JSON.stringify(option)});
setTimeout(function(){
  var url=chart.getDataURL({type:'png',pixelRatio:2,backgroundColor:'transparent'});
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'${chartType}',url:url}));
},200);
<\/script>
</body>
</html>`;
  }, [chartType, dailyTotals, range, startDate, endDate, locale, labelColor, gridColor, macroLabels, calorieChartOptions]);

  return html;
}
