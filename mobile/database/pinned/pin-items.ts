import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type PinSessionProps = {
  id: string;
  table:
    | "notes"
    | "gym_sessions"
    | "weight"
    | "todo_lists"
    | "reminders"
    | "custom_reminders";
};

export async function pinItem({ id, table }: PinSessionProps) {
 if (!id || !table) {
    throw new Error("Invalid request");
  }

  const { data: pinnedItem, error } = await supabase
    .from("pinned_items")
    .upsert(
      [
        {
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
      route: "/database/pinned/pin-items",
      method: "POST",
    });
    throw new Error("Error pinning session");
  }

  return { success: true, pinnedItem: pinnedItem };
}
