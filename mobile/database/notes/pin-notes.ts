import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function pinNotes(notesId: string) {
  const { error } = await supabase
    .from("notes")
    .update({ pinned: true })
    .eq("id", notesId);

  if (error) {
    handleError(error, {
      message: "Error deleting notes",
      route: "/database/notes/delete-notes",
      method: "DELETE",
    });

    throw new Error("Error deleting notes");
  }

  return { success: true };
}
