import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function deleteFolder(folderId: string) {
  const { error } = await supabase
    .from("note_folders")
    .delete()
    .eq("id", folderId);

  if (error) {
    handleError(error, {
      message: "Error deleting folder",
      route: "/database/notes/delete-folder",
      method: "DELETE",
    });
    throw new Error("Error deleting folder");
  }
}
