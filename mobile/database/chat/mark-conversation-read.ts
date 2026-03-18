import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function markConversationRead(
  conversationId: string,
): Promise<void> {
  const { error } = await supabase.rpc("mark_conversation_read", {
    p_conversation_id: conversationId,
  });

  if (error) {
    handleError(error, {
      message: "Error marking conversation read",
      route: "/database/chat/mark-conversation-read",
      method: "POST",
    });
  }
}
