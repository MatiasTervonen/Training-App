import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function sendMessage(
  conversationId: string,
  content: string,
  replyToMessageId?: string
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("send_message", {
    p_conversation_id: conversationId,
    p_content: content,
    p_message_type: "text",
    ...(replyToMessageId ? { p_reply_to_message_id: replyToMessageId } : {}),
  });
  if (error) {
    handleError(error, { message: "Error sending message", route: "database/chat/send-message", method: "POST" });
    throw error;
  }
  return data as string;
}
