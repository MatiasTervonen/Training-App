import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

export async function pinItems(
  session: Session,
  item_id: string,
  table: string
) {
  console.log("Pinning item:", item_id, "in table:", table);

  const { data, error } = await supabase
    .from("pinned_items")
    .upsert([{ user_id: session.user.id, item_id, table }])
    .select()
    .single();

  if (error || !data) {
    console.error("Supabase Insert Error:", error);
    return {
      success: false,
      error: error?.message || "Unknown error",
    };
  }

  return {
    success: true,
    pinnedItem: data,
  };
}
