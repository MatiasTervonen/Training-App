import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function renameFolder(folderId: string, newName: string) {
  const { data, error } = await supabase
    .from("note_folders")
    .update({ name: newName, updated_at: new Date().toISOString() })
    .eq("id", folderId)
    .select()
    .single();

  if (error) {
    handleError(error, {
      message: "Error renaming folder",
      route: "/database/notes/rename-folder",
      method: "PATCH",
    });
    throw error;
  }

  return data;
}
