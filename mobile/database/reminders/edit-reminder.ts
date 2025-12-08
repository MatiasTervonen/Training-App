import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

type EditReminderParams = {
  id: string;
  title: string | null | undefined;
  notes: string | null | undefined;
  notify_at: string | null;
  delivered?: boolean;
  updated_at: string;
};

export default async function EditReminderData({
  id,
  title,
  notes,
  notify_at,
  delivered,
  updated_at,
}: EditReminderParams) {


  const { error } = await supabase
    .from("reminders")
    .update({ title, notes, notify_at, delivered, updated_at })
    .eq("id", id)


  if (error) {
    handleError(error, {
      message: "Error updating reminder",
      route: "/database/reminders/edit-reminders",
      method: "POST",
    });
    throw new Error("Error updating reminder");
  }

  return { success: true };
}
