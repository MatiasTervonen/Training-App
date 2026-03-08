import { supabase } from "@/lib/supabase";

export async function refreshHabitFeed(date: string) {
  const { error } = await supabase.rpc("refresh_habit_feed", {
    p_date: date,
  });

  if (error) {
    console.error("Error refreshing habit feed:", error);
  }
}
