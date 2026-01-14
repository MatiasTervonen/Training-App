import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type TrackPoint = {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
};
type props = {
  title: string;
  notes: string;
  duration: number;
  start_time: string;
  end_time: string;
  track: TrackPoint[];
  activityId: string | null;
  steps: number;
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
}: props) {
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
    }
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
}
