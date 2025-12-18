import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

type EditGlobalReminderParams = {
  id: string;
  title: string | null | undefined;
  notes: string | null | undefined;
  notify_at: string | null;
  seen_at?: string | null;
  updated_at: string;
  delivered?: boolean | null;
};

export default async function EditGlobalReminder({
  id,
  title,
  notes,
  notify_at,
  seen_at,
  updated_at,
  delivered,
}: EditGlobalReminderParams) {
  const { error } = await supabase
    .from("global_reminders")
    .update({ title, notes, notify_at, seen_at, updated_at, delivered })
    .eq("id", id);

  if (error) {
    handleError(error, {
      message: "Error updating global reminder",
      route: "/database/reminders/edit-global-reminder",
      method: "POST",
    });
    throw new Error("Error updating global reminder");
  }

  return { success: true };
}
