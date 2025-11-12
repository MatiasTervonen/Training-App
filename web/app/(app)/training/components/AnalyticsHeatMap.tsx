"use client";

import type { HeatMapValue } from "@uiw/react-heat-map";
import HeatMap from "@uiw/react-heat-map";
import { Tooltip } from "react-tooltip";
import { full_gym_session } from "@/app/(app)/types/models";

type SessionHeatMapValue = HeatMapValue & {
  title: string[];
};

export default function AnalyticsHeatMap({
  data,
}: {
  data: full_gym_session[];
}) {
  function mapSessionDate(data: full_gym_session[]): SessionHeatMapValue[] {
    const uniqueDates: { [key: string]: string[] } = {};
    data.forEach((session) => {
      const date = session.created_at.split("T")[0];
      if (!uniqueDates[date]) {
        uniqueDates[date] = [];
      }
      uniqueDates[date].push(session.title!);
    });

    return Object.entries(uniqueDates).map(([date, title]) => ({
      date,
      count: 1, // always 1, just to mark presence
      title,
    }));
  }

  const sessionData = mapSessionDate(data);

  return (
    <>
      <HeatMap
        width={150}
        value={sessionData}
        weekLabels={["", "Mon", "", "Wed", "", "Fri", ""]}
        monthLabels={[
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ]}
        // startDate={new Date(new Date().getFullYear(), 0, 1)} // start from Jan 1 of current year
        // endDate={new Date()}
        className="my-heatmap"
        panelColors={{
          0: "#364153",
          1: "blue",
        }}
        legendCellSize={0}
        space={3}
        startDate={new Date(new Date().setDate(new Date().getDate() - 30))} // 30 days ago
        endDate={new Date()} // today
        rectRender={(props, data) => {
          const session = data as unknown as SessionHeatMapValue;
          if (!session.count) return <rect {...props} />;
          return (
            <rect
              {...props}
              data-tooltip-id="my-tooltip"
              data-tooltip-html={`${session.date}<br />${session.title}`}
            />
          );
        }}
      />
      <Tooltip id="my-tooltip" />
    </>
  );
}
