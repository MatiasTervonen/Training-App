import { createClient } from "@/utils/supabase/client";

export async function refreshHabitFeed(date: string) {
  const supabase = createClient();

  const { error } = await supabase.rpc("refresh_habit_feed", {
    p_date: date,
    p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  if (error) {
    console.error("Error refreshing habit feed:", error);
  }
}
