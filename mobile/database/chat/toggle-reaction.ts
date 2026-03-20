import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function toggleReaction(
  messageId: string,
  emoji: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("toggle_reaction", {
    p_message_id: messageId,
    p_emoji: emoji,
  });

  if (error) {
    console.error("toggle_reaction RPC error:", error.message, error.code, error.details);
    handleError(error, {
      message: "Error toggling reaction",
      route: "/database/chat/toggle-reaction",
      method: "POST",
    });
    throw new Error("Error toggling reaction");
  }

  return data as boolean;
}
