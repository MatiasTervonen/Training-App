"use client";

import type { HeatMapValue } from "@uiw/react-heat-map";
import HeatMap from "@uiw/react-heat-map";
import { Tooltip } from "react-tooltip";

type SessionHeatMapValue = HeatMapValue & {
  title: string[];
};

type HeatMapData = {
  title: string;
  created_at: string;
}[];

export default function AnalyticsHeatMap({ data }: { data: HeatMapData }) {
  function mapSessionDate(data: HeatMapData): SessionHeatMapValue[] {
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
        width={100}
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
