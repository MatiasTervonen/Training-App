import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getHabits() {
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    handleError(error, {
      message: "Error getting habits",
      route: "/database/habits/get-habits",
      method: "GET",
    });
    throw new Error("Error getting habits");
  }

  return data ?? [];
}
