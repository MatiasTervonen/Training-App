import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import { useUserStore } from "@/lib/stores/useUserStore";
import type { FullGymSession } from "@/database/gym/get-full-gym-session";
import type { FullActivitySession } from "@/types/models";

export async function getSharedGymSession(
  sessionId: string,
  conversationId: string,
): Promise<FullGymSession> {
  const supabase = createClient();
  const language = useUserStore.getState().preferences?.language ?? "en";

  const { data, error } = await supabase.rpc("get_friend_gym_session_by_chat", {
    p_session_id: sessionId,
    p_conversation_id: conversationId,
    p_language: language,
  });

  if (error) {
    handleError(error, {
      message: "Error fetching shared gym session",
      route: "database/chat/get-shared-session",
      method: "GET",
    });
    throw new Error("Error fetching shared gym session");
  }

  const raw = data as Record<string, unknown>;

  const rawImages = (raw.sessionImages ?? []) as { id: string; storage_path: string }[];
  const rawVideos = (raw.sessionVideos ?? []) as { id: string; storage_path: string; thumbnail_storage_path: string | null; duration_ms: number | null }[];
  const rawVoice = (raw.sessionVoiceRecordings ?? []) as { id: string; storage_path: string; duration_ms: number | null }[];

  const sessionImages = await Promise.all(
    rawImages.map(async (img) => {
      const { data: urlData } = await supabase.storage
        .from("notes-images")
        .createSignedUrl(img.storage_path, 3600);
      return { ...img, uri: urlData?.signedUrl ?? "" };
    }),
  );

  const sessionVideos = await Promise.all(
    rawVideos.map(async (vid) => {
      const { data: videoUrlData } = await supabase.storage
        .from("media-videos")
        .createSignedUrl(vid.storage_path, 3600);
      const thumbnailUri = vid.thumbnail_storage_path
        ? (await supabase.storage.from("media-videos").createSignedUrl(vid.thumbnail_storage_path, 3600)).data?.signedUrl ?? ""
        : "";
      return { ...vid, uri: videoUrlData?.signedUrl ?? "", thumbnailUri };
    }),
  );

  const sessionVoiceRecordings = await Promise.all(
    rawVoice.map(async (v) => {
      const { data: urlData } = await supabase.storage
        .from("notes-voice")
        .createSignedUrl(v.storage_path, 3600);
      return { ...v, uri: urlData?.signedUrl ?? "" };
    }),
  );

  return {
    ...raw,
    sessionImages: sessionImages.filter((img) => img.uri !== ""),
    sessionVideos: sessionVideos.filter((v) => v.uri !== ""),
    sessionVoiceRecordings: sessionVoiceRecordings.filter((v) => v.uri !== ""),
  } as unknown as FullGymSession;
}

export async function getSharedActivitySession(
  sessionId: string,
  conversationId: string,
): Promise<FullActivitySession> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_friend_activity_session_by_chat", {
    p_session_id: sessionId,
    p_conversation_id: conversationId,
  });

  if (error) {
    handleError(error, {
      message: "Error fetching shared activity session",
      route: "database/chat/get-shared-session",
      method: "GET",
    });
    throw new Error("Error fetching shared activity session");
  }

  return data as unknown as FullActivitySession;
}
