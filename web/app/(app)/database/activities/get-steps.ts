import { handleError } from "@/app/(app)/utils/handleError";
import { createClient } from "@/utils/supabase/client";

export type StepRecord = {
  id: string;
  user_id: string;
  day: string;
  steps: number;
  timezone: string;
  created_at: string;
};

export async function getStepsData(days: number = 90): Promise<StepRecord[]> {
  const supabase = createClient();

  const today = new Date().toLocaleDateString("en-CA");

  const { data, error } = await supabase
    .from("steps_daily")
    .select("*")
    .lt("day", today)
    .order("day", { ascending: false })
    .limit(days);

  if (error) {
    handleError(error, {
      message: "Error fetching steps data",
      route: "/database/activities/get-steps",
      method: "getStepsData",
    });
    throw new Error("Failed to fetch steps data. Please try again.");
  }

  return data ?? [];
}
