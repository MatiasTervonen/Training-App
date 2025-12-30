import { handleError } from "@/app/(app)/utils/handleError";
import { createClient } from "@/utils/supabase/client";

export async function markOccurrenceCompleted(occurrenceId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("reminder_occurrences")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", occurrenceId)
    .is("completed_at", null);

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
