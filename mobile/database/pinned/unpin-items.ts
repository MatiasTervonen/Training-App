import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type PinSessionProps = {
  id: string;
  table:
    | "notes"
    | "gym_sessions"
    | "weight"
    | "todo_lists"
    | "global_reminders"
    | "local_reminders";
};

export async function unpinItem({ id, table }: PinSessionProps) {
  const { error } = await supabase
    .from("pinned_items")
    .delete()
    .eq("type", table)
    .eq("item_id", id);

  if (error) {
    handleError(error, {
      message: "Error unpinning item",
      route: "/database/pinned/unpin-items",
      method: "DELETE",
    });
    throw new Error("Error unpinning item");
  }

  return { success: true };
}
