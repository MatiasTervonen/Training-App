import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

type PinSessionProps = {
  id: string;
  type: string;
  pinned_context?: string;
};

export async function pinItem({ id, type, pinned_context }: PinSessionProps) {
  const supabase = createClient();

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
          pinned_context: pinned_context,
        },
      ],
      { onConflict: "user_id,type,feed_item_id,pinned_context" },
    )
    .select()
    .single();

  if (error) {
    handleError(error, {
      message: "Error pinning item",
      route: "/database/pinned/pin-items",
      method: "POST",
    });
    throw new Error("Error pinning session");
  }

  return { success: true, pinnedItem: pinnedItem };
}
