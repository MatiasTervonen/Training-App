"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
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

export default function NewRegistrationsChart() {
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
      value: Number(row.new_users),
    }));
  }, [data, locale]);

  const totalNew = chartData.reduce((sum, d) => sum + d.value, 0);
  const xAxisInterval = range === "week" ? 0 : range === "month" ? 4 : 10;

  const ranges: { key: Range; label: string }[] = [
    { key: "week", label: t("admin.dashboard.ranges.week") },
    { key: "month", label: t("admin.dashboard.ranges.month") },
    { key: "3months", label: t("admin.dashboard.ranges.threeMonths") },
  ];

  return (
    <div className="bg-slate-900 rounded-2xl p-4">
      <h3 className="text-lg text-center mb-2 text-gray-100">
        {t("admin.dashboard.newRegistrations")}
      </h3>

      <div className="flex justify-center gap-2 mb-2">
        {ranges.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`px-3 py-1 rounded-lg text-sm font-body transition-colors ${
              range === r.key
                ? "bg-green-600 text-white"
                : "bg-slate-800 text-gray-300 hover:bg-slate-700"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="text-center mb-4">
        <span className="text-gray-400 text-xs font-body">
          {t("admin.dashboard.totalInPeriod")}
        </span>
        <span className="text-xl text-green-400 ml-2">{totalNew}</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-[250px]">
          <Spinner />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 15, bottom: 20, left: 0 }}
          >
            <defs>
              <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#16a34a" />
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
              cursor={false}
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#22c55e",
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
                `${value} ${t("admin.dashboard.newUsers")}`,
              ]}
            />
            <Bar
              dataKey="value"
              fill="url(#regGradient)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
