import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { useTimerStore } from "@/lib/stores/timerStore";

type props = {
  title: string;
  notes: string;
  duration: number;
  exercises: {
    exercise_id?: string;
    notes?: string;
    superset_id?: string;
    sets: {
      weight?: number;
      reps?: number;
      rpe?: string;
      time_min?: number;
      distance_meters?: number;
    }[];
  }[];
};

export async function saveSession({
  exercises,
  notes,
  duration,
  title,
}: props) {
  const occured_at = new Date(
    useTimerStore.getState().activeSession?.started_at ?? Date.now()
  ).toISOString();

  const { error } = await supabase.rpc("gym_save_session", {
    p_exercises: exercises,
    p_notes: notes,
    p_duration: duration,
    p_title: title,
    p_occured_at: occured_at,
  });

  if (error) {
    console.log("error saving session", error);
    handleError(error, {
      message: "Error saving session",
      route: "/database/gym/save-session",
      method: "POST",
    });
    throw new Error("Error saving session");
  }

  return { success: true };
}
