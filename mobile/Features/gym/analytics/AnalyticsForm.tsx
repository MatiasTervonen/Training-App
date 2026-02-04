import { View } from "react-native";
import AppText from "@/components/AppText";
import { FullGymSession } from "@/database/gym/get-full-gym-session";
import ChartTabSwitcher from "@/features/gym/analytics/AnalytictsChartTabSwitcher";
import * as echarts from "echarts/core";
import {
  CalendarComponent,
  VisualMapComponent,
  TooltipComponent,
} from "echarts/components";
import { HeatmapChart } from "echarts/charts";
import { SkiaRenderer, SkiaChart } from "@wuba/react-native-echarts";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDateShort, formatDuration } from "@/lib/formatDate";
import { Last30DaysAnalytics } from "@/database/gym/analytics/last-30-days-rpc";
import { useTranslation } from "react-i18next";

type AnalyticsFormProps = {
  data: Last30DaysAnalytics;
  heatmap: FullGymSession[];
};

echarts.use([
  SkiaRenderer,
  HeatmapChart,
  CalendarComponent,
  VisualMapComponent,
  TooltipComponent,
]);

export default function AnalyticsForm({ data, heatmap }: AnalyticsFormProps) {
  const { t } = useTranslation("gym");
  const skiaRef = useRef<any>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

  const heatmapData = useMemo(() => {
    if (!heatmap) return [];

    return heatmap.map((session) => {
      const date = new Date(session.created_at).toISOString().split("T")[0]; // "YYYY-MM-DD"
      const durationMinutes = Math.round(session.duration / 60);
      const title = session.title;

      return {
        value: [date, durationMinutes],
        title,
      };
    });
  }, [heatmap]);

  const calendarRange = useMemo(() => {
    const end = new Date();
    const start = new Date();

    start.setDate(end.getDate() - 29); // last 30 days

    return [start.toISOString().split("T")[0], end.toISOString().split("T")[0]];
  }, []);

  const durationLabel = t("gym.analytics.duration");
  const dayNames = useMemo(
    () => [
      t("gym.analytics.days.sun"),
      t("gym.analytics.days.mon"),
      t("gym.analytics.days.tue"),
      t("gym.analytics.days.wed"),
      t("gym.analytics.days.thu"),
      t("gym.analytics.days.fri"),
      t("gym.analytics.days.sat"),
    ],
    [t],
  );

  const monthNames = useMemo(
    () => [
      t("gym.analytics.months.jan"),
      t("gym.analytics.months.feb"),
      t("gym.analytics.months.mar"),
      t("gym.analytics.months.apr"),
      t("gym.analytics.months.may"),
      t("gym.analytics.months.jun"),
      t("gym.analytics.months.jul"),
      t("gym.analytics.months.aug"),
      t("gym.analytics.months.sep"),
      t("gym.analytics.months.oct"),
      t("gym.analytics.months.nov"),
      t("gym.analytics.months.dec"),
    ],
    [t],
  );

  const option = useMemo(
    () => ({
      tooltip: {
        confine: true,
        position: "top",
        backgroundColor: "#020617",
        textStyle: {
          color: "#f3f4f6",
          fontFamily: "Russo-One",
        },
        borderColor: "#2563eb",
        formatter: function (params: any) {
          const { value, title } = params.data || {};
          if (!value) return "";
          const date = formatDateShort(value[0]);
          const duration = value[1];
          return `${date}\n${title}\n${durationLabel}: ${duration} min`;
        },
      },
      visualMap: {
        show: false,
        inRange: {
          color: ["#2563eb"],
        },
      },
      calendar: {
        top: 20,
        left: 45,
        right: 20,
        bottom: 20,
        cellSize: ["auto", 13],
        range: calendarRange,
        itemStyle: {
          color: "#1e293b",
          borderWidth: 0.5,
        },
        yearLabel: { show: false },
        dayLabel: {
          nameMap: dayNames,
          color: "#e2e8f0",
        },
        monthLabel: {
          nameMap: monthNames,
          color: "#e2e8f0",
        },
      },
      series: {
        type: "heatmap",
        coordinateSystem: "calendar",
        data: heatmapData,
      },
    }),
    [heatmapData, calendarRange, durationLabel, dayNames, monthNames],
  );

  useEffect(() => {
    if (!skiaRef.current) return;
    if (chartSize.width === 0 || chartSize.height === 0) return;

    const chart = echarts.init(skiaRef.current, "light", {
      renderer: "skia",
      width: chartSize.width,
      height: chartSize.height,
    } as any);

    chart.setOption(option);
    return () => chart.dispose();
  }, [option, chartSize]);

  return (
    <View className=" bg-slate-800 rounded-xl">
      <View className="gap-4 bg-slate-900  rounded-2xl shadow-md pt-5">
        <AppText className="text-xl mb-4 text-center">
          {t("gym.analytics.title")}
        </AppText>
        <View className="sm:flex items-center justify-center gap-10 ml-4">
          <View className="flex flex-col gap-5">
            <AppText className="text-lg">
              {t("gym.analytics.totalWorkouts")}: {data.total_sessions}
            </AppText>
            <AppText className="text-lg mb-5">
              {t("gym.analytics.averageDuration")}:{" "}
              {formatDuration(data.avg_duration)}
            </AppText>
          </View>
        </View>
        <View
          style={{
            flex: 1,
            width: "100%",
            minHeight: 200,
          }}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setChartSize({ width, height });
          }}
        >
          <SkiaChart ref={skiaRef} />
        </View>
        <View>
          <AppText className="text-center mb-6">
            {t("gym.analytics.muscleGroupDistribution")}
          </AppText>
          <ChartTabSwitcher data={data} />
        </View>
      </View>
      <View className="mt-6 text-sm text-gray-400 px-4">
        <AppText>{t("gym.analytics.note")}</AppText>
      </View>
      <View className="mt-6 text-sm text-gray-400 px-4 pb-20">
        <AppText>{t("gym.analytics.comingSoon")}</AppText>
      </View>
    </View>
  );
}
