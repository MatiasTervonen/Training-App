import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function saveHabit({
  name,
  reminderTime,
  frequencyDays,
  sortOrder,
  type = "manual",
  targetValue = null,
  alarmType = "normal",
}: {
  name: string;
  reminderTime: string | null;
  frequencyDays: number[] | null;
  sortOrder: number;
  type?: "manual" | "duration";
  targetValue?: number | null;
  alarmType?: "normal" | "priority";
}) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("habits")
    .insert({
      name,
      reminder_time: reminderTime,
      frequency_days: frequencyDays,
      sort_order: sortOrder,
      type,
      target_value: targetValue,
      alarm_type: alarmType,
    })
    .select()
    .single();

  if (error) {
    handleError(error, {
      message: "Error saving habit",
      route: "/database/habits/save-habit",
      method: "POST",
    });
    throw new Error("Error saving habit");
  }

  return data;
}
