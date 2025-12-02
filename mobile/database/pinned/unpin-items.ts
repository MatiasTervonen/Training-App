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

export async function unpinItem({ id, table }: PinSessionProps) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("pinned_items")
    .delete()
    .eq("user_id", session.user.id)
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
