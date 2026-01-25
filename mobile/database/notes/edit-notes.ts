import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import * as Crypto from "expo-crypto";
import { File } from "expo-file-system/next";

type DraftRecording = {
  id: string;
  uri: string;
  createdAt: number;
  durationMs?: number;
};

type Props = {
  id: string;
  title: string;
  notes: string;
  updated_at: string;
  deletedRecordingIds?: string[];
  newRecordings?: DraftRecording[];
};

export async function editNotes({
  id,
  title,
  notes,
  updated_at,
  deletedRecordingIds = [],
  newRecordings = [],
}: Props) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const uploadedRecordings: {
    storage_path: string;
    duration_ms?: number;
  }[] = [];

  try {
    // Upload new recordings
    for (const recording of newRecordings) {
      const path = `${session.user.id}/${Crypto.randomUUID()}.m4a`;

      const file = new File(recording.uri);
      const bytes = await file.bytes();

      const { error: uploadError } = await supabase.storage
        .from("notes-voice")
        .upload(path, bytes, {
          contentType: "audio/m4a",
        });

      if (uploadError) {
        throw uploadError;
      }

      uploadedRecordings.push({
        storage_path: path,
        duration_ms: recording.durationMs,
      });
    }

    const { data, error } = await supabase.rpc("notes_edit_note", {
      p_id: id,
      p_title: title,
      p_notes: notes,
      p_updated_at: updated_at,
      p_deleted_recording_ids: deletedRecordingIds,
      p_new_recordings: uploadedRecordings,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    // cleanup orphaned uploads
    if (uploadedRecordings.length > 0) {
      await supabase.storage
        .from("notes-voice")
        .remove(uploadedRecordings.map((r) => r.storage_path));
    }

    handleError(error, {
      message: "Error editing notes",
      route: "/database/notes/edit-notes",
      method: "POST",
    });
    throw new Error("Error editing notes");
  }
}
