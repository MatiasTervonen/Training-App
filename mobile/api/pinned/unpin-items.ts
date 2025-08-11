import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

export async function unpinItems(
  session: Session,
  item_id: string,
  table: string
) {
  const { error } = await supabase
    .from("pinned_items")
    .delete()
    .eq("user_id", session.user.id)
    .eq("item_id", item_id)
    .eq("table", table);

  if (error) {
    console.error("Supabase Delete Error:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }

  return {
    success: true,
  };
}
