"use client";

import { useState } from "react";
import WeightChart from "@/app/(app)/weight/components/WeightChart";
import AllDataTable from "@/app/(app)/weight/components/AllDataTable";
import Spinner from "@/app/(app)/components/spinner";
import { weight } from "@/app/(app)/types/models";
import { useQuery } from "@tanstack/react-query";
import { getWeight } from "@/app/(app)/database/weight/get-weight";

type RangeType = "week" | "month" | "year";

const ranges: { key: RangeType; label: string }[] = [
  { key: "week", label: "7D" },
  { key: "month", label: "30D" },
  { key: "year", label: "1Y" },
];

export default function Page() {
  const [range, setRange] = useState<RangeType>("month");

  const {
    data: weight = [],
    error,
    isLoading,
  } = useQuery<weight[]>({
    queryKey: ["get-weight"],
    queryFn: getWeight,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return (
    <div className="pt-8 pb-10">
      <h1 className="text-2xl mb-5 text-center">Weight Analytics</h1>
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
              <p className="mb-4">Loading weight data...</p>
              <Spinner />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[300px] w-full">
              <p className="mb-4 text-lg text-red-500">
                Error loading data. Try again...
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
