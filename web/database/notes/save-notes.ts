import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

type props = {
  title: string;
  notes: string;
  folderId?: string | null;
};

export async function saveNote({ title, notes, folderId }: props) {
  const supabase = createClient();

  const { error } = await supabase.rpc("notes_save_note", {
    p_title: title,
    p_notes: notes,
    p_folder_id: folderId ?? null,
  });

  if (error) {
    console.log("save note error", error);
    handleError(error, {
      message: "Error saving note",
      route: "/database/notes/save-note",
      method: "POST",
    });
    throw new Error("Error saving note");
  }

  return true;
}
