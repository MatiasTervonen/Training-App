import { View } from "react-native";
import AppText from "@/components/AppText";
import { full_gym_session } from "@/types/models";
import ChartTabSwitcher from "@/Features/gym/analytics/AnalytictsChartTabSwitcher";
import * as echarts from "echarts/core";
import {
  CalendarComponent,
  VisualMapComponent,
  TooltipComponent,
} from "echarts/components";
import { HeatmapChart } from "echarts/charts";
import { SkiaRenderer, SkiaChart } from "@wuba/react-native-echarts";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDate, formatDuration } from "@/lib/formatDate";

type AnalyticsFormProps = {
  data: {
    total_sessions: number;
    avg_duration: number;
    muscle_groups: { group: string; count: number }[];
    sets_per_muscle_group: { group: string; count: number }[];
  };
  heatmap: full_gym_session[];
};

echarts.use([
  SkiaRenderer,
  HeatmapChart,
  CalendarComponent,
  VisualMapComponent,
  TooltipComponent,
]);

export default function AnalyticsForm({ data, heatmap }: AnalyticsFormProps) {
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

  const option = useMemo(
    () => ({
      tooltip: {
        confine: true,
        position: "top",
        backgroundColor: "#020617",
        textStyle: { color: "#f3f4f6" },
        borderColor: "#2563eb",
        formatter: function (params: any) {
          const { value, title } = params.data || {};
          if (!value) return "";
          const date = formatDate(value[0]);
          const duration = value[1];
          return `${date}\n${title}\nDuration: ${duration} min`;
        },
      },
      visualMap: {
        show: false,
        inRange: {
          color: ["#2563eb"],
        },
      },
      dayLabel: {
        nameMap: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
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
      },
      series: {
        type: "heatmap",
        coordinateSystem: "calendar",
        data: heatmapData,
      },
    }),
    [heatmapData, calendarRange],
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
          Last 30 Days Analytics
        </AppText>
        <View className="sm:flex items-center justify-center gap-10 ml-4">
          <View className="flex flex-col gap-5">
            <AppText className="text-lg">
              Total workouts: {data.total_sessions}
            </AppText>
            <AppText className="text-lg mb-5">
              Average Duration: {formatDuration(data.avg_duration)}
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
            Muscle Group Distribution
          </AppText>
          <ChartTabSwitcher data={data} />
        </View>
      </View>
      <View className="mt-6 text-sm text-gray-400 px-4">
        <AppText>
          Note: Analytics are based on the last 30 days of workout data.
        </AppText>
      </View>
      <View className="mt-6 text-sm text-gray-400 px-4 pb-20">
        <AppText>More analytics coming soon!</AppText>
      </View>
    </View>
  );
}
