import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function toggleReaction(messageId: string, emoji: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("toggle_reaction", {
    p_message_id: messageId,
    p_emoji: emoji,
  });
  if (error) {
    handleError(error, { message: "Error toggling reaction", route: "database/chat/toggle-reaction", method: "POST" });
    throw error;
  }
  return data as boolean;
}
