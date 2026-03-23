"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useUserGrowth } from "@/features/admin/hooks/useDashboardStats";
import Spinner from "@/components/spinner";
import { useTranslation } from "react-i18next";

type Range = "week" | "month" | "3months";

const RANGE_DAYS: Record<Range, number> = {
  week: 7,
  month: 30,
  "3months": 90,
};

export default function UserGrowthChart() {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language;
  const [range, setRange] = useState<Range>("month");

  const { data, isLoading } = useUserGrowth(RANGE_DAYS[range]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((row) => ({
      date: row.day,
      label: new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
      }).format(new Date(row.day)),
      users: Number(row.cumulative_users),
      newUsers: Number(row.new_users),
    }));
  }, [data, locale]);

  const xAxisInterval = range === "week" ? 0 : range === "month" ? 4 : 10;

  const ranges: { key: Range; label: string }[] = [
    { key: "week", label: t("admin.dashboard.ranges.week") },
    { key: "month", label: t("admin.dashboard.ranges.month") },
    { key: "3months", label: t("admin.dashboard.ranges.threeMonths") },
  ];

  return (
    <div className="bg-slate-900 rounded-2xl p-4">
      <h3 className="text-lg text-center mb-2 text-gray-100">
        {t("admin.dashboard.userGrowth")}
      </h3>

      <div className="flex justify-center gap-2 mb-4">
        {ranges.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`px-3 py-1 rounded-lg text-sm font-body transition-colors ${
              range === r.key
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-gray-300 hover:bg-slate-700"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-[250px]">
          <Spinner />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
          >
            <defs>
              <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              strokeWidth={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "#f3f4f6", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              interval={xAxisInterval}
            />
            <YAxis
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#3b82f6",
                color: "#f3f4f6",
                borderRadius: "8px",
              }}
              labelFormatter={(_, payload) => {
                if (payload?.[0]) {
                  const date = new Date(payload[0].payload.date);
                  return date.toLocaleDateString(locale, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                }
                return "";
              }}
              formatter={(value: number) => [
                `${value} ${t("admin.dashboard.users")}`,
              ]}
            />
            <Area
              type="monotone"
              dataKey="users"
              stroke="#93c5fd"
              strokeWidth={2}
              fill="url(#growthGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
