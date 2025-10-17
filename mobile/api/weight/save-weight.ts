import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type props = {
  title: string;
  notes: string;
  weight: number | undefined;
};

export async function saveWeight({ title, notes, weight }: props) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    return { error: true, message: "No session" };
  }

  const { error } = await supabase
    .from("weight")
    .insert({ title, notes, weight, user_id: session.user.id })
    .select()
    .single();
1
  if (error) {
    handleError(error, {
      message: "Error saving weight",
      route: "/api/weight/save-weight",
      method: "POST",
    });
    return { error: true, message: "Error saving weight" };
  }

  return true;
}
