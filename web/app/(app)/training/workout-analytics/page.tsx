"use client";

import AnalyticsForm from "../components/AnalyticsForm";
import { useQuery } from "@tanstack/react-query";
import { get30dAnalytics } from "../../database/gym";
import Spinner from "../../components/spinner";

export default function WorkoutAnalyticsPage() {
  const { data, error, isLoading } = useQuery({
    queryKey: ["last-30d-analytics"],
    queryFn: get30dAnalytics,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  return (
    <div className="sm:px-5 pb-10">
      <h1 className="text-2xl my-5 text-center">Workout Analytics</h1>
      {isLoading && !data ? (
        <div className="flex flex-col  items-center gap-2 mt-20 px-6">
          <p className="text-gray-300 text-center text-xl">Loading...</p>
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-red-500 text-center mt-20 px-6">
          Error loading workout data. Try again!
        </p>
      ) : !data || data.analytics.total_sessions === 0 ? (
        <p className="text-gray-300 text-center mt-20 px-6">
          No workout data available. Start logging your workouts to see
          analytics!
        </p>
      ) : (
        <AnalyticsForm data={data} />
      )}
    </div>
  );
}
