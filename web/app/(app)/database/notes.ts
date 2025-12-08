"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

type SaveNotesProps = {
  title?: string;
  notes: string;
};

export async function saveNotesToDB({ title, notes }: SaveNotesProps) {
  const supabase = await createClient();

  const { error: notesError } = await supabase.from("notes").insert([
    {
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
  notes?: string | null;
  title?: string | null;
  updated_at: string;
};

export async function editNotes({
  id,
  title,
  notes,
  updated_at,
}: EditNotesProp) {
  const supabase = await createClient();

  const { error: notesError } = await supabase
    .from("notes")
    .update({ title, notes, updated_at })
    .eq("id", id);

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
