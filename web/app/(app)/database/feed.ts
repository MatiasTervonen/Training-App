"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

type DeleteSessionProps = {
  item_id: string;
  table: "notes" | "gym_sessions" | "weight" | "todo_lists" | "reminders";
};

export async function deleteSession({ item_id, table }: DeleteSessionProps) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error: tableError } = await supabase
    .from(table)
    .delete()
    .eq("id", item_id)
    .eq("user_id", user.sub);

  if (tableError) {
    handleError(tableError, {
      message: "Error deleting session",
      route: "server-action: deleteSession",
      method: "direct",
    });
    throw new Error("Error deleting session");
  }

  const { error: pinnedError } = await supabase
    .from("pinned_items")
    .delete()
    .eq("item_id", item_id)
    .eq("type", table)
    .eq("user_id", user.sub);

  if (pinnedError) {
    handleError(pinnedError, {
      message: "Error deleting pinned item",
      route: "server-action: deleteSession",
      method: "direct",
    });
    throw new Error("Error deleting pinned item");
  }

  return { success: true };
}
