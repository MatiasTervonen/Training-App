import { readRecords } from "react-native-health-connect";

export async function getTodaysSteps() {
  const now = new Date();

  // Start of today at midnight (00:00:00)
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const result = await readRecords("Steps", {
    timeRangeFilter: {
      operator: "between",
      startTime: startOfDay.toISOString(),
      endTime: now.toISOString(),
    },
  });

  // Sum all step records for the day
  const totalSteps = result.records.reduce((sum, record) => sum + record.count, 0);

  return totalSteps;
}
