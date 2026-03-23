"use client";

import { useDashboardStats } from "@/features/admin/hooks/useDashboardStats";
import ActiveUsersCard from "@/features/admin/components/ActiveUsersCard";
import StatsOverviewCard from "@/features/admin/components/StatsOverviewCard";
import PlatformSplitChart from "@/features/admin/components/PlatformSplitChart";
import UserGrowthChart from "@/features/admin/components/UserGrowthChart";
import NewRegistrationsChart from "@/features/admin/components/NewRegistrationsChart";
import Spinner from "@/components/spinner";
import { useTranslation } from "react-i18next";

export default function AdminDashboard() {
  const { t } = useTranslation("common");
  const { data: stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="page-padding flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="page-padding text-center">
        <p className="text-red-500 font-body">{t("admin.dashboard.loadError")}</p>
      </div>
    );
  }

  return (
    <div className="page-padding max-w-5xl mx-auto">
      <h1 className="text-2xl text-center mb-6">
        {t("admin.dashboard.title")}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <ActiveUsersCard stats={stats} />
        <StatsOverviewCard stats={stats} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <PlatformSplitChart stats={stats} />
        <UserGrowthChart />
      </div>

      <div className="mb-4">
        <NewRegistrationsChart />
      </div>
    </div>
  );
}
