import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import { MessageType } from "@/types/chat";

type SendMessageParams = {
  conversationId: string;
  content?: string | null;
  messageType?: MessageType;
  mediaStoragePath?: string | null;
  mediaThumbnailPath?: string | null;
  mediaDurationMs?: number | null;
  replyToMessageId?: string;
};

export async function sendMessage({
  conversationId,
  content = null,
  messageType = "text",
  mediaStoragePath = null,
  mediaThumbnailPath = null,
  mediaDurationMs = null,
  replyToMessageId,
}: SendMessageParams): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("send_message", {
    p_conversation_id: conversationId,
    p_content: content ?? undefined,
    p_message_type: messageType,
    p_media_storage_path: mediaStoragePath ?? undefined,
    p_media_thumbnail_path: mediaThumbnailPath ?? undefined,
    p_media_duration_ms: mediaDurationMs ?? undefined,
    ...(replyToMessageId ? { p_reply_to_message_id: replyToMessageId } : {}),
  });
  if (error) {
    handleError(error, { message: "Error sending message", route: "database/chat/send-message", method: "POST" });
    throw error;
  }
  return data as string;
}
