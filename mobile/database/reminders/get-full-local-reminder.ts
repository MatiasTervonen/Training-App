import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function GetFullLocalReminder(id: string) {
  const { data, error } = await supabase
    .from("local_reminders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    handleError(error, {
      message: "Error fetching full local reminder",
      route: "/database/reminders/get-full-local-reminder",
      method: "GET",
    });
    throw new Error("Error fetching full local reminder");
  }

  return data;
}
