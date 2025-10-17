import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type props = {
  id: string;
  title: string;
  notes: string;
  weight: number | undefined;
};

export async function editWeight({ title, notes, weight, id }: props) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    return { error: true, message: "No session" };
  }

  const { error: weightError, data: weightData } = await supabase
    .from("weight")
    .update({ title, notes, weight })
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (weightError || !weightData) {
    handleError(weightError, {
      message: "Error editing weight entry",
      route: "/api/weight/edit-weight",
      method: "GET",
    });
    return { error: true, message: "Error editing weight entry" };
  }

  return weightData;
}
