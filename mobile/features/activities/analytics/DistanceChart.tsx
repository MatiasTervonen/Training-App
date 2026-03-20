import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState, useEffect, useRef, useMemo } from "react";
import { View, ScrollView, useWindowDimensions } from "react-native";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useUserStore } from "@/lib/stores/useUserStore";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import { SkiaRenderer, SkiaChart } from "@wuba/react-native-echarts";
import { useTranslation } from "react-i18next";

type SessionWithDistance = {
  id: string;
  created_at: string;
  activity_name: string | null;
  activity_slug: string | null;
  distance_meters: number | null;
};

type DistanceChartProps = {
  range: "week" | "month" | "3months";
  data: SessionWithDistance[];
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

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

function formatDateLabel(
  dateString: string,
  range: "week" | "month" | "3months",
  locale: string
): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  switch (range) {
    case "week":
      return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
    case "month":
      return new Intl.DateTimeFormat(locale, { day: "numeric" }).format(date);
    case "3months":
      return new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
  }
}

echarts.use([SkiaRenderer, LineChart, GridComponent]);

export default function DistanceChart({ range, data }: DistanceChartProps) {
  const { t, i18n } = useTranslation("activities");
  const [offset, setOffset] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const skiaRef = useRef<any>(null);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const filterScrollRef = useRef<ScrollView>(null);
  const { width: screenWidth } = useWindowDimensions();
  const distanceUnit = useUserStore(
    (state) => state.profile?.distance_unit ?? "km"
  );

  const today = useMemo(() => new Date(), []);
  const [start, end] = addOffsetToDate(today, range, offset);

  const [prevRange, setPrevRange] = useState(range);
  if (range !== prevRange) {
    setPrevRange(range);
    setOffset(0);
  }

  const oldestDate = useMemo(() => {
    const withDistance = data.filter(
      (s) => s.distance_meters && s.distance_meters > 0
    );
    if (withDistance.length === 0) return null;
    return new Date(
      Math.min(...withDistance.map((s) => new Date(s.created_at).getTime()))
    );
  }, [data]);

  const canGoBack = useMemo(() => {
    if (!oldestDate) return false;
    const [nextStart] = addOffsetToDate(today, range, offset + 1);
    return nextStart >= oldestDate;
  }, [oldestDate, today, range, offset]);

  // Get unique activity types that have distance data
  const activityTypes = useMemo(() => {
    const types = new Map<string, string>();
    data.forEach((session) => {
      if (
        session.distance_meters &&
        session.distance_meters > 0 &&
        session.activity_slug &&
        session.activity_name
      ) {
        types.set(session.activity_slug, session.activity_name);
      }
    });
    return Array.from(types.entries()).map(([slug, name]) => ({ slug, name }));
  }, [data]);

  useEffect(() => {
    const TAB_WIDTH = 100;
    const GAP = 8;
    const PADDING = 4;
    const activeIndex = selectedActivity
      ? activityTypes.findIndex((a) => a.slug === selectedActivity) + 1
      : 0;
    const tabCenter = PADDING + activeIndex * (TAB_WIDTH + GAP) + TAB_WIDTH / 2;
    const scrollX = Math.max(0, tabCenter - screenWidth / 2);
    filterScrollRef.current?.scrollTo({ x: scrollX, animated: true });
  }, [selectedActivity, activityTypes, screenWidth]);

  const fullDateRange = generateDateRange(start, end);

  // Filter data by selected activity
  const filteredData = useMemo(() => {
    if (!selectedActivity) return data;
    return data.filter((s) => s.activity_slug === selectedActivity);
  }, [data, selectedActivity]);

  // Build a map of date -> total distance in meters for that day
  const dailyDistanceMap = useMemo(() => {
    const map = new Map<string, number>();
    filteredData.forEach((session) => {
      if (!session.distance_meters || session.distance_meters <= 0) return;
      const dateStr = toLocalDateString(new Date(session.created_at));
      map.set(dateStr, (map.get(dateStr) || 0) + session.distance_meters);
    });
    return map;
  }, [filteredData]);

  // Convert meters to display unit (km or miles)
  const toDisplayUnit = (meters: number): number => {
    if (distanceUnit === "mi") {
      return meters / 1609.344;
    }
    return meters / 1000;
  };

  const unitLabel = distanceUnit === "mi" ? "mi" : "km";

  // Build accumulated distance data
  const chartData = useMemo(() => {
    let cumulative = 0;

    if (range === "3months") {
      const weeklyData: { label: string; value: number }[] = [];
      let lastShownMonth = "";

      for (let i = 0; i < fullDateRange.length; i++) {
        const date = fullDateRange[i];
        cumulative += dailyDistanceMap.get(date) || 0;

        if ((i + 1) % 7 === 0 || i === fullDateRange.length - 1) {
          const monthLabel = formatDateLabel(
            fullDateRange[Math.floor(i / 7) * 7],
            range,
            i18n.language
          );
          const label = monthLabel !== lastShownMonth ? monthLabel : "";
          if (monthLabel !== lastShownMonth) {
            lastShownMonth = monthLabel;
          }
          weeklyData.push({
            label,
            value: toDisplayUnit(cumulative),
          });
        }
      }
      return weeklyData;
    }

    return fullDateRange.map((date) => {
      cumulative += dailyDistanceMap.get(date) || 0;
      return {
        label: formatDateLabel(date, range, i18n.language),
        value: toDisplayUnit(cumulative),
      };
    });
  }, [fullDateRange, dailyDistanceMap, range, i18n.language, distanceUnit]);

  // Total distance in the period
  const totalDistance = useMemo(() => {
    let total = 0;
    fullDateRange.forEach((date) => {
      total += dailyDistanceMap.get(date) || 0;
    });
    return toDisplayUnit(total);
  }, [fullDateRange, dailyDistanceMap, distanceUnit]);

  // Daily average (only counting days with distance)
  const avgDistance = useMemo(() => {
    let total = 0;
    let daysWithData = 0;
    fullDateRange.forEach((date) => {
      const dist = dailyDistanceMap.get(date) || 0;
      if (dist > 0) {
        total += dist;
        daysWithData++;
      }
    });
    return daysWithData > 0 ? toDisplayUnit(total) / daysWithData : 0;
  }, [fullDateRange, dailyDistanceMap, distanceUnit]);

  const values = chartData.map((item) => item.value);
  const maxValue = Math.max(...values, 1);

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
        max: Math.ceil(maxValue * 1.1),
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
          formatter: (value: number) =>
            value >= 100 ? Math.round(value).toString() : value.toFixed(1),
        },
      },
      series: [
        {
          data: chartData.map((item) =>
            Math.round(item.value * 10) / 10
          ),
          type: "line",
          smooth: true,
          showSymbol: false,
          lineStyle: {
            color: "#38bdf8",
            width: 3,
          },
          itemStyle: {
            color: "#38bdf8",
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(56, 189, 248, 0.35)" },
                { offset: 1, color: "rgba(56, 189, 248, 0.05)" },
              ],
            },
          },
        },
      ],
      grid: { top: 20, right: 10, bottom: 30, left: 40 },
    }),
    [chartData, maxValue, range]
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
    const locale = i18n.language;
    const startFormatted = start.toLocaleDateString(locale, {
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

  const rangeLabels = {
    week: t("activities.analyticsScreen.weeklyTotal"),
    month: t("activities.analyticsScreen.monthlyTotal"),
    "3months": t("activities.analyticsScreen.threeMonthsTotal"),
  };

  // Don't render if no distance data at all
  if (totalDistance === 0 && offset === 0) return null;

  return (
    <View className="bg-slate-900 shadow-md w-full rounded-2xl p-4">
      <View className="flex-row items-center mb-2">
        <View className="w-8" />
        <AppText className="text-lg font-medium text-center flex-1">
          {t("activities.analyticsScreen.accumulatedDistance")}
        </AppText>
        <View className="w-8" />
      </View>
      {activityTypes.length > 1 && (
        <View className="bg-slate-800 rounded-lg mb-3">
          <ScrollView
            ref={filterScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4 }}
          >
            <View className="flex-row p-1 gap-2">
              <AnimatedButton
                onPress={() => setSelectedActivity(null)}
                className={`w-[100px] py-2 px-3 rounded-md ${
                  selectedActivity === null ? "bg-slate-700" : ""
                }`}
              >
                <AppTextNC
                  numberOfLines={1}
                  className={`text-center font-medium ${
                    selectedActivity === null ? "text-cyan-400" : "text-gray-200"
                  }`}
                >
                  {t("activities.mySessions.all")}
                </AppTextNC>
              </AnimatedButton>
              {activityTypes.map((activity, index) => {
                const isActive = selectedActivity === activity.slug;
                return (
                  <AnimatedButton
                    key={activity.slug}
                    onPress={() =>
                      setSelectedActivity(isActive ? null : activity.slug)
                    }
                    className={`w-[100px] py-2 px-3 rounded-md ${
                      isActive ? "bg-slate-700" : ""
                    }`}
                  >
                    <AppTextNC
                      numberOfLines={1}
                      className={`text-center font-medium ${
                        isActive ? "text-cyan-400" : "text-gray-200"
                      }`}
                    >
                      {activity.name}
                    </AppTextNC>
                  </AnimatedButton>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      <View className="flex-row justify-center items-center mb-4">
        <AnimatedButton
          onPress={() => setOffset((prev) => prev + 1)}
          className="mr-4 bg-slate-800 p-1 rounded"
          disabled={!canGoBack}
          style={{ opacity: canGoBack ? 1 : 0.5 }}
        >
          <ChevronLeft color={canGoBack ? "#38bdf8" : "#f3f4f6"} size={20} />
        </AnimatedButton>
        <AppText className="min-w-[200px] text-center text-sm">
          {formatDateRange(start, end)}
        </AppText>
        <AnimatedButton
          onPress={() => setOffset((prev) => Math.max(0, prev - 1))}
          className="ml-4 bg-slate-800 p-1 rounded"
          disabled={offset === 0}
          style={{ opacity: offset === 0 ? 0.5 : 1 }}
        >
          <ChevronRight
            color={offset === 0 ? "#f3f4f6" : "#38bdf8"}
            size={20}
          />
        </AnimatedButton>
      </View>

      <View className="flex-row justify-around px-4 mb-4">
        <View className="items-center">
          <AppText className="text-gray-400 text-xs">
            {rangeLabels[range]}
          </AppText>
          <AppText className="text-xl font-bold text-sky-400">
            {totalDistance.toFixed(1)} {unitLabel}
          </AppText>
        </View>
        <View className="items-center">
          <AppText className="text-gray-400 text-xs">
            {t("activities.analyticsScreen.dailyAvg")}
          </AppText>
          <AppText className="text-xl font-bold text-sky-400">
            {avgDistance.toFixed(1)} {unitLabel}
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
