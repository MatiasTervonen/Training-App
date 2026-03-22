import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import { Conversation } from "@/types/chat";

export async function getConversations(): Promise<Conversation[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_conversations");
  if (error) {
    handleError(error, { message: "Error fetching conversations", route: "database/chat/get-conversations", method: "GET" });
    throw error;
  }
  return (data ?? []) as Conversation[];
}
