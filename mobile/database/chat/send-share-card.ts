import { getOrCreateDm } from "@/database/chat/get-or-create-dm";
import { sendMessage } from "@/database/chat/send-message";
import { uploadFileToStorage, getAccessToken } from "@/lib/upload-with-progress";
import { supabase } from "@/lib/supabase";
import * as Crypto from "expo-crypto";

export async function sendShareCardToChat(
  imageUri: string,
  friendId: string,
): Promise<void> {
  const accessToken = await getAccessToken();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const conversationId = await getOrCreateDm(friendId);

  const storagePath = `${userId}/images/${Crypto.randomUUID()}.png`;
  await uploadFileToStorage(
    "chat-media",
    storagePath,
    imageUri,
    "image/png",
    accessToken,
  );

  await sendMessage({
    conversationId,
    messageType: "image",
    mediaStoragePath: storagePath,
  });
}
