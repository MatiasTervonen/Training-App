import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("send_message", {
    p_conversation_id: conversationId,
    p_content: content,
  });

  if (error) {
    handleError(error, {
      message: "Error sending message",
      route: "/database/chat/send-message",
      method: "POST",
    });
    throw new Error("Error sending message");
  }

  return data as string;
}
