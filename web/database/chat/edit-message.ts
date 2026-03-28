import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function editMessage(messageId: string, content: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("edit_message", {
    p_message_id: messageId,
    p_content: content,
  });
  if (error) {
    handleError(error, { message: "Error editing message", route: "database/chat/edit-message", method: "POST" });
    throw error;
  }
}
