"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

type SaveTemplateProps = {
  name: string;
  exercises: gym_template_exercises[];
};

type gym_template_exercises = {
  template_id?: string;
  exercise_id: string;
  position?: number;
  superset_id?: string;
};

export async function saveTemplateToDB({ exercises, name }: SaveTemplateProps) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: template, error: templateError } = await supabase
    .from("gym_templates")
    .insert([
      {
        user_id: user.sub,
        name,
      },
    ])
    .select()
    .single();

  if (templateError || !template) {
    handleError(templateError, {
      message: "Error creating template",
      route: "server-action: saveTemplateToDB",
      method: "direct",
    });
    throw new Error("Error creating template");
  }

  const templateExercises = exercises.map(
    (ex: gym_template_exercises, index: number) => ({
      template_id: template.id,
      user_id: user.sub,
      exercise_id: ex.exercise_id,
      position: index,
      superset_id: ex.superset_id || "",
    })
  );

  const { error: templateExerciseError } = await supabase
    .from("gym_template_exercises")
    .insert(templateExercises);

  if (templateExerciseError) {
    handleError(templateExerciseError, {
      message: "Error inserting template exercsises",
      route: "server-action: saveTemplateToDB",
      method: "direct",
    });
    throw new Error("Error inserting template exercsises");
  }

  return { success: true };
}

type EditTemplateProps = {
  id: string;
  name: string;
  exercises: gym_template_exercises[];
};

export async function editTemplate({ id, exercises, name }: EditTemplateProps) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error: templateError } = await supabase
    .from("gym_templates")
    .update({ name })
    .eq("id", id)
    .eq("user_id", user.sub);

  if (templateError) {
    handleError(templateError, {
      message: "Error updating template",
      route: "server-action: editTemplate",
      method: "direct",
    });
    throw new Error("Error updating template");
  }

  // 2. Delete old exercises
  await supabase
    .from("gym_template_exercises")
    .delete()
    .eq("template_id", id)
    .eq("user_id", user.sub);

  const templateExercises = exercises.map(
    (ex: gym_template_exercises, index: number) => ({
      template_id: id,
      user_id: user.sub,
      exercise_id: ex.exercise_id,
      position: index,
      superset_id: ex.superset_id || "",
    })
  );

  const { error: templateExerciseError } = await supabase
    .from("gym_template_exercises")
    .insert(templateExercises);

  if (templateExerciseError) {
    handleError(templateExerciseError, {
      message: "Error inserting template exercises",
      route: "server-action: editTemplate",
      method: "direct",
    });
    throw new Error("Error inserting template exercises");
  }

  return { success: true };
}

export async function getFullTemplate(id: string) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: template, error: templateError } = await supabase
    .from("gym_templates")
    .select("*, gym_template_exercises(*, gym_exercises:exercise_id(*))")
    .eq("user_id", user.sub)
    .eq("id", id)
    .single();

  if (templateError || !template) {
    handleError(templateError, {
      message: "Error fetching full-template",
      route: "server-action: getFullTemplate",
      method: "direct",
    });
    throw new Error("Error updating template");
  }

  return template;
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error: templateError } = await supabase
    .from("gym_templates")
    .delete()
    .eq("user_id", user.sub)
    .eq("id", id);

  if (templateError) {
    handleError(templateError, {
      message: "Error deleting template",
      route: "server-action: deleteTemplate",
      method: "direct",
    });
    throw new Error("Error deleteing template");
  }

  return { success: true };
}
