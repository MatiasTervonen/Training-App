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

  const { data: notesData, error: notesError } = await supabase
    .from("weight")
    .insert([
      {
        title,
        notes,
        weight,
      },
    ])
    .select()
    .single();

  if (notesError || !notesData) {
    handleError(notesError, {
      message: "Error saving weight",
      route: "server-action: saveWeightToDB",
      method: "direct",
    });
    throw new Error("Failed to save weight");
  }

  return { success: true, notes: notesData };
}

type EditWeightProp = {
  id: string;
  notes?: string | null;
  title: string;
  weight: number;
};

export async function editWeight({ id, title, notes, weight }: EditWeightProp) {
  const supabase = await createClient();

  const { error: notesError } = await supabase
    .from("weight")
    .update({ title, notes, weight })
    .eq("id", id)

  if (notesError) {
    handleError(notesError, {
      message: "Error editing weight",
      route: "server-action: editWeight",
      method: "direct",
    });
    throw new Error("Failed to edit weight");
  }

  return { success: true };
}

export async function getWeight() {
  const supabase = await createClient();

  const { data: weight, error: weightError } = await supabase
    .from("weight")
    .select("*")
    .order("created_at", { ascending: true });

  if (weightError || !weight) {
    handleError(weightError, {
      message: "Error fetching weight entries",
      route: "server-action: getWeight",
      method: "direct",
    });
    throw new Error("Unauthorized");
  }

  return weight;
}
