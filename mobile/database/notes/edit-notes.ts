import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type Props = {
  id: string;
  title: string;
  notes: string;
  updated_at: string;
};

export async function editNotes({ id, title, notes, updated_at }: Props) {
  const { data, error } = await supabase.rpc("notes_edit_note", {
    p_id: id,
    p_title: title,
    p_notes: notes,
    p_updated_at: updated_at,
  });

  if (error) {
    handleError(error, {
      message: "Error editing notes",
      route: "/database/notes/edit-notes",
      method: "POST",
    });
    throw new Error("Error editing notes");
  }

  return data;
}
