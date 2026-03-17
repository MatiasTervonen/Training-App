import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function editHabit({
  habitId,
  name,
  reminderTime,
  frequencyDays,
  targetValue,
  alarmType,
}: {
  habitId: string;
  name: string;
  reminderTime: string | null;
  frequencyDays: number[] | null;
  targetValue?: number | null;
  alarmType?: "normal" | "priority";
}) {
  const updateData: Record<string, unknown> = {
    name,
    reminder_time: reminderTime,
    frequency_days: frequencyDays,
    target_value: targetValue ?? null,
  };
  if (alarmType !== undefined) {
    updateData.alarm_type = alarmType;
  }

  const { error } = await supabase
    .from("habits")
    .update(updateData)
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
