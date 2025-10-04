"use client";

import useSWR from "swr";
import { fetcher } from "@/app/(app)/lib/fetcher";
import AnalyticsForm from "../components/AnalyticsForm";
import { full_gym_session } from "../../types/models";

export default function WorkoutAnalyticsPage() {
  const { data, error, isLoading } = useSWR<full_gym_session[]>(
    "/api/gym/analytics/last-30-days",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return (
      <div className="h-full bg-slate-800 text-gray-100 sm:px-5">
        <h1 className="text-2xl my-5 text-center">Workout Analytics</h1>
        <AnalyticsForm data={data ?? []} isLoading={isLoading} error={error} />
      </div>
  );
}
