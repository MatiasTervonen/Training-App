"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

type SaveNotesProps = {
  title?: string;
  notes: string;
};

export async function saveNotesToDB({ title, notes }: SaveNotesProps) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error: notesError } = await supabase.from("notes").insert([
    {
      user_id: user.sub,
      title,
      notes,
    },
  ]);

  if (notesError) {
    handleError(notesError, {
      message: "Error saving notes",
      route: "server-action: saveNotesToDB",
      method: "direct",
    });
    throw new Error("Failed to save notes");
  }

  return { success: true };
}

type EditNotesProp = {
  id: string;
  notes?: string | null | undefined;
  title?: string | null | undefined;
};

export async function editNotes({ id, title, notes }: EditNotesProp) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error: notesError } = await supabase
    .from("notes")
    .update({ title, notes })
    .eq("id", id)
    .eq("user_id", user.sub);

  if (notesError) {
    handleError(notesError, {
      message: "Error editing notes",
      route: "server-action: editNotes",
      method: "direct",
    });
    throw new Error("Failed to edit notes");
  }

  return { success: true };
}
