import { createClient } from "@/utils/supabase/client";
import { fetchAndSignMedia } from "@/database/media/get-signed-urls";
import type { SessionMedia } from "@/types/media";

/** Fetch media for weight entries (weight_images, weight_videos, weight_voice) */
export async function getWeightMedia(
  weightId: string,
): Promise<SessionMedia> {
  const supabase = createClient();

  const [imageRes, videoRes, voiceRes] = await Promise.all([
    supabase
      .from("weight_images")
      .select("id, storage_path")
      .eq("weight_id", weightId),
    supabase
      .from("weight_videos")
      .select("id, storage_path, thumbnail_storage_path, duration_ms")
      .eq("weight_id", weightId),
    supabase
      .from("weight_voice")
      .select("id, storage_path, duration_ms")
      .eq("weight_id", weightId),
  ]);

  return fetchAndSignMedia(
    imageRes.data ?? [],
    videoRes.data ?? [],
    voiceRes.data ?? [],
  );
}
