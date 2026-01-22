import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function unpinNotes(notesId: string) {
  const { error } = await supabase
    .from("notes")
    .update({ pinned: false })
    .eq("id", notesId);

  if (error) {
    handleError(error, {
      message: "Error unpinning notes",
      route: "/database/notes/unpin-notes",
      method: "UPDATE",
    });

    throw new Error("Error unpinning notes");
  }

  return { success: true };
}
