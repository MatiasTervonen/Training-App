import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getFullTemplate(sessionId: string) {


  if (!sessionId) {
    throw new Error("Missing session ID");
  }

  const { data: template, error: templateError } = await supabase
    .from("gym_templates")
    .select(
      "id, name, created_at, gym_template_exercises(id, exercise_id, sets, reps, superset_id, gym_exercises:exercise_id(name, equipment, muscle_group, main_group))"
    )
    .eq("id", sessionId)
    .single();

  if (templateError || !template) {
    handleError(templateError, {
      message: "Error fetching template",
      route: "/database/gym/get-full-template",
      method: "GET",
    });
    throw new Error("Error fetching template");
  }

  return template;
}
