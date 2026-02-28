import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export type NoteImage = {
  id: string;
  storage_path: string;
  uri: string;
};

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
  images: NoteImage[];
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

  // Fetch images (table may not be in generated types yet — use rpc-style query)
  const { data: imageData, error: imageError } = await supabase
    .from("notes_images" as "notes_voice")
    .select("id, storage_path")
    .eq("note_id", noteId) as unknown as {
      data: { id: string; storage_path: string }[] | null;
      error: { message: string } | null;
    };

  if (imageError) {
    handleError(imageError, {
      message: "Error fetching note images",
      route: "/database/notes/get-full-notes",
      method: "GET",
    });
    throw new Error("Error fetching note images");
  }

  // Get signed URLs for voice recordings
  const voiceRecordings = await Promise.all(
    (voiceData ?? []).map(async (voice) => {
      const { data: urlData } = await supabase.storage
        .from("notes-voice")
        .createSignedUrl(voice.storage_path, 3600);

      return {
        id: voice.id,
        storage_path: voice.storage_path,
        duration_ms: voice.duration_ms,
        uri: urlData?.signedUrl ?? "",
      };
    }),
  );

  // Get signed URLs for images
  const images = await Promise.all(
    (imageData ?? []).map(async (image) => {
      const { data: urlData } = await supabase.storage
        .from("notes-images")
        .createSignedUrl(image.storage_path, 3600);

      return {
        id: image.id,
        storage_path: image.storage_path,
        uri: urlData?.signedUrl ?? "",
      };
    }),
  );

  const validRecordings = voiceRecordings.filter((v) => v.uri !== "");
  const validImages = images.filter((img) => img.uri !== "");

  return {
    id: noteId,
    title: "",
    notes: "",
    voiceRecordings: validRecordings,
    images: validImages,
  };
}
