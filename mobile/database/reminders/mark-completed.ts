import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function MarkCompleted(id: string) {
  const { data, error } = await supabase
    .from("local_reminders")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", id)
    .is("completed_at", null)
    .select("id")
    .single();

  if (error) {
    handleError(error, {
      message: "Error marking reminder as completed",
      route: "/database/reminders/mark-completed",
      method: "POST",
    });
    throw new Error("Error marking reminder as completed");
  }

  return data;
}
