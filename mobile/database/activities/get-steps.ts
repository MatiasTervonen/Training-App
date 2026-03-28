import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { getTrackingDate } from "@/lib/formatDate";

export type StepRecord = {
  id: string;
  user_id: string;
  day: string;
  steps: number;
  timezone: string;
  created_at: string;
};

export async function getStepsData(days: number = 90): Promise<StepRecord[]> {
  const today = getTrackingDate();

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
