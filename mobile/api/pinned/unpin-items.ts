import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function unpinItems(item_id: string, table: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    return { error: true, message: "No session" };
  }

  const { error } = await supabase
    .from("pinned_items")
    .delete()
    .eq("user_id", session.user.id)
    .eq("item_id", item_id)
    .eq("table", table);

  if (error) {
    handleError(error, {
      message: "Error unpinning item",
      route: "/api/pinned/unpin-items",
      method: "DELETE",
    });
    return { error: true, message: "Error unpinning item" };
  }

  return {
    success: true,
  };
}
