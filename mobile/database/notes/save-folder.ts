import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function saveFolder(name: string) {
  const { data, error } = await supabase
    .from("note_folders")
    .insert({ name })
    .select()
    .single();

  if (error) {
    handleError(error, {
      message: "Error creating folder",
      route: "/database/notes/save-folder",
      method: "POST",
    });
    throw error;
  }

  return data;
}
