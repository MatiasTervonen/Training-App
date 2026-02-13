"use client";

import { Last30DaysAnalytics } from "@/types/session";
import ChartTabSwitcher from "@/features/gym/components/analytics/AnalyticsChartTabSwitcher";
import AnalyticsHeatMap from "@/features/gym/components/analytics/AnalyticsHeatMap";
import { useTranslation } from "react-i18next";

type AnalyticsFormProps = {
  data: Last30DaysAnalytics;
};

export default function AnalyticsForm({ data }: AnalyticsFormProps) {
  const { t } = useTranslation("gym");

  return (
    <>
      <div className="flex flex-col gap-4 bg-slate-900 p-4 rounded-2xl shadow-xl">
        <h2 className="text-xl mb-4 text-center">{t("gym.analytics.title")}</h2>
        <div className="sm:flex  items-center justify-center gap-10 ml-4">
          <div className="flex flex-col items-center gap-5">
            <h3 className="text-lg">
              {t("gym.analytics.totalWorkouts")}: {data.analytics.total_sessions}
            </h3>
            <h3 className="text-lg mb-5">
              {t("gym.analytics.averageDuration")}:{" "}
              {Math.round(data.analytics.avg_duration / 60)}{" "}
              {t("gym.analytics.minutes")}
            </h3>
          </div>
          <div className="flex justify-center items-center">
            <AnalyticsHeatMap data={data.heatMap} />
          </div>
        </div>
        <h2 className="text-center">{t("gym.analytics.muscleGroupDistribution")}</h2>
        <ChartTabSwitcher data={data} />
      </div>
      <div className="px-4">
        <div className="mt-6 text-sm text-gray-400">
          <p>{t("gym.analytics.note")}</p>
        </div>
        <div className="mt-6 text-sm text-gray-400">
          <p>{t("gym.analytics.comingSoon")}</p>
        </div>
      </div>
    </>
  );
}
