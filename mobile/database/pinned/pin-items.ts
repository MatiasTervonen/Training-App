import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type PinSessionProps = {
  id: string;
  type: string;
};

export async function pinItem({ id, type }: PinSessionProps) {
  if (!id || !type) {
    throw new Error("Invalid request");
  }

  const { data: pinnedItem, error } = await supabase
    .from("pinned_items")
    .upsert(
      [
        {
          feed_item_id: id,
          type: type,
        },
      ],
      { onConflict: "user_id,type,feed_item_id" } // Ensure upsert on user_id, item_id, and type
    )
    .select()
    .single();

  if (error) {
    console.log("error pinning item", error);
    handleError(error, {
      message: "Error pinning item",
      route: "/database/pinned/pin-items",
      method: "POST",
    });
    throw new Error("Error pinning session");
  }

  return { success: true, pinnedItem: pinnedItem };
}
