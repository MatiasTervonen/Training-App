import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { Conversation } from "@/types/chat";

export async function getConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase.rpc("get_conversations");

  if (error) {
    handleError(error, {
      message: "Error fetching conversations",
      route: "/database/chat/get-conversations",
      method: "GET",
    });
    throw new Error("Error fetching conversations");
  }

  return (data ?? []) as Conversation[];
}
