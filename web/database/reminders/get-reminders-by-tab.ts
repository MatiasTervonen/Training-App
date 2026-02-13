import { handleError } from "@/utils/handleError";
import { createClient } from "@/utils/supabase/client";

export type ReminderTab = "normal" | "repeating" | "delivered";

export type ReminderByTab = {
  id: string;
  title: string;
  notes: string | null;
  type: string;
  notify_at: string | null;
  notify_date: string | null;
  notify_at_time: string | null;
  weekdays: number[] | null;
  delivered: boolean | null;
  seen_at: string | null;
  mode: string | null;
  created_at: string;
  updated_at: string | null;
};

export async function getRemindersByTab(
  tab: ReminderTab,
): Promise<ReminderByTab[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("reminders_get_by_tab", {
    p_tab: tab,
  });

  if (error) {
    console.error("Error getting reminders by tab:", error);
    handleError(error, {
      message: `Error getting ${tab} reminders`,
      route: "/database/reminders/get-reminders-by-tab",
      method: "GET",
    });
    throw new Error(`Error getting ${tab} reminders`);
  }

  return (data ?? []) as ReminderByTab[];
}
