import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function deleteMessage(messageId: string): Promise<{ media_path: string | null; thumbnail_path: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("delete_message", {
    p_message_id: messageId,
  });
  if (error) {
    handleError(error, { message: "Error deleting message", route: "database/chat/delete-message", method: "POST" });
    throw error;
  }
  return data as unknown as { media_path: string | null; thumbnail_path: string | null };
}
