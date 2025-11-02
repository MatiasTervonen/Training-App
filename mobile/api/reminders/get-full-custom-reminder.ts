import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function GetFullCustomReminder(id: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  try {
    const { data, error } = await supabase
      .from("custom_reminders")
      .select("*")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    handleError(error, {
      message: "Error fetching full custom reminder",
      route: "/api/reminders/get-full-custom-reminder",
      method: "GET",
    });
  }
}
