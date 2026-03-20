import { supabase } from "@/lib/supabase";

export async function getOtherLastRead(
  conversationId: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_other_participant_last_read", {
    p_conversation_id: conversationId,
  });

  if (error) {
    console.error("Error fetching other last read:", error.message);
    return null;
  }

  return data as string | null;
}
