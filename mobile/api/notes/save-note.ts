import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type props = {
  title: string;
  notes: string;
};

export async function saveNote({ title, notes }: props) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    return { error: true, message: "No session" };
  }

  const { error } = await supabase
    .from("notes")
    .insert({ title, notes, user_id: session.user.id })
    .select()
    .single();

  if (error) {
    handleError(error, {
      message: "Error saving note",
      route: "/api/notes/save-note",
      method: "POST",
    });
    return { error: true, message: "Error saving note" };
  }

  return true;
}
