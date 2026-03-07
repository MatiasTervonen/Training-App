import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function editHabit({
  habitId,
  name,
  reminderTime,
  frequencyDays,
  targetValue,
}: {
  habitId: string;
  name: string;
  reminderTime: string | null;
  frequencyDays: number[] | null;
  targetValue?: number | null;
}) {
  const { error } = await supabase
    .from("habits")
    .update({
      name,
      reminder_time: reminderTime,
      frequency_days: frequencyDays,
      target_value: targetValue ?? null,
    })
    .eq("id", habitId);

  if (error) {
    handleError(error, {
      message: "Error editing habit",
      route: "/database/habits/edit-habit",
      method: "PATCH",
    });
    throw new Error("Error editing habit");
  }
}
