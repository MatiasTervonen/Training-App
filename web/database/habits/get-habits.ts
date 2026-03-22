import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import { Habit } from "@/types/habit";

export async function getHabits() {
  const supabase = createClient();

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

  return (data ?? []) as Habit[];
}
