"use client";

import { useEffect, useRef, useMemo } from "react";
import * as echarts from "echarts/core";
import { HeatmapChart } from "echarts/charts";
import {
  CalendarComponent,
  VisualMapComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { formatDateShort } from "@/lib/formatDate";
import { useTranslation } from "react-i18next";

echarts.use([
  CanvasRenderer,
  HeatmapChart,
  CalendarComponent,
  VisualMapComponent,
  TooltipComponent,
]);

type HeatMapData = {
  title: string;
  created_at: string;
  duration?: number;
}[];

export default function AnalyticsHeatMap({ data }: { data: HeatMapData }) {
  const { t } = useTranslation("gym");
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const heatmapData = useMemo(() => {
    if (!data) return [];
    return data.map((session) => {
      const date = new Date(session.created_at).toISOString().split("T")[0];
      const durationMinutes = session.duration
        ? Math.round(session.duration / 60)
        : 0;
      return {
        value: [date, durationMinutes],
        title: session.title,
      };
    });
  }, [data]);

  const calendarRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    return [
      start.toISOString().split("T")[0],
      end.toISOString().split("T")[0],
    ];
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
        triggerOn: "click" as const,
        confine: true,
        position: "top" as const,
        backgroundColor: "#0f172a",
        borderColor: "#3b82f6",
        borderWidth: 1.5,
        borderRadius: 12,
        padding: [10, 14],
        textStyle: {
          color: "#f3f4f6",
        },
        formatter: function (params: {
          data?: { value?: [string, number]; title?: string };
        }) {
          const { value, title } = params.data || {};
          if (!value) return "";
          const date = formatDateShort(value[0]);
          const duration = value[1];
          return `${date}<br/>${title}<br/>${durationLabel}: ${duration} min`;
        },
      },
      visualMap: {
        show: false,
        min: 0,
        max: Math.max(
          ...heatmapData.map((d) => (d.value as [string, number])[1]),
          1,
        ),
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
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [option]);

  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto flex justify-center">
      <div ref={chartRef} className="w-full" style={{ height: 200 }} />
    </div>
  );
}
