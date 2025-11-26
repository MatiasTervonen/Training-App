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
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("weight")
    .insert({ title, notes, weight, user_id: session.user.id })
    .select()
    .single();

  if (error) {
    handleError(error, {
      message: "Error saving weight",
      route: "/database/weight/save-weight",
      method: "POST",
    });
    throw new Error("Error saving weight");
  }

  return true;
}
