import { useUserStore } from "@/lib/stores/useUserStore";
import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getFullTemplate(sessionId: string) {
  if (!sessionId) {
    throw new Error("Missing session ID");
  }

  const language = useUserStore.getState().settings?.language ?? "en";

  const { data: template, error: templateError } = await supabase
    .from("gym_templates")
    .select(
      `id, name, user_id, updated_at, created_at,
       gym_template_exercises(
         id,
         exercise_id,
         superset_id,
         position,
         gym_exercises:exercise_id(
           equipment,
           muscle_group,
           main_group,
           gym_exercises_translations!inner(name)
         )
       )`,
    )
    .eq("id", sessionId)
    .eq(
      "gym_template_exercises.gym_exercises.gym_exercises_translations.language",
      language,
    )
    .single();

  if (templateError || !template) {
    handleError(templateError, {
      message: "Error fetching template",
      route: "/database/gym/get-full-template",
      method: "GET",
    });
    throw new Error("Error fetching template");
  }

  // Map the result to extract translated name from gym_exercises_translations
  const mappedTemplate = {
    ...template,
    gym_template_exercises: template.gym_template_exercises?.map(
      (exercise) => ({
        ...exercise,
        gym_exercises: {
          ...exercise.gym_exercises,
          name:
            exercise.gym_exercises?.gym_exercises_translations?.[0]?.name ??
            "Unknown",
        },
      }),
    ),
  };

  return mappedTemplate;
}

export type FullGymTemplate = NonNullable<
  Awaited<ReturnType<typeof getFullTemplate>>
>;
