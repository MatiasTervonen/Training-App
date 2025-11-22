"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

type PinSessionProps = {
  id: string;
  table: "notes" | "gym_sessions" | "weight" | "todo_lists" | "reminders";
};

export async function pinItem({ id, table }: PinSessionProps) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  if (!id || !table) {
    throw new Error("Invalid request");
  }

  const { data: pinnedItem, error } = await supabase
    .from("pinned_items")
    .upsert(
      [
        {
          user_id: user.sub,
          item_id: id,
          type: table,
        },
      ],
      { onConflict: "user_id,type,item_id" } // Ensure upsert on user_id, item_id, and type
    )
    .select()
    .single();

  if (error || !pinnedItem) {
    handleError(error, {
      message: "Error pinning item",
      route: "server-action: pinSession",
      method: "direct",
    });
    throw new Error("Error pinning session");
  }

  return { success: true, pinnedItem: pinnedItem };
}

export async function unpinItem({ id, table }: PinSessionProps) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("pinned_items")
    .delete()
    .eq("user_id", user.sub)
    .eq("type", table)
    .eq("item_id", id);

  if (error) {
    handleError(error, {
      message: "Error unpinning item",
      route: "server-action: unpinSession",
      method: "direct",
    });
    throw new Error("Error unpinning item");
  }

  return { success: true };
}
