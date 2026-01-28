import { readRecords } from "react-native-health-connect";

export async function getStepsForDate(date: Date) {
  // Start of day at midnight
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  // End of day at 23:59:59.999
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await readRecords("Steps", {
    timeRangeFilter: {
      operator: "between",
      startTime: startOfDay.toISOString(),
      endTime: endOfDay.toISOString(),
    },
  });

  const totalSteps = result.records.reduce(
    (sum, record) => sum + record.count,
    0,
  );

  return totalSteps;
}
