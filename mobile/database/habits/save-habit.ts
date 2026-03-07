import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function saveHabit({
  name,
  reminderTime,
  frequencyDays,
  sortOrder,
  type = "manual",
  targetValue = null,
}: {
  name: string;
  reminderTime: string | null;
  frequencyDays: number[] | null;
  sortOrder: number;
  type?: "manual" | "steps";
  targetValue?: number | null;
}) {
  const { data, error } = await supabase
    .from("habits")
    .insert({
      name,
      reminder_time: reminderTime,
      frequency_days: frequencyDays,
      sort_order: sortOrder,
      type,
      target_value: targetValue,
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
