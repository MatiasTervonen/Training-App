import { handleError } from "@/app/(app)/utils/handleError";
import { createClient } from "@/utils/supabase/client";

export async function saveOccurence(id: string, scheduledAt: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reminder_occurrences")
    .insert({
      reminder_id: id,
      scheduled_at: scheduledAt,
    })
    .select("id")
    .single();

  if (error) {
    handleError(error, {
      message: "Error saving reminder occurence",
      route: "/database/reminders/save-occurence",
      method: "POST",
    });
    throw new Error("Error saving reminder occurence");
  }

  return data;
}
