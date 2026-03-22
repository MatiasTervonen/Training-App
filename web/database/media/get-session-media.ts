import { createClient } from "@/utils/supabase/client";
import { fetchAndSignMedia } from "@/database/media/get-signed-urls";
import type { SessionMedia } from "@/types/media";

/** Fetch media for gym or activity sessions (session_images, session_videos, sessions_voice) */
export async function getSessionMedia(
  sessionId: string,
): Promise<SessionMedia> {
  const supabase = createClient();

  const [imageRes, videoRes, voiceRes] = await Promise.all([
    supabase
      .from("session_images")
      .select("id, storage_path")
      .eq("session_id", sessionId),
    supabase
      .from("session_videos")
      .select("id, storage_path, thumbnail_storage_path, duration_ms")
      .eq("session_id", sessionId),
    supabase
      .from("sessions_voice")
      .select("id, storage_path, duration_ms")
      .eq("session_id", sessionId),
  ]);

  return fetchAndSignMedia(
    imageRes.data ?? [],
    videoRes.data ?? [],
    voiceRes.data ?? [],
  );
}
