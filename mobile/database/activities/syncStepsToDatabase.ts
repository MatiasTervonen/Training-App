import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDailyStepsHistory } from "@/native/android/NativeStepCounter";

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

  const lastSavedDay = lastSaved?.day ?? "1970-01-01";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Get last 30 days of step data from native SharedPreferences
  const stepsHistory = await getDailyStepsHistory(30);

  // Filter to only days after the last saved day with steps > 0
  const daysToSave = Object.entries(stepsHistory)
    .filter(([day, steps]) => day > lastSavedDay && steps > 0)
    .map(([day, steps]) => ({ day, steps, timezone }));

  if (daysToSave.length > 0) {
    await saveBatchDailySteps(daysToSave);
  }
}

type DailyStepsData = {
  day: string;
  timezone: string;
  steps: number;
};

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

  // Run backfill
  const result = await backfillMissingDays();

  // Save that we ran today
  await AsyncStorage.setItem("lastStepsBackfill", today);

  return result;
}
