"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getStepsData } from "@/app/(app)/database/activities/get-steps";
import { getActivitySessionsAnalytics } from "@/app/(app)/database/activities/get-activity-sessions-analytics";
import StepsChart from "./components/StepsChart";
import ActivityBreakdownChart from "./components/ActivityBreakdownChart";

type RangeType = "week" | "month" | "3months";

const ranges: { key: RangeType; label: string }[] = [
  { key: "week", label: "7D" },
  { key: "month", label: "30D" },
  { key: "3months", label: "90D" },
];

function getRangeDays(range: RangeType): number {
  switch (range) {
    case "week":
      return 7;
    case "month":
      return 30;
    case "3months":
      return 90;
  }
}

export default function ActivityAnalytics() {
  const { t } = useTranslation("activities");
  const [selectedRange, setSelectedRange] = useState<RangeType>("week");

  const { data: stepsData = [], isLoading: isLoadingSteps } = useQuery({
    queryKey: ["steps-analytics"],
    queryFn: () => getStepsData(90),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { data: sessionsData = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ["activity-sessions-analytics"],
    queryFn: () => getActivitySessionsAnalytics(90),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - getRangeDays(selectedRange) + 1);
    start.setHours(0, 0, 0, 0);
    return { startDate: start, endDate: end };
  }, [selectedRange]);

  const isLoading = isLoadingSteps && isLoadingSessions;

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center min-h-[403.6px]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl text-center mb-6 text-gray-100">
        {t("activities.analyticsScreen.title")}
      </h1>

      <div className="flex bg-slate-800 rounded-lg p-1 mb-4">
        {ranges.map((range) => (
          <button
            key={range.key}
            onClick={() => setSelectedRange(range.key)}
            className={`flex-1 py-2 rounded-md text-center transition-colors ${
              selectedRange === range.key
                ? "bg-slate-700 text-green-400"
                : "text-gray-200 hover:bg-slate-700/50"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      <StepsChart range={selectedRange} data={stepsData} />

      <div className="mt-4">
        <ActivityBreakdownChart
          data={sessionsData}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    </div>
  );
}
