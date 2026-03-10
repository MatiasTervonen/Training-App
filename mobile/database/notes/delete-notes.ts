import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function deleteNotes(notesId: string) {
  // Clean up storage files before deleting DB records
  try {
    const [voice, images, videos] = await Promise.all([
      supabase.from("notes_voice").select("storage_path").eq("note_id", notesId),
      supabase.from("notes_images").select("storage_path").eq("note_id", notesId),
      supabase.from("notes_videos").select("storage_path, thumbnail_storage_path").eq("note_id", notesId),
    ]);

    const cleanupPromises: Promise<unknown>[] = [];

    const voicePaths = (voice.data ?? []).map((r) => r.storage_path);
    if (voicePaths.length > 0) {
      cleanupPromises.push(supabase.storage.from("notes-voice").remove(voicePaths));
    }

    const imagePaths = (images.data ?? []).map((r) => r.storage_path);
    if (imagePaths.length > 0) {
      cleanupPromises.push(supabase.storage.from("notes-images").remove(imagePaths));
    }

    const videoPaths = (videos.data ?? []).flatMap((v) => [v.storage_path, v.thumbnail_storage_path].filter(Boolean)) as string[];
    if (videoPaths.length > 0) {
      cleanupPromises.push(supabase.storage.from("media-videos").remove(videoPaths));
    }

    await Promise.all(cleanupPromises);
  } catch {
    // Storage cleanup is best-effort; continue with DB deletion
  }

  const { error } = await supabase.from("notes").delete().eq("id", notesId);

  if (error) {
    handleError(error, {
      message: "Error deleting notes",
      route: "/database/notes/delete-notes",
      method: "DELETE",
    });

    throw new Error("Error deleting notes");
  }

  return { success: true };
}
