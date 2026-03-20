import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type DeleteResult = {
  media_path: string | null;
  thumbnail_path: string | null;
};

export async function deleteMessage(messageId: string): Promise<DeleteResult> {
  const { data, error } = await supabase.rpc("delete_message", {
    p_message_id: messageId,
  });

  if (error) {
    handleError(error, {
      message: "Error deleting message",
      route: "/database/chat/delete-message",
      method: "POST",
    });
    throw new Error("Error deleting message");
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    media_path: row?.media_path ?? null,
    thumbnail_path: row?.thumbnail_path ?? null,
  };
}
