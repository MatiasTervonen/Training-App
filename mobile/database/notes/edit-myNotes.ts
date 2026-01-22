import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type editNotesProps = {
  id: string;
  title: string;
  notes: string;
  updated_at: string;
};

export async function editNotes({ id, title, notes, updated_at }: editNotesProps) {
  const { data, error } = await supabase
    .from("notes")
    .update({ title, notes, updated_at })
    .eq("id", id)
    .select("id, title, notes, updated_at")
    .single();

  if (error) {
    handleError(error, {
      message: "Error editing notes",
      route: "/database/notes/edit-myNotes",
      method: "POST",
    });
    throw new Error("Error editing notes");
  }

  return data;
}
