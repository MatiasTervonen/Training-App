"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { ActivitySessionAnalytics } from "@/app/(app)/database/activities/get-activity-sessions-analytics";
import { useTranslation } from "react-i18next";

type ActivityBreakdownChartProps = {
  data: ActivitySessionAnalytics[];
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

export default function ActivityBreakdownChart({
  data,
  startDate,
  endDate,
}: ActivityBreakdownChartProps) {
  const { t } = useTranslation("activities");

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
      const name = getActivityName(session.activity_slug, session.activity_name);
      activityCounts[name] = (activityCounts[name] || 0) + 1;
    });

    return Object.entries(activityCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData, t]);

  const totalSessions = filteredData.length;

  if (totalSessions === 0) {
    return (
      <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-center min-h-[200px]">
        <span className="text-gray-400">
          {t("activities.analyticsScreen.noActivitiesInPeriod")}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-2xl p-4">
      <h3 className="text-lg font-medium text-center mb-2 text-gray-100">
        {t("activities.analyticsScreen.activityBreakdown")}
      </h3>
      <p className="text-gray-400 text-center text-sm mb-4">
        {totalSessions}{" "}
        {totalSessions === 1
          ? t("activities.analyticsScreen.session")
          : t("activities.analyticsScreen.sessions")}
      </p>

      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            stroke="#0f172a"
            strokeWidth={2}
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                style={{ outline: "none" }}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "#22c55e",
              color: "#f3f4f6",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string) => [
              `${value} ${
                value === 1
                  ? t("activities.analyticsScreen.session")
                  : t("activities.analyticsScreen.sessions")
              }`,
              name,
            ]}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{
              paddingTop: "20px",
            }}
            formatter={(value) => (
              <span style={{ color: "#f3f4f6", fontSize: "11px" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
