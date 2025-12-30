"use server";

import { handleError } from "@/app/(app)/utils/handleError";
import { createClient } from "@/utils/supabase/server";

export async function getFullTemplate(sessionId: string) {
  const supabase = await createClient();

  if (!sessionId) {
    throw new Error("Missing session ID");
  }

  const { data: template, error: templateError } = await supabase
    .from("gym_templates")
    .select(
      "id, name, created_at, updated_at, gym_template_exercises(id, exercise_id, position, superset_id, gym_exercises:exercise_id(name, equipment, muscle_group, main_group))"
    )
    .eq("id", sessionId)
    .single();

  console.log("template", template);

  if (templateError || !template) {
    console.log("error fetching template", templateError);
    handleError(templateError, {
      message: "Error fetching template",
      route: "/database/gym/templates/full-gym-template",
      method: "GET",
    });
    throw new Error("Error fetching template");
  }

  return template;
}
