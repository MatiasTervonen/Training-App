import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import * as crypto from "expo-crypto";

type editSessionProps = {
  id: string;
  exercises: {
    exercise_id: string;
    superset_id: string | null;
    notes: string | null;
    sets: {
      weight: number | null;
      reps: number | null;
      rpe: string | null;
      time_min: number | null;
      distance_meters: number | null;
    }[];
  }[];
  notes: string | null;
  duration: number;
  title: string | null;
};

export async function editSession({
  exercises,
  notes,
  duration,
  title,
  id: sessionId,
}: editSessionProps) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("No session");
  }

  const { error: editError } = await supabase
    .from("gym_sessions")
    .update({
      title,
      notes,
      duration,
    })
    .eq("id", sessionId)
    .eq("user_id", session.user.id);

  if (editError) {
    handleError(editError, {
      message: "Error updating session",
      route: "/api/gym/edit-session",
      method: "POST",
    });
    throw new Error(editError.message);
  }

  const { data: existingExercises } = await supabase
    .from("gym_session_exercises")
    .select("id")
    .eq("session_id", sessionId);

  const exerciseIds = existingExercises?.map((ex) => ex.id);

  if (exerciseIds && exerciseIds.length > 0) {
    await supabase
      .from("gym_sets")
      .delete()
      .in("session_exercise_id", exerciseIds);
  }

  await supabase
    .from("gym_session_exercises")
    .delete()
    .eq("session_id", sessionId);

  const sessionExercises = [];
  const sets = [];

  for (const [index, ex] of exercises.entries()) {
    const sessionExerciseId = crypto.randomUUID();
    const supersetId = ex.superset_id ?? null;

    sessionExercises.push({
      id: sessionExerciseId,
      user_id: session.user.id,
      session_id: sessionId,
      exercise_id: ex.exercise_id,
      position: index,
      superset_id: supersetId ?? null,
      notes: ex.notes ?? null,
    });

    for (const [setIndex, set] of ex.sets.entries()) {
      sets.push({
        session_exercise_id: sessionExerciseId,
        user_id: session.user.id,
        weight: set.weight ?? null,
        reps: set.reps ?? null,
        rpe: set.rpe ?? null,
        set_number: setIndex,
        time_min: set.time_min ?? null,
        distance_meters: set.distance_meters ?? null,
      });
    }
  }

  const { error: seError } = await supabase
    .from("gym_session_exercises")
    .insert(sessionExercises);

  if (seError) {
    handleError(seError, {
      message: "Error inserting session exercises",
      route: "/api/gym/edit-session",
      method: "POST",
    });
    throw new Error(seError.message);
  }

  const { error: setsError } = await supabase.from("gym_sets").insert(sets);

  if (setsError) {
    handleError(setsError, {
      message: "Error inserting sets",
      route: "/api/gym/edit-session",
      method: "POST",
    });
    throw new Error(setsError.message);
  }

  return { success: true };
}
