"use client";

import AnalyticsForm from "@/app/(app)/gym/components/analytics/AnalyticsForm";
import { useQuery } from "@tanstack/react-query";
import { get30dAnalytics } from "@/app/(app)/database/gym/analytics/last-30-days";
import Spinner from "@/app/(app)/components/spinner";
import { useTranslation } from "react-i18next";

export default function WorkoutAnalyticsPage() {
  const { t } = useTranslation("gym");
  const { data, error, isLoading } = useQuery({
    queryKey: ["last-30d-analytics"],
    queryFn: get30dAnalytics,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  return (
    <div className="sm:px-5 pb-10">
      <h1 className="text-2xl my-5 text-center">
        {t("gym.analyticsScreen.title")}
      </h1>
      {isLoading && !data ? (
        <div className="flex flex-col  items-center gap-2 mt-20 px-6">
          <p className="text-gray-300 text-center text-xl">
            {t("gym.analyticsScreen.loading")}
          </p>
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-red-500 text-center mt-20 px-6">
          {t("gym.analyticsScreen.error")}
        </p>
      ) : !data || data.analytics.total_sessions === 0 ? (
        <p className="text-gray-300 text-center mt-20 px-6">
          {t("gym.analyticsScreen.noData")}
        </p>
      ) : (
        <AnalyticsForm data={data} />
      )}
    </div>
  );
}
