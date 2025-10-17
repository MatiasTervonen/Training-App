import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import { weight } from "@/app/(app)/types/models";

type WeightChartProps = {
  range: "week" | "month" | "year" | "all";
  data: weight[];
};

function addOffsetToDate(
  base: Date,
  range: string,
  offset: number,
  earliest?: Date
): [Date, Date] {
  const end = new Date(base);
  const start = new Date(base);

  switch (range) {
    case "week":
      start.setDate(end.getDate() - 6);
      break;
    case "month":
      start.setMonth(end.getMonth() - 1);
      break;
    case "year":
      start.setFullYear(end.getFullYear() - 1);
      break;
    case "all":
      if (earliest) return [earliest, base];
      return [new Date(0), base];
  }

  // Shift start and end based on offset
  const diff = end.getTime() - start.getTime();
  end.setTime(end.getTime() - diff * offset);
  start.setTime(start.getTime() - diff * offset);

  return [start, end];
}

// This function retrieves the latest date from the weight data entries.

function getLatestDate(data: weight[]) {
  return new Date(
    Math.max(...data.map((entry) => new Date(entry.created_at).getTime()))
  );
}

function formatDatelabel(
  dateString: string,
  range: "week" | "month" | "year" | "all"
): string {
  const date = new Date(dateString);
  switch (range) {
    case "week":
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
      }).format(date);
    case "month":
      return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
      }).format(date);
    case "year":
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
      })
        .format(date)
        .charAt(0);
    case "all":
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
      }).format(date);
  }
}

function generateDateRange(start: Date, end: Date): string[] {
  const dateList: string[] = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dateList.push(currentDate.toISOString().split("T")[0]); // Format as YYYY-MM-DD
    currentDate.setDate(currentDate.getDate() + 1); // Increment by one day
  }
  return dateList;
}

function fillMissingDates(
  fullDates: string[],
  entries: weight[]
): { date: string; weight: number | null }[] {
  const weightMap = new Map(
    entries.map((entry) => [entry.created_at.split("T")[0], entry.weight])
  );

  return fullDates.map((date) => ({
    date,
    weight: weightMap.has(date) ? weightMap.get(date)! : null,
  }));
}

function getEarliestDate(data: weight[]) {
  return new Date(
    Math.min(...data.map((entry) => new Date(entry.created_at).getTime()))
  );
}

function generateXTicks(range: string, dateList: string[]): string[] {
  const result: string[] = [];

  for (let i = 0; i < dateList.length; i++) {
    const date = new Date(dateList[i]);

    switch (range) {
      case "week":
        // Show every day (or every other day)
        if (i % 1 === 0) result.push(dateList[i]);
        break;
      case "month":
        // Show every 5th day
        if (date.getDate() % 5 === 0) result.push(dateList[i]);
        break;
      case "year":
        // Show the 1st of each month
        if (date.getDate() === 1) result.push(dateList[i]);
        break;
      case "all":
        // Show the 1st of each year
        if (date.getDate() === 1 && date.getMonth() === 0)
          result.push(dateList[i]);
        break;
    }
  }

  return result;
}

export default function WeightChart({ range, data }: WeightChartProps) {
  const [offset, setOffset] = useState(0);
  const latestDate = getLatestDate(data); // Hakee viiemeissimmän päivämäärän datasta
  const earliestDate = getEarliestDate(data);

  const [start, end] = addOffsetToDate(latestDate, range, offset, earliestDate);

  const weightUnit = useUserStore(
    (state) => state.preferences?.weight_unit || "kg"
  );

  useEffect(() => {
    setOffset(0); // Reset offset whenever range changes
  }, [range]);

  const filteredData = data.filter((entry) => {
    const entryDate = new Date(entry.created_at);
    return entryDate >= start && entryDate <= end;
  });

  const firstEntry = filteredData.find((entry) => entry.weight !== null);
  const lastEntry = [...filteredData]
    .reverse()
    .find((entry) => entry.weight !== null);

  let weightDifference: string | number = "N/A";

  if (firstEntry && lastEntry) {
    const diff = lastEntry.weight - firstEntry.weight;
    const rounded = Math.round(diff * 10) / 10;

    weightDifference =
      rounded > 0
        ? `+ ${rounded}`
        : rounded < 0
        ? `- ${Math.abs(rounded)}`
        : `${rounded}`;
  }

  const fullDateRange = generateDateRange(start, end);
  const chartData = fillMissingDates(fullDateRange, filteredData);

  function formatDateRange(start: Date | null, end: Date | null) {
    if (!start || !end) return "No data available";
    const startFormatted = start.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const endFormatted = end.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    return `${startFormatted} - ${endFormatted}`;
  }

  const xTicks = generateXTicks(range, fullDateRange);

  const weights = chartData
    .map((d) => d.weight)
    .filter((w): w is number => w !== null);
  const maxWeight = Math.max(...weights);
  const minWeight = Math.min(...weights);

  const padding = 5;
  const yAxisDomain = [
    Math.floor(minWeight - padding),
    Math.ceil(maxWeight + padding),
  ];

  return (
    <div className="bg-slate-700  shadow-md">
      <div className="flex justify-center items-center mb-4 px-10 pt-4">
        <button onClick={() => setOffset((prev) => prev + 1)} className="mr-4">
          <ChevronLeft />
        </button>
        <h2>{formatDateRange(start, end)}</h2>
        <button
          onClick={() => setOffset((prev) => Math.max(prev - 1, 0))}
          disabled={offset === 0}
          className="ml-4"
        >
          <ChevronRight />
        </button>
      </div>
      <div className="flex justify-center items-center mb-4 px-10">
        <h3>
          {range}: {weightDifference} {weightUnit}
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 20, left: -20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            ticks={xTicks}
            tickFormatter={(value) => formatDatelabel(value, range)}
            tick={{ fill: "#f9fafb", fontSize: 14 }}
          />
          <YAxis
            tick={{ fill: "#f9fafb", fontSize: 14 }}
            domain={yAxisDomain}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "#8884d8",
              color: "#f9fafb",
            }}
          />
          <Legend />
          <Line
            type="linear"
            dataKey="weight"
            stroke="#f5d163"
            connectNulls={true}
            strokeWidth={3}
            activeDot={{ r: 10 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
