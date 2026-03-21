"use client";

import { useMemo } from "react";
import { Last30DaysAnalytics } from "@/types/session";
import { useTranslation } from "react-i18next";

export default function MuscleGroupChartSets({
  data,
}: {
  data: Last30DaysAnalytics;
}) {
  const { t } = useTranslation("gym");

  const chartData = useMemo(() => {
    return data.analytics.sets_per_muscle_group
      .map((item) => ({
        label: t(`gym.muscleGroups.${item.group}`),
        value: item.count,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data, t]);

  const maxValue = Math.max(...chartData.map((item) => item.value), 1);

  return (
    <div className="flex flex-col gap-2 my-5 mx-auto max-w-lg w-full px-4">
      {chartData.map((item, index) => {
        const widthPercent = (item.value / maxValue) * 100;

        return (
          <div
            key={index}
            className="flex items-center justify-between border-b border-slate-700/50"
          >
            <div className="flex items-center flex-1 relative">
              <span className="absolute z-10 pl-2 font-body text-gray-200">
                {item.label}
              </span>
              <div
                className="h-[30px] rounded-[3px] transition-all duration-700 ease-out"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: "rgba(59, 130, 246, 0.2)",
                  border: "1px solid rgba(59, 130, 246, 0.4)",
                  animationDelay: `${index * 120}ms`,
                }}
              />
            </div>
            <span className="ml-2 min-w-[40px] text-right font-body text-gray-200">
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
