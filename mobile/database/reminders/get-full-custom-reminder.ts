import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function GetFullCustomReminder(id: string) {


  const { data, error } = await supabase
    .from("custom_reminders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    handleError(error, {
      message: "Error fetching full custom reminder",
      route: "/database/reminders/get-full-custom-reminder",
      method: "GET",
    });
    throw new Error("Error fetching full custom reminder");
  }

  return data;
}
