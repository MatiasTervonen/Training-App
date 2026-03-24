import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { useUserStore } from "@/lib/stores/useUserStore";
import type { FullGymSession } from "@/database/gym/get-full-gym-session";

export async function getFriendGymSession(feedItemId: string) {
  const language = useUserStore.getState().settings?.language ?? "en";

  const { data, error } = await supabase.rpc("get_friend_gym_session", {
    p_feed_item_id: feedItemId,
    p_language: language,
  });

  if (error) {
    handleError(error, {
      message: "Error fetching friend gym session",
      route: "/database/social-feed/get-friend-gym-session",
      method: "GET",
    });
    throw new Error("Error fetching friend gym session");
  }

  const raw = data as Record<string, unknown>;

  // Generate signed URLs for media (RPC only returns storage_path)
  const rawImages = (raw.sessionImages ?? []) as { id: string; storage_path: string }[];
  const rawVideos = (raw.sessionVideos ?? []) as { id: string; storage_path: string; thumbnail_storage_path: string | null; duration_ms: number | null }[];
  const rawVoice = (raw.sessionVoiceRecordings ?? []) as { id: string; storage_path: string; duration_ms: number | null }[];

  const sessionImages = await Promise.all(
    rawImages.map(async (img) => {
      const { data: urlData, error: urlError } = await supabase.storage
        .from("notes-images")
        .createSignedUrl(img.storage_path, 3600);
      if (urlError) console.error("Signed URL error (image):", urlError.message, "path:", img.storage_path);
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
    gymMedia: {
      images: sessionImages.filter((img) => img.uri !== ""),
      videos: sessionVideos.filter((v) => v.uri !== ""),
      voiceRecordings: sessionVoiceRecordings.filter((v) => v.uri !== ""),
    },
  } as unknown as FullGymSession & { gymMedia: { images: typeof sessionImages; videos: typeof sessionVideos; voiceRecordings: typeof sessionVoiceRecordings } };
}
