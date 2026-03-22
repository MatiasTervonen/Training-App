import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function getOtherLastRead(conversationId: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_other_participant_last_read", {
    p_conversation_id: conversationId,
  });
  if (error) {
    handleError(error, { message: "Error fetching other last read", route: "database/chat/get-other-last-read", method: "GET" });
    throw error;
  }
  return data as string | null;
}
