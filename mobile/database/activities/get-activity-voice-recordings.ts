import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export type ActivityVoiceRecording = {
  id: string;
  storage_path: string;
  duration_ms: number | null;
  uri: string;
};

export async function getActivityVoiceRecordings(
  sessionId: string,
): Promise<ActivityVoiceRecording[]> {
  const { data: voiceData, error: voiceError } = await supabase
    .from("sessions_voice")
    .select("id, storage_path, duration_ms")
    .eq("session_id", sessionId);

  if (voiceError) {
    handleError(voiceError, {
      message: "Error fetching activity voice recordings",
      route: "/database/activities/get-activity-voice-recordings",
      method: "GET",
    });
    throw new Error("Error fetching activity voice recordings");
  }

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

  return voiceRecordings.filter((v) => v.uri !== "");
}
