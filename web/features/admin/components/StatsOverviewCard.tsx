"use client";

import { DashboardStats } from "@/database/admin/get-dashboard-stats";
import { useTranslation } from "react-i18next";

type StatsOverviewCardProps = {
  stats: DashboardStats;
};

export default function StatsOverviewCard({ stats }: StatsOverviewCardProps) {
  const { t } = useTranslation("common");

  const items = [
    { label: t("admin.dashboard.totalUsers"), value: stats.total_users },
    { label: t("admin.dashboard.newToday"), value: stats.new_today },
    { label: t("admin.dashboard.newThisWeek"), value: stats.new_this_week },
    { label: t("admin.dashboard.newThisMonth"), value: stats.new_this_month },
  ];

  return (
    <div className="bg-slate-900 rounded-2xl p-4">
      <h3 className="text-lg text-center mb-4 text-gray-100">
        {t("admin.dashboard.overview")}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <span className="text-gray-400 text-xs block font-body">
              {item.label}
            </span>
            <span className="text-2xl text-cyan-400">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
