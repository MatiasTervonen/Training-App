"use client";

import { Last30DaysAnalytics } from "@/types/session";
import ChartTabSwitcher from "@/features/gym/components/analytics/AnalyticsChartTabSwitcher";
import AnalyticsHeatMap from "@/features/gym/components/analytics/AnalyticsHeatMap";
import { useTranslation } from "react-i18next";
import { formatDuration } from "@/lib/formatDate";

type AnalyticsFormProps = {
  data: Last30DaysAnalytics;
};

export default function AnalyticsForm({ data }: AnalyticsFormProps) {
  const { t } = useTranslation("gym");

  return (
    <>
      <div className="flex flex-col gap-4 bg-slate-900 p-4 rounded-2xl shadow-md pt-5">
        <h2 className="text-xl mb-4 text-center">{t("gym.analytics.title")}</h2>
        <div className="sm:flex items-center justify-center gap-10 ml-4">
          <div className="flex flex-col gap-5">
            <p className="text-lg font-body">
              {t("gym.analytics.totalWorkouts")}: {data.analytics.total_sessions}
            </p>
            <p className="text-lg mb-5 font-body">
              {t("gym.analytics.averageDuration")}:{" "}
              {formatDuration(data.analytics.avg_duration)}
            </p>
          </div>
        </div>
        <div className="flex justify-center items-center w-full">
          <AnalyticsHeatMap data={data.heatMap} />
        </div>
        <h2 className="text-center text-lg text-slate-200">
          {t("gym.analytics.muscleGroupDistribution")}
        </h2>
        <ChartTabSwitcher data={data} />
      </div>
      <div className="mt-6 px-4 flex flex-col gap-4">
        <p className="text-sm font-body text-gray-400">
          {t("gym.analytics.note")}
        </p>
        <p className="text-sm font-body text-gray-400">
          {t("gym.analytics.comingSoon")}
        </p>
      </div>
    </>
  );
}
