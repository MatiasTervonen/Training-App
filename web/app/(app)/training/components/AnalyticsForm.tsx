"use client";

import { Last30DaysAnalytics } from "../../types/session";
import ChartTabSwitcher from "./AnalyticsChartTabSwitcher";
import AnalyticsHeatMap from "./AnalyticsHeatMap";

type AnalyticsFormProps = {
  data: Last30DaysAnalytics;
};

export default function AnalyticsForm({ data }: AnalyticsFormProps) {
  return (
    <>
      <div className="flex flex-col gap-4 bg-slate-900 p-4 rounded-2xl shadow-xl">
        <h2 className="text-xl mb-4 text-center">Last 30 Days Analytics</h2>
        <div className="sm:flex  items-center justify-center gap-10 ml-4">
          <div className="flex flex-col items-center gap-5">
            <h3 className="text-lg">
              Total workouts: {data.analytics.total_sessions}
            </h3>
            <h3 className="text-lg mb-5">
              Average Duration: {Math.round(data.analytics.avg_duration / 60)}{" "}
              minutes
            </h3>
          </div>
          <div className="flex justify-center items-center">
            <AnalyticsHeatMap data={data.heatMap} />
          </div>
        </div>
        <h2 className="text-center">Muscle Group Distribution</h2>
        <ChartTabSwitcher data={data} />
      </div>
      <div className="px-4">
        <div className="mt-6 text-sm text-gray-400">
          <p>Note: Analytics are based on the last 30 days of workout data.</p>
        </div>
        <div className="mt-6 text-sm text-gray-400">
          <p>More analytics coming soon!</p>
        </div>
      </div>
    </>
  );
}
