import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { full_gym_template } from "@/types/models";

export default async function GetFullTemplate(
  sessionId: string
): Promise<full_gym_template> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("No session");
  }

  if (!sessionId) {
    throw new Error("Missing session ID");
  }

  const { data: template, error: templateError } = await supabase
    .from("gym_templates")
    .select(
      "id, name, user_id, updated_at, created_at, gym_template_exercises(id, exercise_id, superset_id, gym_exercises:exercise_id(name, equipment, muscle_group, main_group))"
    )
    .eq("user_id", session.user.id)
    .eq("id", sessionId)
    .single();

  if (templateError || !template) {
    handleError(templateError, {
      message: "Error fetching template",
      route: "/api/gym/get-full-template",
      method: "GET",
    });
    throw new Error(templateError?.message || "Error fetching template");
  }

  return template as full_gym_template;
}
