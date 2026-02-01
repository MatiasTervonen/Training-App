import { useState, useEffect, useRef, useMemo } from "react";
import { View } from "react-native";
import AppText from "@/components/AppText";
import * as echarts from "echarts/core";
import { PieChart } from "echarts/charts";
import { LegendComponent } from "echarts/components";
import { SkiaRenderer, SkiaChart } from "@wuba/react-native-echarts";
import { useTranslation } from "react-i18next";

type ActivityBreakdownChartProps = {
  data: {
    id: string;
    created_at: string;
    activity_name: string | null;
    activity_slug: string | null;
  }[];
  startDate: Date;
  endDate: Date;
};

const COLORS = [
  "#22c55e", // green-500
  "#3b82f6", // blue-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
];

echarts.use([SkiaRenderer, PieChart, LegendComponent]);

export default function ActivityBreakdownChart({
  data,
  startDate,
  endDate,
}: ActivityBreakdownChartProps) {
  const { t } = useTranslation("activities");
  const [size, setSize] = useState({ width: 0, height: 0 });
  const skiaRef = useRef<any>(null);

  const filteredData = useMemo(() => {
    return data.filter((session) => {
      const sessionDate = new Date(session.created_at);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  }, [data, startDate, endDate]);

  const chartData = useMemo(() => {
    const getActivityName = (slug: string | null, name: string | null) => {
      if (slug) {
        const translated = t(`activities.activityNames.${slug}`, {
          defaultValue: "",
        });
        if (translated && translated !== `activities.activityNames.${slug}`) {
          return translated;
        }
      }
      return name || t("activities.analyticsScreen.unknown");
    };

    const activityCounts: Record<string, number> = {};

    filteredData.forEach((session) => {
      const name = getActivityName(
        session.activity_slug,
        session.activity_name,
      );
      activityCounts[name] = (activityCounts[name] || 0) + 1;
    });

    return Object.entries(activityCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData, t]);

  const totalSessions = filteredData.length;

  const option = useMemo(
    () => ({
      legend: {
        orient: "horizontal",
        bottom: 0,
        textStyle: {
          color: "#f3f4f6",
          fontSize: 11,
        },
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 8,
      },
      series: [
        {
          type: "pie",
          radius: ["45%", "70%"],
          center: ["50%", "45%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: "#0f172a",
            borderWidth: 2,
          },
          label: {
            show: false,
            position: "center",
          },
          emphasis: {
            label: {
              show: true,
              position: "center",
              fontSize: 14,
              fontWeight: "bold",
              color: "#f3f4f6",
              formatter: `{b}\n{c} ${t("activities.analyticsScreen.sessions")}`,
            },
          },
          labelLine: {
            show: false,
          },
          data: chartData.map((item, index) => ({
            ...item,
            itemStyle: {
              color: COLORS[index % COLORS.length],
            },
          })),
        },
      ],
    }),
    [chartData, t],
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

  if (totalSessions === 0) {
    return (
      <View className="bg-slate-900 rounded-2xl p-4 items-center justify-center min-h-[200px]">
        <AppText className="text-gray-400">
          {t("activities.analyticsScreen.noActivitiesInPeriod")}
        </AppText>
      </View>
    );
  }

  return (
    <View className="bg-slate-900 rounded-2xl p-4">
      <AppText className="text-lg font-medium text-center mb-2">
        {t("activities.analyticsScreen.activityBreakdown")}
      </AppText>
      <AppText className="text-gray-400 text-center text-sm mb-4">
        {totalSessions}{" "}
        {totalSessions === 1
          ? t("activities.analyticsScreen.session")
          : t("activities.analyticsScreen.sessions")}
      </AppText>

      <View
        style={{
          width: "100%",
          height: 280,
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
