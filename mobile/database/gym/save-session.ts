import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import * as Crypto from "expo-crypto";

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
  const { data: sessionData, error: sessionError } = await supabase
    .from("gym_sessions")
    .insert([
      {
        title,
        notes,
        duration,
      },
    ])
    .select()
    .single();

  if (sessionError || !sessionData) {
    handleError(sessionError, {
      message: "Error creating session",
      route: "/database/gym/save-session",
      method: "POST",
    });
    throw new Error("Error creating session");
  }

  const sessionId = sessionData.id;

  const sessionExercises = [];
  const sets = [];

  for (const [index, ex] of exercises.entries()) {
    const supersetId = ex.superset_id ?? null;

    const sessionExerciseId = Crypto.randomUUID();

    sessionExercises.push({
      id: sessionExerciseId,
      session_id: sessionId,
      exercise_id: ex.exercise_id,
      position: index,
      superset_id: supersetId ?? null,
      notes: ex.notes ?? null,
    });

    for (const [setIndex, set] of ex.sets.entries()) {
      sets.push({
        session_exercise_id: sessionExerciseId,
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe,
        set_number: setIndex,
        time_min: set.time_min,
        distance_meters: set.distance_meters,
      });
    }
  }

  const { error: seError } = await supabase
    .from("gym_session_exercises")
    .insert(sessionExercises);

  if (seError) {
    handleError(seError, {
      message: "Error inserting session exercises",
      route: "/database/gym/save-session",
      method: "POST",
    });
    throw new Error("Error inserting session exercises");
  }

  const { error: setsError } = await supabase.from("gym_sets").insert(sets);

  if (setsError) {
    handleError(setsError, {
      message: "Error inserting sets",
      route: "/database/gym/save-session",
      method: "POST",
    });
    throw new Error("Error inserting sets");
  }

  return { success: true };
}
