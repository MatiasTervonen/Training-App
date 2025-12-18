"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

type GlobalReminderProps = {
  title: string;
  notes?: string;
  type: string;
  notify_at: string;
};

export async function saveGlobalReminderToDB({
  notes,
  title,
  notify_at,
  type,
}: GlobalReminderProps) {
  const supabase = await createClient();

  const { error: remindersError } = await supabase
    .from("global_reminders")
    .insert([
      {
        title,
        notes,
        notify_at,
        type,
      },
    ]);

  if (remindersError) {
    handleError(remindersError, {
      message: "Error saving global reminder",
      route: "server-action: saveGlobalReminder",
      method: "direct",
    });
    throw new Error("Error saving global reminder");
  }

  return { success: true };
}

type editGlobalReminderProps = {
  id: string;
  title: string;
  notes: string | null;
  notify_at: string;
  seen_at?: string | null;
  updated_at?: string;
};

export async function editGlobalReminder({
  notes,
  title,
  notify_at,
  id,
  seen_at,
  updated_at,
}: editGlobalReminderProps) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("global_reminders")
    .update({ title, notes: notes, notify_at, seen_at, updated_at })
    .eq("id", id);

  if (error) {
    handleError(error, {
      message: "Error editing global reminder",
      route: "server-action: editGlobalReminder",
      method: "direct",
    });
    throw new Error("Error editing global reminder");
  }

  return { success: true };
}

export async function deleteGlobalReminder(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("global_reminders")
    .delete()
    .eq("id", id);

  if (error) {
    handleError(error, {
      message: "Error deleting global reminder",
      route: "server-action: deleteGlobalReminder",
      method: "direct",
    });
    throw new Error("Error deleting global reminder");
  }

  return { success: true };
}

export async function getReminders() {
  const supabase = await createClient();

  const { data: globalReminders, error } = await supabase
    .from("global_reminders")
    .select("*");

  if (error) {
    handleError(error, {
      message: "Error getting global reminders",
      route: "server-action: getGlobalReminders",
      method: "direct",
    });
    throw new Error("Error getting global reminders");
  }

  const { data: localReminders, error: localRemindersError } = await supabase
    .from("local_reminders")
    .select("*");

  if (localRemindersError) {
    handleError(localRemindersError, {
      message: "Error getting local reminders",
      route: "server-action: getLocalReminders",
      method: "direct",
    });
    throw new Error("Error getting local reminders");
  }

  const combinedReminders = [...globalReminders, ...localReminders];

  return combinedReminders;
}

export async function getFullLocalReminder(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("local_reminders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    handleError(error, {
      message: "Error fetching full local reminder",
      route: "server-action: getFullLocalReminder",
      method: "direct",
    });
    throw new Error("Error fetching full local reminder");
  }

  return data;
}
