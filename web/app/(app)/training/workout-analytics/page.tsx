"use client";

import ModalPageWrapper from "@/app/(app)/components/modalPageWrapper";
// import useSWR from "swr";
// import { fetcher } from "@/app/(app)/lib/fetcher";

export default function WorkoutAnalyticsPage() {
  // const { data, error } = useSWR("/api/gym/analytics/last-30-days", fetcher, {
  //   revalidateOnFocus: false,
  //   revalidateOnReconnect: false,
  //   revalidateIfStale: false,
  // });

  // console.log("Analytics Data:", data);

  return (
    <ModalPageWrapper>
      <div className="h-full bg-slate-800 text-gray-100 p-5">
        <h1 className="text-2xl my-5 text-center">Workout Analytics</h1>
        <div className="flex flex-col max-w-md mx-auto">
          <p className="text-gray-300 text-center">
            This page is under construction. Please check back later.
          </p>
        </div>
      </div>
    </ModalPageWrapper>
  );
}
