import { createClient } from "@/utils/supabase/client";
import { fetchAndSignMedia } from "@/database/media/get-signed-urls";
import type { SessionMedia } from "@/types/media";

/** Fetch media for notes (notes_images, notes_videos, notes_voice) */
export async function getNotesMedia(
  noteId: string,
): Promise<SessionMedia> {
  const supabase = createClient();

  const [imageRes, videoRes, voiceRes] = await Promise.all([
    supabase
      .from("notes_images")
      .select("id, storage_path")
      .eq("note_id", noteId),
    supabase
      .from("notes_videos")
      .select("id, storage_path, thumbnail_storage_path, duration_ms")
      .eq("note_id", noteId),
    supabase
      .from("notes_voice")
      .select("id, storage_path, duration_ms")
      .eq("note_id", noteId),
  ]);

  return fetchAndSignMedia(
    imageRes.data ?? [],
    videoRes.data ?? [],
    voiceRes.data ?? [],
  );
}
