import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type props = {
  title: string;
  notes: string;
};

export async function saveNote({ title, notes }: props) {
  const { error } = await supabase.from("notes").insert({ title, notes });

  if (error) {
    handleError(error, {
      message: "Error saving note",
      route: "/database/notes/save-note",
      method: "POST",
    });
    throw new Error("Error saving note");
  }

  return true;
}
