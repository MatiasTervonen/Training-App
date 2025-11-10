"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";
import { ExerciseEntry } from "@/app/(app)/types/session";

type SaveGymProps = {
  title?: string;
  notes: string;
  duration: number;
  exercises: ExerciseEntry[];
};

export async function saveGymToDB({
  exercises,
  notes,
  duration,
  title,
}: SaveGymProps) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: gymData, error: gymError } = await supabase
    .from("gym_sessions")
    .insert([
      {
        user_id: user.sub,
        title,
        notes,
        duration,
      },
    ])
    .select()
    .single();

  if (gymError || !gymData) {
    handleError(gymError, {
      message: "Error saving gym",
      route: "server-action: saveGymToDB",
      method: "direct",
    });
    throw new Error(gymError?.message || "Failed to save notes");
  }

  const sessionId = gymData.id;

  const sessionExercises = [];
  const sets = [];

  for (const [index, ex] of exercises.entries()) {
    const supersetId = ex.superset_id ?? null;

    const sessionExerciseId = crypto.randomUUID();

    sessionExercises.push({
      id: sessionExerciseId,
      user_id: user.sub,
      session_id: sessionId,
      exercise_id: ex.exercise_id,
      position: index,
      superset_id: supersetId ?? "",
      notes: ex.notes ?? null,
    });

    for (const [setIndex, set] of ex.sets!.entries()) {
      sets.push({
        user_id: user.sub,
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
      message: "Error inserting gym exercises",
      route: "server-action: saveGymToDB",
      method: "direct",
    });
    throw new Error("Error inserting gym exercises");
  }

  const { error: setsError } = await supabase.from("gym_sets").insert(sets);

  if (setsError) {
    handleError(setsError, {
      message: "Error inserting gym sets",
      route: "server-action: saveGymToDB",
      method: "direct",
    });
    throw new Error("Error inserting gym sets");
  }

  return { success: true };
}

export async function getFullGymSession(id: string) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: gymSession, error: gymSessionError } = await supabase
    .from("gym_sessions")
    .select(`*, gym_session_exercises(*, gym_exercises(*), gym_sets(*))`)
    .eq("user_id", user.sub)
    .eq("id", id)
    .single();

  if (gymSessionError || !gymSession) {
    handleError(gymSessionError, {
      message: "Error fetching gym session",
      route: "server-action: getFullGymSession",
      method: "direct",
    });
    throw new Error("Error fetching gym session");
  }

  return gymSession;
}

type editGymSessionProps = {
  id: string;
  title: string;
  durationEdit: number;
  notes: string;
  exercises: ExerciseEntry[];
};

export async function editGymSession({
  exercises,
  notes,
  durationEdit,
  title,
  id: sessionId,
}: editGymSessionProps) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error: sessionError } = await supabase
    .from("gym_sessions")
    .update({
      title,
      notes,
      duration: durationEdit,
    })
    .eq("id", sessionId)
    .eq("user_id", user.sub);

  if (sessionError) {
    handleError(sessionError, {
      message: "Error editing session",
      route: "server-action: esitGymSession",
      method: "direct",
    });
    throw new Error("Error editing session");
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
    const supersetId = ex.superset_id ?? "";

    sessionExercises.push({
      id: sessionExerciseId,
      user_id: user.sub,
      session_id: sessionId,
      exercise_id: ex.exercise_id,
      position: index,
      superset_id: supersetId,
      notes: ex.notes ?? null,
    });

    for (const [setIndex, set] of ex.sets!.entries()) {
      sets.push({
        session_exercise_id: sessionExerciseId,
        user_id: user.sub,
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
      message: "Error inserting gym exercises",
      route: "server-action: editGymSession",
      method: "direct",
    });
    throw new Error("Error inserting gym exercises");
  }

  const { error: setsError } = await supabase.from("gym_sets").insert(sets);

  if (setsError) {
    handleError(setsError, {
      message: "Error inserting gym sets",
      route: "server-action: editGymSession",
      method: "direct",
    });
    throw new Error("Error inserting gym sets");
  }

  return { success: true };
}

type SaveExerciserops = {
  id: string;
  name: string;
  language: string;
  equipment: string;
  muscle_group: string;
  main_group: string;
};

export async function saveExerciseToDB({
  id,
  name,
  language,
  equipment,
  muscle_group,
  main_group,
}: SaveExerciserops) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error: exerciseError } = await supabase.from("gym_exercises").insert([
    {
      id,
      name,
      language,
      equipment,
      muscle_group,
      main_group,
      user_id: user.sub,
    },
  ]);

  if (exerciseError) {
    handleError(exerciseError, {
      message: "Error adding new exercise",
      route: "server-action: saveExerciseToDB",
      method: "direct",
    });
    throw new Error("Error adding new exercise");
  }

  return { success: true };
}

type EditExerciserops = {
  id: string;
  name: string;
  language: string;
  equipment: string;
  muscle_group: string;
  main_group: string;
};

export async function editExercise({
  id,
  name,
  language,
  equipment,
  muscle_group,
  main_group,
}: EditExerciserops) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error: exerciseError } = await supabase
    .from("gym_exercises")
    .update({
      id,
      name,
      language,
      equipment,
      muscle_group,
      main_group,
    })
    .eq("id", id);

  if (exerciseError) {
    console.log("error", exerciseError);
    handleError(exerciseError, {
      message: "Error editing exercise",
      route: "server-action: editExercise",
      method: "direct",
    });
    throw new Error("Error editing exercise");
  }

  return { success: true };
}

export async function deleteExercise(item_id: string) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error: exerciseError } = await supabase
    .from("gym_exercises")
    .delete()
    .eq("id", item_id);

  if (exerciseError) {
    handleError(exerciseError, {
      message: "Error deleting exercise",
      route: "server-action: deleteExercise",
      method: "direct",
    });
    throw new Error("Error deleting exercise");
  }

  return { success: true };
}
