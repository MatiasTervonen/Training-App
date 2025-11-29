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

// Get Exercises

export async function getExercises({
  pageParam = 0,
  limit = 50,
  search = "",
}: {
  pageParam?: number;
  limit?: number;
  search?: string;
}) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const from = pageParam * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("gym_exercises")
    .select(
      "id, user_id, name, equipment, muscle_group, main_group, created_at, language",
      { count: "exact" }
    )
    .order("name", { ascending: true })
    .range(from, to);

  if (search.trim() !== "") {
    query = query.or(
      `name.ilike.%${search}%,equipment.ilike.%${search}%,muscle_group.ilike.%${search}%,main_group.ilike.%${search}%`
    );
  }

  const { data: exercises, error } = await query;

  if (error) {
    handleError(error, {
      message: "Error fetching exercises",
      route: "server-action: getExercise",
      method: "direct",
    });
    throw new Error("Error fetching exercises");
  }

  const hasMore = exercises && exercises.length === limit;

  return { exercises, nextPage: hasMore ? pageParam + 1 : undefined };
}

import { gym_exercises } from "@/app/(app)/types/models";

export async function getRecentExercises() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: exercises, error } = await supabase
    .from("gym_session_exercises")
    .select(
      `exercise:exercise_id (id, user_id, name, equipment, muscle_group, main_group, created_at, language)`
    )
    .order("id", { ascending: false })
    .limit(10);

  if (error) {
    handleError(error, {
      message: "Error fetching recent exercises",
      route: "/api/gym/recent-exercises",
      method: "GET",
    });
    throw new Error("Error fetching recent exercises");
  }

  const uniqueExercises: gym_exercises[] = [];
  const seen = new Set<number>();

  for (const row of exercises) {
    const ex = Array.isArray(row.exercise) ? row.exercise[0] : row.exercise;
    if (ex && !seen.has(ex.id)) {
      seen.add(ex.id);
      uniqueExercises.push(ex);
    }
  }

  return uniqueExercises ?? [];
}

export async function getFullGymSession(id: string) {
  console.log("fetching full gym session");

  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: gymSession, error: gymSessionError } = await supabase
    .from("gym_sessions")
    .select(`*, gym_session_exercises(*, gym_exercises(*), gym_sets(*))`)
    .order("position", {
      referencedTable: "gym_session_exercises",
      ascending: true,
    })
    .eq("user_id", user.sub)
    .eq("id", id)
    .single();

  gymSession?.gym_session_exercises?.forEach((exercise) => {
    if (Array.isArray(exercise.gym_sets)) {
      exercise.gym_sets.sort((a, b) => a.set_number - b.set_number);
    }
  });

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

type SessionExercise = {
  id: string;
  session_id: string;
  exercise_id: string;
  gym_sessions: { created_at: string; user_id: string };
};

export async function getLastExerciseHistory(exerciseId: string) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: exercises, error: exerciseError } = await supabase
    .from("gym_session_exercises")
    .select(
      "id, session_id, exercise_id, gym_sessions:session_id(created_at, user_id)"
    )
    .eq("exercise_id", exerciseId)
    .eq("gym_sessions.user_id", user.sub);

  const sessions = exercises as SessionExercise[] | null;

  if (!sessions || sessions.length === 0) {
    return null;
  }

  if (exerciseError) {
    handleError(exerciseError, {
      message: "Error fetching exercise history",
      route: "server-action: getLastExerciseHistory",
      method: "direct",
    });
    throw new Error("Error fetching exercise history");
  }

  const sorted = sessions.sort(
    (a, b) =>
      new Date(b.gym_sessions?.created_at).getTime() -
      new Date(a.gym_sessions?.created_at).getTime()
  );

  const allSorted = await Promise.all(
    sorted.map(async (session) => {
      const { data: sets, error: setsError } = await supabase
        .from("gym_sets")
        .select("set_number,weight, reps, rpe")
        .eq("session_exercise_id", session.id)
        .order("set_number", { ascending: true });

      if (setsError) {
        handleError(setsError, {
          message: "Error fetching sets",
          route: "server-action: getLastExerciseHistory",
          method: "direct",
        });
        throw new Error("Error fetching sets");
      }

      return {
        date: session.gym_sessions?.created_at,
        sets,
      };
    })
  );

  const filteredResults = allSorted.filter(Boolean);

  return filteredResults;
}

export async function getUserExercises() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: exercises, error } = await supabase
    .from("gym_exercises")
    .select("*")
    .order("name", { ascending: true })
    .eq("user_id", user.sub);

  if (error) {
    handleError(error, {
      message: "Error fetching user exercises",
      route: "server-action: getUserExercises",
      method: "direct",
    });
    throw new Error("Error fetching user exercises");
  }

  return exercises;
}

import { Last30DaysAnalytics } from "../types/session";

export async function get30dAnalytics() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: analytics, error: gymSessionError } = await supabase.rpc(
    "last_30d_analytics",
    { uid: user.sub }
  );

  if (gymSessionError || !analytics) {
    handleError(gymSessionError, {
      message: "Error fetching gym sessions",
      route: "server-actions: get30dAnalytics",
      method: "direct",
    });
    throw new Error("Error fetching gym sessions");
  }

  const { data: heatMap, error: heatMapError } = await supabase
    .from("gym_sessions")
    .select("title, created_at")
    .gte(
      "created_at",
      new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()
    )
    .eq("user_id", user.sub)
    .order("created_at", { ascending: true });

  if (heatMapError || !heatMap) {
    handleError(heatMapError, {
      message: "Error fetching gym sessions",
      route: "server-actions: get30dAnalytics",
      method: "direct",
    });
    throw new Error("Error fetching gym sessions");
  }

  return {
    analytics: analytics as Last30DaysAnalytics["analytics"],
    heatMap: heatMap as Last30DaysAnalytics["heatMap"],
  };
}
