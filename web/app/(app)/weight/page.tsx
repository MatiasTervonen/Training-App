"use client";

import { useState } from "react";
import WeightChart from "@/features/weight/components/WeightChart";
import AllDataTable from "@/features/weight/components/AllDataTable";
import Spinner from "@/components/spinner";
import { weight } from "@/types/models";
import { useQuery } from "@tanstack/react-query";
import { getWeight } from "@/database/weight/get-weight";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import Link from "next/link";

type RangeType = "week" | "month" | "year";

export default function WeightPage() {
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
    <div className="h-full relative">
      <div className="max-w-2xl mx-auto relative bg-linear-to-b from-slate-950 via-slate-900 to-slate-800 px-5 pt-3 pb-10 overflow-y-auto touch-pan-y h-full">
        {/* Range selector */}
        <div className="flex justify-center mb-4 mt-2">
          <div className="flex bg-slate-800 rounded-lg p-1 w-full">
            {ranges.map((option) => (
              <button
                key={option.key}
                onClick={() => setRange(option.key)}
                className={`flex-1 py-2 rounded-md font-medium transition-colors cursor-pointer ${
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

        {/* Chart */}
        <div>
          {isLoading ? (
            <div className="flex flex-col items-center text-gray-400 justify-center h-[300px] w-full mb-5 font-body">
              <p className="mb-4">{t("weight.analyticsScreen.loading")}</p>
              <Spinner />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[300px] w-full font-body">
              <p className="mb-4 text-lg text-red-500">
                {t("weight.analyticsScreen.error")}
              </p>
            </div>
          ) : (
            <WeightChart range={range} data={weight} />
          )}
        </div>

        {/* Data table */}
        <div>
          <AllDataTable data={weight} />
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="absolute bottom-8 right-6 z-50 pointer-events-none">
        <Link
          href="/weight/tracking"
          className="pointer-events-auto w-14 h-14 rounded-full bg-slate-800 border-[1.5px] border-amber-400/60 shadow-lg shadow-amber-400/30 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Plus size={30} className="text-amber-400" />
        </Link>
      </div>
    </div>
  );
}
