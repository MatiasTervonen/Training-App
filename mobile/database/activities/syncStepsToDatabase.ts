import { readRecords, initialize } from "react-native-health-connect";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
// On app open - backfill any missing days

async function backfillMissingDays() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  // Get last saved day from database
  const { data: lastSaved } = await supabase
    .from("steps_daily")
    .select("day")
    .eq("user_id", session.user.id)
    .order("day", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastSavedDate = lastSaved
    ? new Date(lastSaved.day)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Collect all days to save
  const daysToSave = [];
  let currentDate = new Date(lastSavedDate);
  currentDate.setDate(currentDate.getDate() + 1);

  while (currentDate < today) {
    const stepsData = await getStepsForDate(new Date(currentDate));
    if (stepsData) {
      daysToSave.push(stepsData);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }


  // Single batch insert (1 database call instead of 30!)
  if (daysToSave.length > 0) {
    await saveBatchDailySteps(daysToSave);
  }
}

async function getStepsForDate(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
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

    if (totalSteps === 0) {
      return null;
    }

    const dayString = date.toLocaleDateString("en-CA");
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return {
      day: dayString,
      timezone,
      steps: totalSteps,
    };
  } catch  {
    return null;
  }
}

type DailyStepsData = {
  day: string;
  timezone: string;
  steps: number;
};

// New function for batch insert
async function saveBatchDailySteps(daysData: DailyStepsData[]) {
  const { error } = await supabase
    .from("steps_daily")
    .upsert(daysData, { onConflict: "user_id,day" })
    .select();

  if (error) {
    throw new Error(error.message || "Failed to save daily steps batch");
  }

  return { success: true };
}

export async function backfillMissingDaysThrottled() {
  const lastCheck = await AsyncStorage.getItem("lastStepsBackfill");
  const today = new Date().toLocaleDateString("en-CA");

  // Already ran today, skip
  if (lastCheck === today) {
    return { skipped: true };
  }

  //  Initialize Health Connect first!
  const isInitialized = await initialize();

  if (!isInitialized) {
    console.log("Health Connect not available");
    return { error: "Health Connect not available" };
  }

  // Run backfill
  const result = await backfillMissingDays();

  // Save that we ran today
  await AsyncStorage.setItem("lastStepsBackfill", today);

  return result;
}
