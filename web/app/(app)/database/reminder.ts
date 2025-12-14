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

  const { error: remindersError } = await supabase.from("reminders").insert([
    {
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
  updated_at: string;
};

export async function editReminder({
  notes,
  title,
  notify_at,
  id,
  delivered,
  updated_at,
}: editReminderProps) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("reminders")
    .update({ title, notes: notes, notify_at, delivered, updated_at })
    .eq("id", id);

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

  const { error } = await supabase.from("reminders").delete().eq("id", id);

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

  const { data: reminders, error } = await supabase
    .from("reminders")
    .select("*");

  if (error) {
    handleError(error, {
      message: "Error getting reminders",
      route: "server-action: getReminders",
      method: "direct",
    });
    throw new Error("Error getting reminders");
  }

  const { data: customReminders, error: customRemindersError } = await supabase
    .from("custom_reminders")
    .select("*");

  if (customRemindersError) {
    handleError(customRemindersError, {
      message: "Error getting custom reminders",
      route: "/database/reminders/get-reminders",
      method: "GET",
    });
    throw new Error("Error getting custom reminders");
  }

  const combinedReminders = [...reminders, ...customReminders];

  return combinedReminders;
}

export async function getFullCustomReminder(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("custom_reminders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    handleError(error, {
      message: "Error fetching full custom reminder",
      route: "server-action: getFullCustomReminder",
      method: "direct",
    });
    throw new Error("Error fetching full custom reminder");
  }

  return data;
}
