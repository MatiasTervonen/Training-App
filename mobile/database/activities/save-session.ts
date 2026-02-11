import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { DraftRecording } from "@/types/session";
import * as Crypto from "expo-crypto";
import { File } from "expo-file-system/next";

type props = {
  title: string;
  notes: string;
  duration: number;
  start_time: string;
  end_time: string;
  track: {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    accuracy?: number | null;
    speed?: number | null;
    heading?: number | null;
    timestamp: number;
    is_stationary: number;
  }[];
  activityId: string;
  steps: number;
  draftRecordings: DraftRecording[];
};

export async function saveActivitySession({
  title,
  notes,
  duration,
  start_time,
  end_time,
  track,
  activityId,
  steps,
  draftRecordings,
}: props) {
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
    for (const recording of draftRecordings) {
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

    const normalizedTrack = track.map((point) => ({
      ...point,
      timestamp: new Date(point.timestamp).toISOString(),
    }));

    const { data: sessionId, error } = await supabase.rpc(
      "activities_save_activity",
      {
        p_title: title,
        p_notes: notes,
        p_duration: duration,
        p_start_time: start_time,
        p_end_time: end_time,
        p_track: normalizedTrack,
        p_activity_id: activityId,
        p_steps: steps,
        p_draftrecordings: uploadedRecordings,
      },
    );

    if (error || !sessionId) {
      console.error("error saving activity session", error);
      handleError(error, {
        message: "Error saving activity session",
        route: "/database/activities/save-session",
        method: "POST",
      });
      throw new Error("Error saving activity session");
    }

    return { success: true };
  } catch (error) {
    // cleanup orphaned uploads
    if (uploadedRecordings.length > 0) {
      await supabase.storage
        .from("notes-voice")
        .remove(uploadedRecordings.map((r) => r.storage_path));
    }
    console.error("Error saving activity session", error);
    handleError(error, {
      message: "Error saving activity session",
      route: "/database/activities/save-session",
      method: "POST",
    });
    throw new Error("Error saving activity session");
  }
}
