import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function moveNoteToFolder(noteId: string, folderId: string) {
  const { error } = await supabase.rpc("notes_move_to_folder", {
    p_note_id: noteId,
    p_folder_id: folderId,
  });

  if (error) {
    handleError(error, {
      message: "Error moving note to folder",
      route: "/database/notes/move-note-to-folder",
      method: "POST",
    });
    throw new Error("Error moving note to folder");
  }
}
