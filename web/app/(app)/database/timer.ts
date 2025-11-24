"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

type SaveTimerProps = {
  title: string;
  notes?: string;
  durationInSeconds: number;
};

export async function saveTimerToDB({
  title,
  notes,
  durationInSeconds,
}: SaveTimerProps) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error: notesError } = await supabase.from("timers").insert({
    user_id: user.sub,
    title,
    notes,
    time_seconds: durationInSeconds,
    created_at: new Date().toISOString(),
  });

  if (notesError) {
    handleError(notesError, {
      message: "Error saving timer",
      route: "server-action: saveTimerToDB",
      method: "direct",
    });
    throw new Error("Failed to save timer");
  }

  return { success: true };
}

export async function deleteTimer(id: string) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error: notesError } = await supabase
    .from("timers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.sub);

  if (notesError) {
    handleError(notesError, {
      message: "Error deleting timer",
      route: "server-action: deleteTimer",
      method: "direct",
    });
    throw new Error("Failed to delete timer");
  }

  return { success: true };
}

export async function getTimers() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: timers, error: timerError } = await supabase
    .from("timers")
    .select("id, title, time_seconds, notes, created_at, user_id")
    .eq("user_id", user.sub)
    .order("created_at", { ascending: false });

  if (timerError || !timers) {
    handleError(timerError, {
      message: "Error fetching timers",
      route: "server-action: getTimers",
      method: "direct",
    });
    throw new Error("Unauthorized");
  }

  return timers;
}
