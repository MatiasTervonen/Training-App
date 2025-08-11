import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

type props = {
  title: string;
  notes: string;
  session: Session;
};

export async function saveNote({ title, notes, session }: props) {
  const { error } = await supabase
    .from("notes")
    .insert({ title, notes, user_id: session.user.id })
    .select()
    .single();

  if (error) {
    console.error("Error saving note:", error);
    return null;
  }

  return true;
}
