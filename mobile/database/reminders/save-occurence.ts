import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function SaveOccurence(id: string, scheduledAt: string) {
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
