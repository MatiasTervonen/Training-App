"use client";

import { full_gym_session } from "../../types/models";
import Spinner from "../../components/spinner";
import ChartTabSwitcher from "./AnalyticsChartTabSwitcher";
import AnalyticsHeatMap from "./AnalyticsHeatMap";

export default function AnalyticsForm({
  data,
  isLoading,
  error,
  
}: {
  data: full_gym_session[];
  isLoading: boolean;
  error: Error | null;
}) {
  function totalSessions30Days(data: full_gym_session[]) {
    return data.length;
  }

  function averageDuration(data: full_gym_session[]) {
    const totalDuration = data.reduce(
      (acc, session) => acc + session.duration,
      0
    );
    return Math.round(totalDuration / 60 / data.length || 0);
  }

  return (
    <div className="h-full bg-slate-800 text-gray-100 rounded-xl">
      {!error && isLoading && (
        <div className="flex flex-col  items-center gap-2 mt-20">
          <p className="text-gray-300 text-center text-xl">Loading...</p>
          <Spinner />
        </div>
      )}

      {error && (
        <p className="text-red-500 text-center mt-20">
          Error loading workout data. Try again!
        </p>
      )}

      {!error && !isLoading && data.length === 0 && (
        <p className="text-gray-300 text-center mt-20">
          No workout data available. Start logging your workouts to see
          analytics!
        </p>
      )}

      {!isLoading && !error && data.length > 0 && (
        <>
          <div className="flex flex-col gap-4 bg-slate-900 p-4 rounded-2xl shadow-xl">
            <h2 className="text-xl mb-4 text-center">Last 30 Days Analytics</h2>
            <div className="sm:flex items-center justify-center gap-10 ml-4">
              <div className="flex flex-col gap-5">
                <h3 className="text-lg">
                  Total workouts: {totalSessions30Days(data)}
                </h3>
                <h3 className="text-lg mb-5">
                  Average Duration: {averageDuration(data)} minutes
                </h3>
              </div>
              <AnalyticsHeatMap data={data} />
            </div>
            <h2 className="text-center">Muscle Group Distribution</h2>
            <ChartTabSwitcher data={data} />
          </div>
          <div className="mt-6 text-sm text-gray-400 px-4">
            <p>
              Note: Analytics are based on the last 30 days of workout data.
            </p>
          </div>
          <div className="mt-6 text-sm text-gray-400 px-4 pb-20">
            <p>More analytics coming soon!</p>
          </div>
        </>
      )}
    </div>
  );
}
