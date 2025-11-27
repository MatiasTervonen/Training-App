import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import * as crypto from "expo-crypto";
import { ExerciseEntry } from "@/types/session";

type editGymSessionProps = {
  id: string;
  title: string;
  durationEdit: number;
  notes: string;
  exercises: ExerciseEntry[];
};

export async function editSession({
  exercises,
  notes,
  durationEdit,
  title,
  id,
}: editGymSessionProps) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error: editError } = await supabase
    .from("gym_sessions")
    .update({
      title,
      notes,
      duration: durationEdit,
    })
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (editError) {
    handleError(editError, {
      message: "Error updating session",
      route: "/database/gym/edit-session",
      method: "POST",
    });
    throw new Error("Error updating session");
  }

  const { data: existingExercises } = await supabase
    .from("gym_session_exercises")
    .select("id")
    .eq("session_id", id);

  const exerciseIds = existingExercises?.map((ex) => ex.id);

  if (exerciseIds && exerciseIds.length > 0) {
    await supabase
      .from("gym_sets")
      .delete()
      .in("session_exercise_id", exerciseIds);
  }

  await supabase.from("gym_session_exercises").delete().eq("session_id", id);

  const sessionExercises = [];
  const sets = [];

  for (const [index, ex] of exercises.entries()) {
    const sessionExerciseId = crypto.randomUUID();
    const supersetId = ex.superset_id ?? null;

    sessionExercises.push({
      id: sessionExerciseId,
      user_id: session.user.id,
      session_id: id,
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
      route: "/database/gym/edit-session",
      method: "POST",
    });
    throw new Error("Error inserting session exercises");
  }

  const { error: setsError } = await supabase.from("gym_sets").insert(sets);

  if (setsError) {
    handleError(setsError, {
      message: "Error inserting sets",
      route: "/database/gym/edit-session",
      method: "POST",
    });
    throw new Error("Error inserting sets");
  }

  return { success: true };
}
