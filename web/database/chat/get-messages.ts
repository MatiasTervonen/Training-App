import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import { ChatMessage } from "@/types/chat";

const PAGE_SIZE = 50;

export async function getMessages(
  conversationId: string,
  limit: number = PAGE_SIZE,
  before?: string
): Promise<ChatMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_messages", {
    p_conversation_id: conversationId,
    p_limit: limit,
    ...(before ? { p_before: before } : {}),
  });
  if (error) {
    handleError(error, { message: "Error fetching messages", route: "database/chat/get-messages", method: "GET" });
    throw error;
  }
  return (data ?? []) as ChatMessage[];
}
