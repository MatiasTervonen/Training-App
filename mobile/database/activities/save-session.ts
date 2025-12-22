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
};

export async function saveActivitySession({
  title,
  notes,
  duration,
  start_time,
  end_time,
  track,
  activityId,
}: props) {
  const { data, error } = await supabase
    .from("activity_session")
    .insert({
      title,
      notes,
      duration,
      start_time,
      end_time,
      activity_id: activityId,
    })
    .select("id")
    .single();

  if (error || !data) {
    handleError(error, {
      message: "Error saving activity session",
      route: "/database/activities/save-session",
      method: "POST",
    });
    throw new Error("Error saving activity session");
  }

  const pointsData = track.map(
    ({ latitude, longitude, timestamp, accuracy, altitude }) => ({
      session_id: data.id,
      recorded_at: new Date(timestamp).toISOString(),
      latitude,
      longitude,
      accuracy,
      altitude,
    })
  );

  const { error: pointsError } = await supabase
    .from("activity_gps_points")
    .insert(pointsData);

  if (pointsError) {
    handleError(pointsError, {
      message: "Error saving activity gps points",
      route: "/database/activities/save-session",
      method: "POST",
    });
    throw new Error("Error saving activity gps points");
  }

  return data;
}
