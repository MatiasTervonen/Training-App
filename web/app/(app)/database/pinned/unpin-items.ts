import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/app/(app)/utils/handleError";

type PinSessionProps = {
  id: string;
  type: string;
  pinned_context?: string;
};

export async function unpinItem({ id, type, pinned_context }: PinSessionProps) {
  const supabase = createClient();

  if (!id || !type) {
    throw new Error("Invalid request");
  }

  let query = supabase
    .from("pinned_items")
    .delete()
    .eq("type", type)
    .eq("feed_item_id", id);

  if (pinned_context) {
    query = query.eq("pinned_context", pinned_context);
  }

  const { error } = await query;

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
