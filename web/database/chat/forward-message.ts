import { getOrCreateDm } from "@/database/chat/get-or-create-dm";
import { sendMessage } from "@/database/chat/send-message";
import { ChatMessage, MessageType } from "@/types/chat";

export async function forwardMessage(
  message: ChatMessage,
  friendId: string,
): Promise<string> {
  const conversationId = await getOrCreateDm(friendId);

  const messageId = await sendMessage({
    conversationId,
    content: message.content,
    messageType: message.message_type as MessageType,
    mediaStoragePath: message.media_storage_path,
    mediaThumbnailPath: message.media_thumbnail_path,
    mediaDurationMs: message.media_duration_ms,
  });

  return messageId;
}
