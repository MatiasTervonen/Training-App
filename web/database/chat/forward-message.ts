import { getOrCreateDm } from "@/database/chat/get-or-create-dm";
import { sendMessage } from "@/database/chat/send-message";

export async function forwardMessage(friendId: string, content: string): Promise<void> {
  const conversationId = await getOrCreateDm(friendId);
  await sendMessage(conversationId, content);
}
