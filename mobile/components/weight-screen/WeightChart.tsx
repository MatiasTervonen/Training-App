import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState, useEffect } from "react";
import { weight } from "@/types/models";
import { View, Pressable } from "react-native";
import AppText from "@/components/AppText";
import { useUserStore } from "@/lib/stores/useUserStore";
import { CartesianChart, Line } from "victory-native";
import { useFont } from "@shopify/react-native-skia";

type WeightChartProps = {
  range: "week" | "month" | "year";
  data: weight[];
};

const russoFont = require("@/assets/fonts/RussoOne-Regular.ttf");

function addOffsetToDate(
  base: Date,
  range: string,
  offset: number
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
  }

  // Shift start and end based on offset
  const diff = end.getTime() - start.getTime() + 1;
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
  range: "week" | "month" | "year"
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
      }).format(date); // Return first letter of month
  }
}

function generateDateRange(start: Date, end: Date): string[] {
  const dateList: string[] = [];
  const currentDate = new Date(start);
  while (currentDate < end) {
    dateList.push(currentDate.toISOString().split("T")[0]); // Format as YYYY-MM-DD
    currentDate.setDate(currentDate.getDate() + 1); // Increment by one day
  }
  return dateList;
}

// function fillMissingDates(
//   fullDates: string[],
//   entries: weight[]
// ): { date: string; weight: number | null }[] {
//   const weightMap = new Map(
//     entries.map((entry) => [entry.created_at.split("T")[0], entry.weight])
//   );

//   return fullDates.map((date) => ({
//     date,
//     weight: weightMap.has(date) ? weightMap.get(date)! : null,
//   }));
// }

export default function WeightChart({ range, data }: WeightChartProps) {
  const [offset, setOffset] = useState(0);
  const latestDate = getLatestDate(data); // Hakee viiemeissimmän päivämäärän datasta

  const [start, end] = addOffsetToDate(latestDate, range, offset);

  const font = useFont(russoFont, 14);

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

  function fillMissingDatesWithCarry(
    fullDates: string[],
    entries: weight[]
  ): { date: string; weight: number | null }[] {
    const weightMap = new Map(
      entries.map((entry) => [entry.created_at.split("T")[0], entry.weight])
    );

    let lastKnownWeight: number | null = null;

    return fullDates.map((date) => {
      if (weightMap.has(date)) {
        lastKnownWeight = weightMap.get(date)!;
      }
      return {
        date,
        weight: lastKnownWeight, // carry last known forward
      };
    });
  }

  const chartData = fillMissingDatesWithCarry(fullDateRange, filteredData)
    .filter((item) => item.weight !== null)
    .map((item) => ({
      value: item.weight!,
      label: formatDatelabel(item.date, range),
    }));

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

  return (
    <View className="bg-slate-700 shadow-md w-full px-2">
      <View className="flex-row justify-center items-center my-4">
        <Pressable
          onPress={() => {
            setOffset((prev) => prev + 1);
          }}
          className="mr-4 bg-slate-800 p-1 rounded"
          hitSlop={10}
        >
          <ChevronLeft color="#f3f4f6" />
        </Pressable>
        <AppText className="min-w-[200px] text-center">
          {formatDateRange(start, end)}
        </AppText>
        <Pressable
          onPress={() => {
            setOffset((prev) => prev - 1);
          }}
          className="ml-4 bg-slate-800 p-1 rounded"
          hitSlop={10}
        >
          <ChevronRight color="#f3f4f6" />
        </Pressable>
      </View>
      <View>
        <AppText className="text-center mb-4 px-10">
          {range}: {weightDifference} {weightUnit}
        </AppText>
      </View>
      <View className="h-[300px]">
        <CartesianChart
          data={chartData}
          xKey="label"
          yKeys={["value"]}
          padding={{ left: 0, right: 0, top: 0, bottom: 0 }}
          domainPadding={{ left: 0, right: 0 }}
          axisOptions={{
            font,
            labelColor: "#f3f4f6",
          }}
        >
          {({ points }) => (
            <Line points={points.value} color="#3b82f6" strokeWidth={2} />
          )}
        </CartesianChart>
      </View>
    </View>
  );
}
