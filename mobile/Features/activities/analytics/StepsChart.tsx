import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState, useEffect, useRef, useMemo } from "react";
import { View, Pressable } from "react-native";
import AppText from "@/components/AppText";
import { StepRecord } from "@/database/activities/get-steps";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import { SkiaRenderer, SkiaChart } from "@wuba/react-native-echarts";

type StepsChartProps = {
  range: "week" | "month" | "3months";
  data: StepRecord[];
  todaySteps: number;
};

function getRangeDays(range: "week" | "month" | "3months"): number {
  switch (range) {
    case "week":
      return 7;
    case "month":
      return 30;
    case "3months":
      return 90;
  }
}

function addOffsetToDate(
  base: Date,
  range: "week" | "month" | "3months",
  offset: number
): [Date, Date] {
  const end = new Date(base);
  const start = new Date(base);

  const days = getRangeDays(range);
  start.setDate(end.getDate() - (days - 1));

  const diff = end.getTime() - start.getTime() + 1;
  end.setTime(end.getTime() - diff * offset);
  start.setTime(start.getTime() - diff * offset);

  return [start, end];
}

function formatDateLabel(
  dateString: string,
  range: "week" | "month" | "3months"
): string {
  const date = new Date(dateString);
  switch (range) {
    case "week":
      return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(
        date
      );
    case "month":
      return new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(date);
    case "3months":
      return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
  }
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

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return num.toString();
}

echarts.use([SkiaRenderer, BarChart, GridComponent]);

export default function StepsChart({
  range,
  data,
  todaySteps,
}: StepsChartProps) {
  const [offset, setOffset] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const skiaRef = useRef<any>(null);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const today = useMemo(() => new Date(), []);
  const [start, end] = addOffsetToDate(today, range, offset);

  useEffect(() => {
    setOffset(0);
  }, [range]);

  const fullDateRange = generateDateRange(start, end);

  const stepsMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((record) => {
      map.set(record.day, record.steps);
    });
    if (todaySteps > 0) {
      map.set(todayStr, todaySteps);
    }
    return map;
  }, [data, todaySteps, todayStr]);

  const chartData = useMemo(() => {
    if (range === "3months") {
      const weeklyData: { label: string; value: number; count: number }[] = [];
      let weekSum = 0;
      let weekCount = 0;
      let currentWeekLabel = "";

      fullDateRange.forEach((date, index) => {
        const steps = stepsMap.get(date) || 0;
        weekSum += steps;
        if (steps > 0) weekCount++;

        if (index % 7 === 0) {
          currentWeekLabel = formatDateLabel(date, range);
        }

        if ((index + 1) % 7 === 0 || index === fullDateRange.length - 1) {
          weeklyData.push({
            label: currentWeekLabel,
            value: weekCount > 0 ? Math.round(weekSum / weekCount) : 0,
            count: weekCount,
          });
          weekSum = 0;
          weekCount = 0;
        }
      });

      return weeklyData;
    }

    return fullDateRange.map((date) => ({
      label: formatDateLabel(date, range),
      value: stepsMap.get(date) || 0,
    }));
  }, [fullDateRange, stepsMap, range]);

  const totalSteps = useMemo(() => {
    return fullDateRange.reduce((sum, date) => {
      return sum + (stepsMap.get(date) || 0);
    }, 0);
  }, [fullDateRange, stepsMap]);

  const avgSteps = useMemo(() => {
    const daysWithData = fullDateRange.filter(
      (date) => (stepsMap.get(date) || 0) > 0
    ).length;
    return daysWithData > 0 ? Math.round(totalSteps / daysWithData) : 0;
  }, [fullDateRange, stepsMap, totalSteps]);

  const values = chartData.map((item) => item.value);
  const maxSteps = Math.max(...values, 1000);

  const option = useMemo(
    () => ({
      xAxis: {
        type: "category",
        data: chartData.map((item) => item.label),
        axisLabel: {
          color: "#f3f4f6",
          fontSize: 10,
          interval: range === "month" ? 4 : 0,
        },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: Math.ceil(maxSteps / 1000) * 1000,
        splitLine: {
          show: true,
          lineStyle: {
            color: "#374151",
            width: 0.5,
            type: "dashed",
          },
        },
        axisLabel: {
          color: "#9ca3af",
          fontSize: 10,
          formatter: (value: number) => formatNumber(value),
        },
      },
      series: [
        {
          data: chartData.map((item) => item.value),
          type: "bar",
          barWidth: range === "week" ? "60%" : range === "month" ? "70%" : "80%",
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#22c55e" },
                { offset: 1, color: "#16a34a" },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: "#4ade80",
            },
          },
        },
      ],
      grid: { top: 20, right: 15, bottom: 30, left: 45 },
    }),
    [chartData, maxSteps, range]
  );

  useEffect(() => {
    if (!skiaRef.current || size.width === 0) return;

    const chart = echarts.init(skiaRef.current, "light", {
      renderer: "skia",
      width: size.width,
      height: size.height,
    } as any);

    chart.setOption(option);

    return () => chart.dispose();
  }, [option, size]);

  function formatDateRange(start: Date, end: Date) {
    const startFormatted = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endFormatted = end.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    return `${startFormatted} - ${endFormatted}`;
  }

  const rangeLabels = {
    week: "Weekly",
    month: "Monthly",
    "3months": "3 Months",
  };

  return (
    <View className="bg-slate-900 shadow-md w-full rounded-2xl p-4">
      <AppText className="text-lg font-medium text-center mb-2">
        Daily Steps
      </AppText>
      <View className="flex-row justify-center items-center mb-4">
        <Pressable
          onPress={() => setOffset((prev) => prev + 1)}
          className="mr-4 bg-slate-800 p-1 rounded"
          hitSlop={10}
        >
          <ChevronLeft color="#f3f4f6" size={20} />
        </Pressable>
        <AppText className="min-w-[200px] text-center text-sm">
          {formatDateRange(start, end)}
        </AppText>
        <Pressable
          onPress={() => setOffset((prev) => Math.max(0, prev - 1))}
          className="ml-4 bg-slate-800 p-1 rounded"
          hitSlop={10}
          disabled={offset === 0}
          style={{ opacity: offset === 0 ? 0.5 : 1 }}
        >
          <ChevronRight color="#f3f4f6" size={20} />
        </Pressable>
      </View>

      <View className="flex-row justify-around px-4 mb-4">
        <View className="items-center">
          <AppText className="text-gray-400 text-xs">
            {rangeLabels[range]} Total
          </AppText>
          <AppText className="text-xl font-bold text-green-400">
            {formatNumber(totalSteps)}
          </AppText>
        </View>
        <View className="items-center">
          <AppText className="text-gray-400 text-xs">Daily Avg</AppText>
          <AppText className="text-xl font-bold text-green-400">
            {formatNumber(avgSteps)}
          </AppText>
        </View>
      </View>

      <View
        style={{
          flex: 1,
          width: "100%",
          minHeight: 250,
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
