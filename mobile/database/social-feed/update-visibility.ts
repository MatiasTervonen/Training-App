import { supabase } from "@/lib/supabase";

export async function updateFeedItemVisibility(
  sourceId: string,
  type: string,
  visibility: "private" | "friends",
) {
  const { error } = await supabase
    .from("feed_items")
    .update({ visibility })
    .eq("source_id", sourceId)
    .eq("type", type);

  if (error) throw error;
}
