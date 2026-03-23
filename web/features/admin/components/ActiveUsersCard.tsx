"use client";

import { DashboardStats } from "@/database/admin/get-dashboard-stats";
import { useTranslation } from "react-i18next";

type ActiveUsersCardProps = {
  stats: DashboardStats;
};

export default function ActiveUsersCard({ stats }: ActiveUsersCardProps) {
  const { t } = useTranslation("common");

  const items = [
    { label: t("admin.dashboard.active5m"), value: stats.active_5m, color: "text-green-400" },
    { label: t("admin.dashboard.active15m"), value: stats.active_15m, color: "text-green-300" },
    { label: t("admin.dashboard.active1h"), value: stats.active_1h, color: "text-blue-400" },
    { label: t("admin.dashboard.active24h"), value: stats.active_24h, color: "text-blue-300" },
  ];

  return (
    <div className="bg-slate-900 rounded-2xl p-4">
      <h3 className="text-lg text-center mb-4 text-gray-100">
        {t("admin.dashboard.activeUsers")}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <span className="text-gray-400 text-xs block font-body">
              {item.label}
            </span>
            <span className={`text-2xl ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
