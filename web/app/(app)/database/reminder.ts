"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

type ReminderProps = {
  title: string;
  notes?: string;
  type: string;
  notify_at: string;
};

export async function saveReminderToDB({
  notes,
  title,
  notify_at,
  type,
}: ReminderProps) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error: remindersError } = await supabase.from("reminders").insert([
    {
      user_id: user.sub,
      title,
      notes,
      notify_at,
      type,
    },
  ]);

  if (remindersError) {
    handleError(remindersError, {
      message: "Error saving reminder",
      route: "server-action: saveReminder",
      method: "direct",
    });
    throw new Error("Error saving reminder");
  }

  return { success: true };
}

type editReminderProps = {
  id: string;
  title: string;
  notes: string | null;
  notify_at: string;
  delivered: boolean;
};

export async function editReminder({
  notes,
  title,
  notify_at,
  id,
  delivered,
}: editReminderProps) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("reminders")
    .update({ title, notes: notes, notify_at, delivered })
    .eq("id", id)
    .eq("user_id", user.sub);

  if (error) {
    handleError(error, {
      message: "Error editing reminder",
      route: "server-action: editReminder",
      method: "direct",
    });
    throw new Error("Error editing reminder");
  }

  return { success: true };
}

export async function deleteReminder(id: string) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("reminders")
    .delete()
    .eq("id", id)
    .eq("user_id", user.sub);

  if (error) {
    handleError(error, {
      message: "Error deleting reminder",
      route: "server-action: deleteReminder",
      method: "direct",
    });
    throw new Error("Error deleting reminder");
  }

  return { success: true };
}

export async function getRTeminders() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: reminders, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", user.sub);

  if (error) {
    handleError(error, {
      message: "Error getting reminders",
      route: "server-action: getReminders",
      method: "direct",
    });
    throw new Error("Error getting reminders");
  }

  return reminders;
}
