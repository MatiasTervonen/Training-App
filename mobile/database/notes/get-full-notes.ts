import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export type FullNotesSession = {
  id: string;
  title: string;
  notes: string;
  voiceRecordings: {
    id: string;
    storage_path: string;
    duration_ms: number | null;
    uri: string;
  }[];
};

export async function getFullNotesSession(
  noteId: string,
): Promise<FullNotesSession> {
  // Fetch voice recordings
  const { data: voiceData, error: voiceError } = await supabase
    .from("notes_voice")
    .select("id, storage_path, duration_ms")
    .eq("note_id", noteId);

  if (voiceError) {
    handleError(voiceError, {
      message: "Error fetching voice recordings",
      route: "/database/notes/get-full-notes",
      method: "GET",
    });
    throw new Error("Error fetching voice recordings");
  }

  // Get signed URLs for each recording
  const voiceRecordings = await Promise.all(
    (voiceData ?? []).map(async (voice) => {
      const { data: urlData } = await supabase.storage
        .from("notes-voice")
        .createSignedUrl(voice.storage_path, 3600); // 1 hour expiry

      return {
        id: voice.id,
        storage_path: voice.storage_path,
        duration_ms: voice.duration_ms,
        uri: urlData?.signedUrl ?? "",
      };
    }),
  );

  // Filter out any that failed to get URLs
  const validRecordings = voiceRecordings.filter((v) => v.uri !== "");

  return {
    id: noteId,
    title: "",
    notes: "",
    voiceRecordings: validRecordings,
  };
}
