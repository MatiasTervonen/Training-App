import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export async function markOccurrenceCompleted(occurrenceId: string) {
  const { error } = await supabase
    .from("reminder_occurrences")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", occurrenceId)
    .is("completed_at", null); // idempotent

  if (error) {
    handleError(error, {
      message: "Error marking occurrence completed",
      route: "/database/reminders/mark-occurrence-completed",
      method: "POST",
    });
    throw new Error("Error marking occurrence completed");
  }

  return { success: true };
}
