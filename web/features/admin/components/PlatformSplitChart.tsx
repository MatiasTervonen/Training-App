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
import { DashboardStats } from "@/database/admin/get-dashboard-stats";
import { useTranslation } from "react-i18next";

type PlatformSplitChartProps = {
  stats: DashboardStats;
};

const COLORS = ["#3b82f6", "#22c55e"];

export default function PlatformSplitChart({ stats }: PlatformSplitChartProps) {
  const { t } = useTranslation("common");

  const chartData = useMemo(() => {
    return [
      { name: t("admin.dashboard.web"), value: stats.web_active },
      { name: t("admin.dashboard.mobile"), value: stats.mobile_active },
    ].filter((item) => item.value > 0);
  }, [stats, t]);

  const total = stats.web_active + stats.mobile_active;

  if (total === 0) {
    return (
      <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-center min-h-[200px]">
        <span className="text-gray-400 font-body">
          {t("admin.dashboard.noActiveUsers")}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-2xl p-4">
      <h3 className="text-lg text-center mb-2 text-gray-100">
        {t("admin.dashboard.platformSplit")}
      </h3>
      <p className="text-gray-400 text-center text-sm mb-4 font-body">
        {t("admin.dashboard.last24h")}
      </p>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={85}
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
              borderColor: "#3b82f6",
              color: "#f3f4f6",
              borderRadius: "8px",
            }}
            itemStyle={{ color: "#f3f4f6" }}
            formatter={(value: number, name: string) => [
              `${value} ${t("admin.dashboard.users")}`,
              name,
            ]}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => (
              <span style={{ color: "#f3f4f6", fontSize: "13px" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
