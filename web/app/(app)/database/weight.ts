"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

type SaveWeightProps = {
  title: string;
  notes?: string;
  weight: number;
};

export async function saveWeightToDB({
  title,
  notes,
  weight,
}: SaveWeightProps) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: notesData, error: notesError } = await supabase
    .from("weight")
    .insert([
      {
        user_id: user.sub,
        title,
        notes,
        weight,
      },
    ])
    .select()
    .single();

  if (notesError || !notesData) {
    handleError(notesError, {
      message: "Error saving notes",
      route: "server-action: saveNotesToDB",
      method: "direct",
    });
    throw new Error(notesError?.message || "Failed to save notes");
  }

  return { success: true, notes: notesData };
}

type EditWeightProp = {
  id: string;
  notes?: string | null | undefined;
  title?: string | null | undefined;
  weight: number | undefined;
};

export async function editWeight({ id, title, notes, weight }: EditWeightProp) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error: notesError } = await supabase
    .from("weight")
    .update({ title, notes, weight })
    .eq("id", id)
    .eq("user_id", user.sub);

  if (notesError) {
    handleError(notesError, {
      message: "Error editing weight",
      route: "server-action: editWeight",
      method: "direct",
    });
    throw new Error(notesError?.message || "Failed to edit weight");
  }

  return { success: true };
}
