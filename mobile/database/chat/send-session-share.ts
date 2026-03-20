import { getOrCreateDm } from "@/database/chat/get-or-create-dm";
import { sendMessage } from "@/database/chat/send-message";
import { SessionShareContent } from "@/types/chat";

export async function sendSessionShareToChat(
  friendId: string,
  sessionData: SessionShareContent,
): Promise<void> {
  const conversationId = await getOrCreateDm(friendId);

  await sendMessage({
    conversationId,
    content: JSON.stringify(sessionData),
    messageType: "session_share",
  });
}
