"use client";

import { useState } from "react";
import WeightChart from "@/features/weight/components/WeightChart";
import AllDataTable from "@/features/weight/components/AllDataTable";
import Spinner from "@/components/spinner";
import { weight } from "@/types/models";
import { useQuery } from "@tanstack/react-query";
import { getWeight } from "@/database/weight/get-weight";
import { useTranslation } from "react-i18next";

type RangeType = "week" | "month" | "year";

export default function Page() {
  const { t } = useTranslation("weight");
  const [range, setRange] = useState<RangeType>("month");

  const ranges: { key: RangeType; label: string }[] = [
    { key: "week", label: t("weight.analyticsScreen.range7d") },
    { key: "month", label: t("weight.analyticsScreen.range30d") },
    { key: "year", label: t("weight.analyticsScreen.range1y") },
  ];

  const {
    data: weight = [],
    error,
    isLoading,
  } = useQuery<weight[]>({
    queryKey: ["get-weight"],
    queryFn: getWeight,
  });

  return (
    <div className="pt-8 pb-10">
      <h1 className="text-2xl mb-5 text-center">
        {t("weight.analyticsScreen.title")}
      </h1>
      <div className="flex flex-col">
        <div className="flex justify-center mb-5 mx-4">
          <div className="flex bg-slate-800 rounded-lg p-1">
            {ranges.map((option) => (
              <button
                key={option.key}
                onClick={() => setRange(option.key)}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  range === option.key
                    ? "bg-slate-700 text-cyan-400"
                    : "text-gray-200 hover:text-gray-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          {isLoading ? (
            <div className="flex flex-col items-center text-gray-400 justify-center h-[300px] w-full mb-5">
              <p className="mb-4">{t("weight.analyticsScreen.loading")}</p>
              <Spinner />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[300px] w-full">
              <p className="mb-4 text-lg text-red-500">
                {t("weight.analyticsScreen.error")}
              </p>
            </div>
          ) : (
            <WeightChart range={range} data={weight} />
          )}
        </div>
        <div>
          <AllDataTable data={weight} />
        </div>
      </div>
    </div>
  );
}
