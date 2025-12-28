import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type PinSessionProps = {
  id: string;
  type: string;
};

export async function unpinItem({ id, type }: PinSessionProps) {
  if (!id || !type) {
    throw new Error("Invalid request");
  }

  const { error } = await supabase
    .from("pinned_items")
    .delete()
    .eq("type", type)
    .eq("feed_item_id", id);

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
