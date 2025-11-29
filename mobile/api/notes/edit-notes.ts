import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type Props = {
  id: string;
  title: string | null | undefined;
  notes: string | null | undefined;
  updated_at: string;
};

export async function editNotes({ id, title, notes, updated_at }: Props) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("notes")
    .update({ title, notes, updated_at })
    .eq("id", id);

  if (error) {
    handleError(error, {
      message: "Error editing notes",
      route: "/database/notes/edit-notes",
      method: "POST",
    });
    throw new Error("Error editing notes");
  }

  return { success: true };
}
