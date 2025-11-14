"use client";

import useSWR from "swr";
import AnalyticsForm from "../components/AnalyticsForm";

export default function WorkoutAnalyticsPage() {
  const { data, error, isLoading } = useSWR(
    "/api/gym/analytics/last-30-days-RPC"
  );

  console.log("data", data);

  return (
    <div className="h-full bg-slate-800 sm:px-5">
      <h1 className="text-2xl my-5 text-center">Workout Analytics</h1>
      <AnalyticsForm data={data} isLoading={isLoading} error={error} />
    </div>
  );
}
