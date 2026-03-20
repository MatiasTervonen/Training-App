import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { MessageType } from "@/types/chat";

type SendMessageParams = {
  conversationId: string;
  content?: string | null;
  messageType?: MessageType;
  mediaStoragePath?: string | null;
  mediaThumbnailPath?: string | null;
  mediaDurationMs?: number | null;
  replyToMessageId?: string | null;
};

export async function sendMessage({
  conversationId,
  content = null,
  messageType = "text",
  mediaStoragePath = null,
  mediaThumbnailPath = null,
  mediaDurationMs = null,
  replyToMessageId = null,
}: SendMessageParams): Promise<string> {
  const { data, error } = await supabase.rpc("send_message", {
    p_conversation_id: conversationId,
    p_content: content ?? undefined,
    p_message_type: messageType,
    p_media_storage_path: mediaStoragePath ?? undefined,
    p_media_thumbnail_path: mediaThumbnailPath ?? undefined,
    p_media_duration_ms: mediaDurationMs ?? undefined,
    p_reply_to_message_id: replyToMessageId ?? undefined,
  });

  if (error) {
    handleError(error, {
      message: "Error sending message",
      route: "/database/chat/send-message",
      method: "POST",
    });
    throw new Error("Error sending message");
  }

  return data as string;
}
