"use client";

import MuscleGroupChart from "@/features/gym/components/analytics/MuscleGroupChart";
import MuscleGroupChartSets from "@/features/gym/components/analytics/MuscleGroupChartSets";
import { useState } from "react";
import { Last30DaysAnalytics } from "@/types/session";
import { useTranslation } from "react-i18next";

export default function ChartTabSwitcher({
  data,
}: {
  data: Last30DaysAnalytics;
}) {
  const { t } = useTranslation("gym");
  const [activeTab, setActiveTab] = useState<
    "muscleGroups" | "muscleGroupSets"
  >("muscleGroups");

  return (
    <div>
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={() => setActiveTab("muscleGroups")}
          className={`px-4 py-2 w-[150px] rounded-md shadow-md cursor-pointer transition-all duration-200 hover:scale-105 text-lg ${
            activeTab === "muscleGroups"
              ? "bg-blue-500/20 border border-blue-500/40 text-blue-400"
              : "bg-gray-500/20 border border-gray-500/40 text-gray-400"
          }`}
        >
          {t("gym.analytics.tabs.exercises")}
        </button>
        <button
          onClick={() => setActiveTab("muscleGroupSets")}
          className={`px-4 py-2 w-[150px] rounded-md shadow-md cursor-pointer transition-all duration-200 hover:scale-105 text-lg ${
            activeTab === "muscleGroupSets"
              ? "bg-blue-500/20 border border-blue-500/40 text-blue-400"
              : "bg-gray-500/20 border border-gray-500/40 text-gray-400"
          }`}
        >
          {t("gym.analytics.tabs.sets")}
        </button>
      </div>
      <div className="mb-2">
        {activeTab === "muscleGroups" && <MuscleGroupChart data={data} />}
        {activeTab === "muscleGroupSets" && (
          <MuscleGroupChartSets data={data} />
        )}
      </div>
    </div>
  );
}
