"use client";

import { russoOne } from "@/app/ui/fonts";
import ModalPageWrapper from "@/app/(app)/components/modalPageWrapper";
import { useState } from "react";
import WeightChart from "../components/WeightChart";
import AllDataTable from "../components/AllDataTable";
import useSWR from "swr";
import Spinner from "@/app/(app)/components/spinner";
import { fetcher } from "@/app/(app)/lib/fetcher";
import { weight } from "@/app/(app)/types/models";

export default function TrainingPage() {
  const [range, setRange] = useState<"week" | "month" | "year" | "all">(
    "month"
  );

  const {
    data: weight = [],
    error,
    isLoading,
  } = useSWR<weight[]>("/api/weight/get-weight", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return (
    <ModalPageWrapper>
      <div
        className={`${russoOne.className} h-full bg-slate-800 text-gray-100 py-5`}
      >
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
    </ModalPageWrapper>
  );
}
