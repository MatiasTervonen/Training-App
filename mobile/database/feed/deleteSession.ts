import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function DeleteSession(item_id: string, table: string) {
  const { error } = await supabase.from(table).delete().eq("id", item_id);

  if (error) {
    handleError(error, {
      message: "Error deleting session",
      route: "/database/feed/deleteSession",
      method: "DELETE",
    });
    throw new Error("Error deleting session");
  }

  return { success: true };
}
