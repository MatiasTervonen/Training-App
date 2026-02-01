import { useUserStore } from "@/lib/stores/useUserStore";
import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getUserExercises() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const language = useUserStore.getState().settings?.language ?? "en";

  const { data: exercises, error } = await supabase
    .from("gym_exercises")
    .select(
      `id, user_id, equipment, muscle_group, main_group, created_at,
       gym_exercises_translations!inner(name)`
    )
    .eq("user_id", session.user.id)
    .eq("gym_exercises_translations.language", language)
    .order("created_at", { ascending: false });

  if (error) {
    handleError(error, {
      message: "Error fetching user exercises",
      route: "/database/gym/edit-exercise",
      method: "GET",
    });
    throw new Error("Error fetching user exercises");
  }

  // Map the result to extract translated name
  const mappedExercises = exercises?.map((exercise: any) => ({
    id: exercise.id,
    user_id: exercise.user_id,
    name: exercise.gym_exercises_translations?.[0]?.name ?? "Unknown",
    equipment: exercise.equipment,
    muscle_group: exercise.muscle_group,
    main_group: exercise.main_group,
    created_at: exercise.created_at,
  }));

  return mappedExercises;
}
