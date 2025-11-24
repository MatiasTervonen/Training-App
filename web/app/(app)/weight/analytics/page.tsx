"use client";

import { useState } from "react";
import WeightChart from "../components/WeightChart";
import AllDataTable from "../components/AllDataTable";
import Spinner from "@/app/(app)/components/spinner";
import { weight } from "@/app/(app)/types/models";
import { useQuery } from "@tanstack/react-query";
import { getWeight } from "../../database/weight";

export default function Page() {
  const [range, setRange] = useState<"week" | "month" | "year" | "all">(
    "month"
  );

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
    <div className="pt-5 pb-10">
      <h1 className="text-2xl mb-5 text-center">Weight analytics</h1>
      <div className="flex flex-col ">
        <div className="flex justify-center gap-3 mb-5">
          {["week", "month", "year", "all"].map((option) => (
            <button
              key={option}
              onClick={() =>
                setRange(option as "week" | "month" | "year" | "all")
              }
              className={`px-4 py-2 m-1 rounded-lg ${
                range === option
                  ? "bg-blue-600 text-gray-100"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
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
