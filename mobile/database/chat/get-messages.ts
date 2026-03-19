import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { ChatMessage } from "@/types/chat";

const PAGE_SIZE = 50;

export async function getMessages(
  conversationId: string,
  limit: number = PAGE_SIZE,
  before?: string,
): Promise<ChatMessage[]> {
  const { data, error } = await supabase.rpc("get_messages", {
    p_conversation_id: conversationId,
    p_limit: limit,
    p_before: before ?? undefined,
  });

  if (error) {
    handleError(error, {
      message: "Error fetching messages",
      route: "/database/chat/get-messages",
      method: "GET",
    });
    throw new Error("Error fetching messages");
  }

  return (data ?? []) as unknown as ChatMessage[];
}

export { PAGE_SIZE };
